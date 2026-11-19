import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { trackerSessions, processedOperations } from '../schema.js';
import { getAuthenticatedUserId, formatSessionRow, advanceIntelOnConsumption } from '../lib/session-helper.js';

export default async function (input, ctx) {
  const userId = getAuthenticatedUserId(ctx);
  const { sessionId, shell, expectedVersion, operationId } = input || {};

  if (!sessionId) {
    throw new EndpointError('Session ID is required', { code: 'VALIDATION_ERROR' });
  }
  if (shell !== 'live' && shell !== 'blank' && shell !== 'unknown') {
    throw new EndpointError('Invalid shell type for ejection.', { code: 'VALIDATION_ERROR' });
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

  if (session.status !== 'active') {
    throw new EndpointError('Session is already completed.', { code: 'VALIDATION_ERROR' });
  }

  // Optimistic concurrency check
  if (typeof expectedVersion === 'number' && session.version !== expectedVersion) {
    throw new EndpointError('Session state is out of date.', {
      code: 'VERSION_CONFLICT',
      latestSession: formatSessionRow(session),
    });
  }

  const totalRemaining = session.liveRemaining + session.blankRemaining;
  if (totalRemaining <= 0) {
    throw new EndpointError('No shells remaining in chamber.', { code: 'OUT_OF_STOCK' });
  }

  let currentIntel = [];
  try {
    currentIntel = JSON.parse(session.intelJson || '[]');
  } catch {
    currentIntel = [];
  }

  // If unknown, check if position 1 is known
  let effectiveShell = shell;
  if (effectiveShell === 'unknown') {
    const knownPos1 = currentIntel.find((i) => i.positionFromCurrent === 1);
    if (knownPos1) {
      effectiveShell = knownPos1.shellType;
    }
  }

  if (effectiveShell === 'live' && session.liveRemaining <= 0) {
    throw new EndpointError('No live shells remaining to eject.', { code: 'OUT_OF_STOCK' });
  }
  if (effectiveShell === 'blank' && session.blankRemaining <= 0) {
    throw new EndpointError('No blank shells remaining to eject.', { code: 'OUT_OF_STOCK' });
  }

  const now = Date.now();
  let newLive = session.liveRemaining;
  let newBlank = session.blankRemaining;

  if (effectiveShell === 'live') {
    newLive = session.liveRemaining - 1;
  } else if (effectiveShell === 'blank') {
    newBlank = session.blankRemaining - 1;
  }

  const isCompleted = newLive === 0 && newBlank === 0;
  const previousIntel = [...currentIntel];
  const updatedIntel = isCompleted ? [] : advanceIntelOnConsumption(currentIntel);

  let events = [];
  try {
    events = JSON.parse(session.eventsJson || '[]');
  } catch {
    events = [];
  }

  const eventId = operationId || `eject_${now}_${Math.random().toString(36).slice(2, 7)}`;
  events.push({
    id: eventId,
    type: 'eject',
    shell: effectiveShell,
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
