import { db } from 'sdk';
import { requireOwner } from '../lib/auth/require-owner.js';
import {
  trackerSessions,
  users,
  activityEvents,
  broadcastCampaigns,
  broadcastRecipients,
  feedbackReports,
} from '../schema.js';

export default async function (input, ctx) {
  requireOwner(ctx);

  const startCheck = Date.now();
  let dbHealthy = true;
  let dbLatencyMs = 0;

  try {
    const pingStart = Date.now();
    await db.$count(users);
    dbLatencyMs = Date.now() - pingStart;
  } catch (err) {
    dbHealthy = false;
  }

  const [totalUsers, totalSessions, totalEvents, campaigns, recipients, feedbackCount] =
    await Promise.all([
      db.$count(users).catch(() => 0),
      db.$count(trackerSessions).catch(() => 0),
      db.$count(activityEvents).catch(() => 0),
      db.select().from(broadcastCampaigns).all().catch(() => []),
      db.select().from(broadcastRecipients).all().catch(() => []),
      db.$count(feedbackReports).catch(() => 0),
    ]);

  const pendingRecipients = recipients.filter((r) => r.status === 'pending').length;
  const failedRecipients = recipients.filter(
    (r) => r.status === 'failed_permanent' || r.status === 'failed_retryable'
  ).length;

  const runningCampaigns = campaigns.filter((c) => c.status === 'running').length;

  return {
    ok: true,
    health: {
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: Date.now(),
      checkDurationMs: Date.now() - startCheck,
      database: {
        healthy: dbHealthy,
        latencyMs: dbLatencyMs,
        walMode: true,
      },
      counts: {
        totalUsers,
        totalSessions,
        totalEvents,
        totalCampaigns: campaigns.length,
        runningCampaigns,
        pendingRecipients,
        failedRecipients,
        feedbackCount,
      },
      version: '1.2.0',
    },
  };
}

