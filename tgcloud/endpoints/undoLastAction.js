import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { trackerSessions, processedOperations } from '../schema.js';
import { getAuthenticatedUserId, formatSessionRow } from '../lib/session-helper.js';

export default async function (input, ctx) {
  const userId = getAuthenticatedUserId(ctx);
  const { sessionId, expectedVersion, operationId } = input || {};

  if (!sessionId) {
    throw new EndpointError('Session ID is required', { code: 'VALIDATION_ERROR' });
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

  let events = [];
  try {
    events = JSON.parse(session.eventsJson || '[]');
  } catch {
    events = [];
  }

  if (events.length === 0) {
    throw new EndpointError('No actions available to undo', { code: 'VALIDATION_ERROR' });
  }

  const lastEvent = events.pop();
  let restoredLive = session.liveRemaining;
  let restoredBlank = session.blankRemaining;

  if (lastEvent.type === 'shot') {
    if (lastEvent.shell === 'live') {
      restoredLive += 1;
    } else if (lastEvent.shell === 'blank') {
      restoredBlank += 1;
    }
  } else if (lastEvent.type === 'eject' && lastEvent.shell !== 'unknown') {
    if (lastEvent.shell === 'live') {
      restoredLive += 1;
    } else if (lastEvent.shell === 'blank') {
      restoredBlank += 1;
    }
  } else {
    throw new EndpointError('Cannot undo unknown shell action', { code: 'VALIDATION_ERROR' });
  }

  const now = Date.now();
  const nextVersion = session.version + 1;
  const newStatus = (restoredLive > 0 || restoredBlank > 0) ? 'active' : 'completed';

  let restoredIntel = [];
  if (Array.isArray(lastEvent.previousIntel)) {
    restoredIntel = lastEvent.previousIntel;
  } else {
    try {
      const currentIntel = JSON.parse(session.intelJson || '[]');
      restoredIntel = currentIntel.map((i) => ({
        ...i,
        positionFromCurrent: i.positionFromCurrent + 1,
      }));
    } catch {
      restoredIntel = [];
    }
  }

  await db
    .update(trackerSessions)
    .set({
      liveRemaining: restoredLive,
      blankRemaining: restoredBlank,
      status: newStatus,
      eventsJson: JSON.stringify(events),
      intelJson: JSON.stringify(restoredIntel),
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
