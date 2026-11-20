import { db } from 'sdk';
import { eq, gte, lte, and } from 'sdk/db';
import { users, activityEvents, trackerSessions } from '../../schema.js';

export const TIME_PRESETS = ['24h', '7d', '30d', '90d', '180d', '365d', 'custom'];

/**
 * Resolves window boundaries based on preset or explicit start/end timestamps.
 * All calculation is UTC-normalized.
 */
export function resolveTimeWindow(preset = '7d', customStart = null, customEnd = null) {
  const now = Date.now();
  let startTime = now - 7 * 86400 * 1000;
  let endTime = now;
  let periodLabel = 'Last 7 Days (7d)';

  switch (preset) {
    case '24h':
      startTime = now - 24 * 3600 * 1000;
      periodLabel = 'Last 24 Hours (24h)';
      break;
    case '7d':
      startTime = now - 7 * 86400 * 1000;
      periodLabel = 'Last 7 Days (7d)';
      break;
    case '30d':
      startTime = now - 30 * 86400 * 1000;
      periodLabel = 'Last 30 Days (30d)';
      break;
    case '90d':
      startTime = now - 90 * 86400 * 1000;
      periodLabel = 'Last 90 Days (90d)';
      break;
    case '180d':
      startTime = now - 180 * 86400 * 1000;
      periodLabel = 'Last 180 Days (180d)';
      break;
    case '365d':
      startTime = now - 365 * 86400 * 1000;
      periodLabel = 'Last 365 Days (365d)';
      break;
    case 'custom':
      if (customStart && customEnd) {
        startTime = Math.min(Number(customStart), Number(customEnd));
        endTime = Math.max(Number(customStart), Number(customEnd));
        periodLabel = `Custom Range (${new Date(startTime).toISOString().slice(0, 10)} to ${new Date(endTime).toISOString().slice(0, 10)})`;
      }
      break;
    default:
      startTime = now - 7 * 86400 * 1000;
      periodLabel = 'Last 7 Days (7d)';
  }

  const duration = endTime - startTime;
  const previousStartTime = startTime - duration;
  const previousEndTime = startTime;

  return {
    preset,
    startTime,
    endTime,
    duration,
    periodLabel,
    previousStartTime,
    previousEndTime,
    timezone: 'UTC',
  };
}

/**
 * Computes dashboard overview and analytics metrics for a given time window.
 */
