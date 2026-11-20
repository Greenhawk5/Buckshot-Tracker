import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { trackerSessions, processedOperations } from '../schema.js';
import {
  getAuthenticatedUserId,
  formatSessionRow,
  advanceIntelOnConsumption,
  trackUserAndActivity,
  checkMaintenanceAccess,
} from '../lib/session-helper.js';

export default async function (input, ctx) {
  await checkMaintenanceAccess(ctx);
  const userId = getAuthenticatedUserId(ctx);
  const { sessionId, shell, expectedVersion, operationId } = input || {};

  if (!sessionId) {
    throw new EndpointError('Session ID is required', { code: 'VALIDATION_ERROR' });
  }
  if (shell !== 'live' && shell !== 'blank') {
    throw new EndpointError('Invalid shell type. Must be live or blank.', { code: 'VALIDATION_ERROR' });
  }

  // Idempotency check
  if (operationId) {
    const existingOp = await db
      .select()
      .from(processedOperations)
      .where(and(eq(processedOperations.operationId, operationId), eq(processedOperations.telegramUserId, userId)))
      .get();

    if (existingOp) {
      const current = await db
        .select()
        .from(trackerSessions)
        .where(eq(trackerSessions.id, sessionId))
        .get();
      if (current) {
        return { ok: true, session: formatSessionRow(current) };
      }
    }
  }

  // Retrieve current session
  const session = await db
    .select()
    .from(trackerSessions)
    .where(and(eq(trackerSessions.id, sessionId), eq(trackerSessions.telegramUserId, userId)))
    .get();

  if (!session) {
    throw new EndpointError('Session not found', { code: 'NOT_FOUND' });
  }

  // Optimistic concurrency check
  if (typeof expectedVersion === 'number' && session.version !== expectedVersion) {
    throw new EndpointError('Session state is out of date.', {
      code: 'VERSION_CONFLICT',
      latestSession: formatSessionRow(session),
    });
  }

  // Validate stock
  if (shell === 'live' && session.liveRemaining <= 0) {
    throw new EndpointError('No live shells remaining in chamber.', { code: 'OUT_OF_STOCK' });
  }
  if (shell === 'blank' && session.blankRemaining <= 0) {
    throw new EndpointError('No blank shells remaining in chamber.', { code: 'OUT_OF_STOCK' });
  }

  const now = Date.now();
  const newLive = shell === 'live' ? session.liveRemaining - 1 : session.liveRemaining;
  const newBlank = shell === 'blank' ? session.blankRemaining - 1 : session.blankRemaining;
  const isCompleted = newLive === 0 && newBlank === 0;

  let events = [];
  try {
    events = JSON.parse(session.eventsJson || '[]');
  } catch {
    events = [];
  }

  let currentIntel = [];
  try {
    currentIntel = JSON.parse(session.intelJson || '[]');
  } catch {
    currentIntel = [];
  }

  const previousIntel = [...currentIntel];
  const updatedIntel = isCompleted ? [] : advanceIntelOnConsumption(currentIntel);

  const eventId = operationId || `shot_${now}_${Math.random().toString(36).slice(2, 7)}`;
  events.push({
    id: eventId,
    type: 'shot',
    shell,
    previousIntel,
    createdAt: now,
  });

  const nextVersion = session.version + 1;

  await db
    .update(trackerSessions)
    .set({
      liveRemaining: newLive,
      blankRemaining: newBlank,
      status: isCompleted ? 'completed' : 'active',
      eventsJson: JSON.stringify(events),
      intelJson: JSON.stringify(updatedIntel),
      version: nextVersion,
      updatedAt: now,
    })
    .where(eq(trackerSessions.id, sessionId))
    .run();

  if (operationId) {
    await db.insert(processedOperations).values({
      operationId,
      telegramUserId: userId,
      sessionId,
      createdAt: now,
    }).run();
  }

  // Track shot_recorded event and completion if applicable
  await trackUserAndActivity(ctx, {
    eventType: 'shot_recorded',
    sessionId,
    metadata: { shell, liveRemaining: newLive, blankRemaining: newBlank },
    eventId: operationId ? `ev_shot_${operationId}` : null,
  });

  if (isCompleted) {
    await trackUserAndActivity(ctx, {
      eventType: 'session_completed',
      sessionId,
      metadata: { initialLive: session.initialLive, initialBlank: session.initialBlank },
      eventId: operationId ? `ev_comp_${operationId}` : null,
    });
  }

  const updated = await db
    .select()
    .from(trackerSessions)
    .where(eq(trackerSessions.id, sessionId))
    .get();

  return {
    ok: true,
    session: formatSessionRow(updated),
  };
}
