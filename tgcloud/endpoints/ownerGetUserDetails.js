import { db, EndpointError } from 'sdk';
import { eq, desc } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { users, trackerSessions, activityEvents, broadcastRecipients, broadcastCampaigns } from '../schema.js';

export default async function (input, ctx) {
  requireOwner(ctx);

  const { telegramUserId } = input || {};
  if (!telegramUserId) {
    throw new EndpointError('telegramUserId is required', { code: 'VALIDATION_ERROR' });
  }

  const tgIdStr = String(telegramUserId);

  const user = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, tgIdStr))
    .get();

  if (!user) {
    throw new EndpointError('User not found in registry', { code: 'NOT_FOUND' });
  }

  // Get user sessions
  const sessions = await db
    .select()
    .from(trackerSessions)
    .where(eq(trackerSessions.telegramUserId, tgIdStr))
    .orderBy(desc(trackerSessions.createdAt))
    .all();

  // Get recent activity events
  const events = await db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.telegramUserId, tgIdStr))
    .orderBy(desc(activityEvents.occurredAt))
    .all();

  // Get broadcast recipient history
  const recipientRows = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.telegramUserId, tgIdStr))
    .orderBy(desc(broadcastRecipients.createdAt))
    .all();

  return {
    ok: true,
    user,
    stats: {
      totalSessions: sessions.length,
      completedSessions: sessions.filter((s) => s.status === 'completed').length,
      totalEvents: events.length,
    },
    recentEvents: events.slice(0, 30),
    recentSessions: sessions.slice(0, 10),
    broadcastHistory: recipientRows.slice(0, 20),
  };
}
