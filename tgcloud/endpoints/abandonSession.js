import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { trackerSessions } from '../schema.js';
import { getAuthenticatedUserId } from '../lib/session-helper.js';

export default async function (input, ctx) {
  const userId = getAuthenticatedUserId(ctx);
  const { sessionId, expectedVersion } = input || {};

  if (!sessionId) {
    throw new EndpointError('Session ID is required', { code: 'VALIDATION_ERROR' });
  }

  const session = await db
    .select()
    .from(trackerSessions)
    .where(and(eq(trackerSessions.id, sessionId), eq(trackerSessions.telegramUserId, userId)))
    .get();

  if (!session) {
    throw new EndpointError('Session not found', { code: 'NOT_FOUND' });
  }

  if (typeof expectedVersion === 'number' && session.version !== expectedVersion) {
    throw new EndpointError('Session state is out of date.', { code: 'VERSION_CONFLICT' });
  }

  const now = Date.now();
  await db
    .update(trackerSessions)
    .set({
      status: 'abandoned',
      updatedAt: now,
    })
    .where(eq(trackerSessions.id, sessionId))
    .run();

  return {
    ok: true,
    success: true,
  };
}
