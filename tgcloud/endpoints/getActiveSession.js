import { db } from 'sdk';
import { eq, and, desc } from 'sdk/db';
import { trackerSessions } from '../schema.js';
import { getAuthenticatedUserId, formatSessionRow } from '../lib/session-helper.js';

export default async function (input, ctx) {
  const userId = getAuthenticatedUserId(ctx);

  const row = await db
    .select()
    .from(trackerSessions)
    .where(and(eq(trackerSessions.telegramUserId, userId), eq(trackerSessions.status, 'active')))
    .orderBy(desc(trackerSessions.updatedAt))
    .get();

  return {
    ok: true,
    session: formatSessionRow(row),
  };
}
