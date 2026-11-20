import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { trackerSessions, processedOperations } from '../schema.js';
import { getAuthenticatedUserId, formatSessionRow, trackUserAndActivity } from '../lib/session-helper.js';

export default async function (input, ctx) {
  const userId = getAuthenticatedUserId(ctx);
  const { initialLive, initialBlank, operationId } = input || {};

  // Idempotency check
  if (operationId) {
    const existingOp = await db
      .select()
      .from(processedOperations)
      .where(and(eq(processedOperations.operationId, operationId), eq(processedOperations.telegramUserId, userId)))
      .get();

    if (existingOp) {
      const existingSession = await db
        .select()
        .from(trackerSessions)
        .where(eq(trackerSessions.id, existingOp.sessionId))
        .get();
      if (existingSession) {
        return { ok: true, session: formatSessionRow(existingSession) };
      }
    }
  }

  // Validate counts
  if (typeof initialLive !== 'number' || !Number.isInteger(initialLive) || initialLive < 0) {
    throw new EndpointError('Invalid live shell count', { code: 'VALIDATION_ERROR' });
  }
  if (typeof initialBlank !== 'number' || !Number.isInteger(initialBlank) || initialBlank < 0) {
    throw new EndpointError('Invalid blank shell count', { code: 'VALIDATION_ERROR' });
  }
  if (initialLive + initialBlank <= 0 || initialLive + initialBlank > 16) {
    throw new EndpointError('Total shell count must be between 1 and 16', { code: 'VALIDATION_ERROR' });
  }

  const now = Date.now();
  const sessionId = operationId || `sess_${now}_${Math.random().toString(36).slice(2, 9)}`;

  // Mark any existing active sessions as replaced
  await db
    .update(trackerSessions)
    .set({ status: 'replaced', updatedAt: now })
    .where(and(eq(trackerSessions.telegramUserId, userId), eq(trackerSessions.status, 'active')))
    .run();

  // Create new session row
  await db.insert(trackerSessions).values({
    id: sessionId,
    telegramUserId: userId,
    initialLive,
    initialBlank,
    liveRemaining: initialLive,
    blankRemaining: initialBlank,
    status: 'active',
    eventsJson: '[]',
    version: 1,
    createdAt: now,
    updatedAt: now,
  }).run();

  // Record operation for idempotency
  if (operationId) {
    await db.insert(processedOperations).values({
      operationId,
      telegramUserId: userId,
      sessionId,
      createdAt: now,
    }).run();
  }

  // Record session_created event and update user registry
  await trackUserAndActivity(ctx, {
    eventType: 'session_created',
    sessionId,
    metadata: { initialLive, initialBlank },
    eventId: operationId ? `ev_sess_${operationId}` : null,
  });

  const inserted = await db
    .select()
    .from(trackerSessions)
    .where(eq(trackerSessions.id, sessionId))
    .get();

  return {
    ok: true,
    session: formatSessionRow(inserted),
  };
}