export async function getAnalyticsMetrics(windowParams) {
  const { startTime, endTime, previousStartTime, previousEndTime } = windowParams;

  // Total registered/observed users all-time
  const allUsers = await db.select().from(users).all();
  const totalUsers = allUsers.length;

  // New users in period
  const newUsers = allUsers.filter(
    (u) => u.firstSeenAt >= startTime && u.firstSeenAt <= endTime
  ).length;

  // New users in prior period (for comparison)
  const priorNewUsers = allUsers.filter(
    (u) => u.firstSeenAt >= previousStartTime && u.firstSeenAt <= previousEndTime
  ).length;

  // Fetch events in current period and previous period
  const periodEvents = await db
    .select()
    .from(activityEvents)
    .where(and(gte(activityEvents.occurredAt, startTime), lte(activityEvents.occurredAt, endTime)))
    .all();

  const priorEvents = await db
    .select()
    .from(activityEvents)
    .where(
      and(
        gte(activityEvents.occurredAt, previousStartTime),
        lte(activityEvents.occurredAt, previousEndTime)
      )
    )
    .all();

  // Active users in period (distinct users with at least 1 event in interval)
  const activeUserSet = new Set(periodEvents.map((e) => e.telegramUserId));
  const activeUsersCount = activeUserSet.size;

  const priorActiveUserSet = new Set(priorEvents.map((e) => e.telegramUserId));
  const priorActiveUsersCount = priorActiveUserSet.size;

  // Returning users: active in period whose firstSeenAt < startTime
  let returningUsersCount = 0;
  for (const tgId of activeUserSet) {
    const u = allUsers.find((user) => user.telegramId === tgId);
    if (u && u.firstSeenAt < startTime) {
      returningUsersCount++;
    }
  }

  // App opens
  const appOpens = periodEvents.filter((e) => e.eventType === 'app_opened').length;
  const priorAppOpens = priorEvents.filter((e) => e.eventType === 'app_opened').length;

  // Sessions created
  const sessionsCreated = periodEvents.filter((e) => e.eventType === 'session_created').length;
  const sessionsCompleted = periodEvents.filter((e) => e.eventType === 'session_completed').length;
  const sessionsAbandoned = periodEvents.filter((e) => e.eventType === 'session_abandoned').length;

  // Total actions recorded (shots, ejections, intel, undo)
  const actionsRecorded = periodEvents.filter((e) =>
    ['shot_recorded', 'shell_ejected', 'shell_intel_added', 'shell_intel_removed', 'undo_executed'].includes(
      e.eventType
    )
  ).length;

  // Event breakdown by type
  const eventBreakdown = {};
  for (const ev of periodEvents) {
    eventBreakdown[ev.eventType] = (eventBreakdown[ev.eventType] || 0) + 1;
  }

  // Calculate DAU / WAU / MAU (rolling anchors from now)
  const now = Date.now();
  const dauStart = now - 24 * 3600 * 1000;
  const wauStart = now - 7 * 86400 * 1000;
  const mauStart = now - 30 * 86400 * 1000;

  const recentEvents = await db
    .select()
    .from(activityEvents)
    .where(gte(activityEvents.occurredAt, mauStart))
    .all();

  const dauSet = new Set(
    recentEvents.filter((e) => e.occurredAt >= dauStart).map((e) => e.telegramUserId)
  );
  const wauSet = new Set(
    recentEvents.filter((e) => e.occurredAt >= wauStart).map((e) => e.telegramUserId)
  );
  const mauSet = new Set(recentEvents.map((e) => e.telegramUserId));

  // Time-series buckets
  const timeSeries = generateTimeSeriesBuckets(startTime, endTime, periodEvents);

  return {
    window: windowParams,
    totals: {
      totalUsers,
      activeUsers: activeUsersCount,
      newUsers,
      returningUsers: returningUsersCount,
      totalEvents: periodEvents.length,
      appOpens,
      sessionsCreated,
      sessionsCompleted,
      sessionsAbandoned,
      actionsRecorded,
      avgSessionsPerActiveUser:
        activeUsersCount > 0 ? Number((sessionsCreated / activeUsersCount).toFixed(2)) : 0,
      avgActionsPerActiveUser:
        activeUsersCount > 0 ? Number((actionsRecorded / activeUsersCount).toFixed(2)) : 0,
    },
    activityTrends: {
      dau: dauSet.size,
      wau: wauSet.size,
      mau: mauSet.size,
    },
    comparison: {
      priorNewUsers,
      priorActiveUsers: priorActiveUsersCount,
      priorEvents: priorEvents.length,
      priorAppOpens,
    },
    eventBreakdown,
    timeSeries,
  };
}

/**
 * Builds chronological time series histogram buckets for charts.
 */
function generateTimeSeriesBuckets(startTime, endTime, events) {
  const duration = endTime - startTime;
  let bucketSize = 3600 * 1000; // 1 hour default

  if (duration > 60 * 86400 * 1000) {
    bucketSize = 7 * 86400 * 1000; // 1 week
  } else if (duration > 48 * 3600 * 1000) {
    bucketSize = 86400 * 1000; // 1 day
  }

  const buckets = [];
  let cur = startTime;
  while (cur < endTime) {
    const next = Math.min(cur + bucketSize, endTime);
    const inBucket = events.filter((e) => e.occurredAt >= cur && e.occurredAt < next);
    buckets.push({
      timestamp: cur,
      label: new Date(cur).toISOString().slice(0, bucketSize >= 86400 * 1000 ? 10 : 16),
      eventsCount: inBucket.length,
      sessionsCount: inBucket.filter((e) => e.eventType === 'session_created').length,
      activeUsersCount: new Set(inBucket.map((e) => e.telegramUserId)).size,
    });
    cur = next;
  }
  return buckets;
}
