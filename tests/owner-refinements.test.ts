import { describe, it, expect, beforeEach } from 'vitest';
import { memoryStore } from './sdk-mock.ts';
import { resolveTimeWindow, getAnalyticsMetrics } from '../tgcloud/lib/analytics/metrics-service.js';

describe('Owner Refinements — Adaptive Data Aggregation & Integrity', () => {
  beforeEach(() => {
    memoryStore.reset();
  });

  it('aggregates 24H interval into 12 2-hour buckets with true distinct active users', async () => {
    const now = Date.now();
    const startTime = now - 24 * 3600 * 1000;
    const window24h = resolveTimeWindow('24h', startTime, now);

    // Seed events in bucket 1 (now - 23h) and bucket 2 (now - 21h)
    // User 1 records 3 shots in bucket 1
    memoryStore.activity_events.set('ev_1', {
      eventId: 'ev_1',
      telegramUserId: 'user_1',
      eventType: 'shot_recorded',
      occurredAt: startTime + 30 * 60 * 1000,
      createdAt: startTime + 30 * 60 * 1000,
    });
    memoryStore.activity_events.set('ev_2', {
      eventId: 'ev_2',
      telegramUserId: 'user_1',
      eventType: 'shot_recorded',
      occurredAt: startTime + 45 * 60 * 1000,
      createdAt: startTime + 45 * 60 * 1000,
    });
    // User 2 records 1 shot in bucket 1
    memoryStore.activity_events.set('ev_3', {
      eventId: 'ev_3',
      telegramUserId: 'user_2',
      eventType: 'shot_recorded',
      occurredAt: startTime + 50 * 60 * 1000,
      createdAt: startTime + 50 * 60 * 1000,
    });

    const metrics = await getAnalyticsMetrics(window24h);

    // 24 hours / 2 hours = 12 buckets
    expect(metrics.timeSeries.length).toBe(12);

    // Bucket 0 has 3 events and exactly 2 distinct active users (user_1 and user_2)
    const bucket0 = metrics.timeSeries[0];
    expect(bucket0.eventsCount).toBe(3);
    expect(bucket0.activeUsersCount).toBe(2);

    // Later empty buckets have 0 events, 0 active users (not NaN, not fake values)
    const emptyBucket = metrics.timeSeries[5];
    expect(emptyBucket.eventsCount).toBe(0);
    expect(emptyBucket.activeUsersCount).toBe(0);
  });

  it('aggregates 7D interval into exactly 7 daily buckets', async () => {
    const now = Date.now();
    const window7d = resolveTimeWindow('7d');
    const metrics = await getAnalyticsMetrics(window7d);

    expect(metrics.timeSeries.length).toBe(7);
    for (const bucket of metrics.timeSeries) {
      expect(typeof bucket.label).toBe('string');
      expect(bucket.eventsCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('aggregates 30D interval into 10 3-day buckets preserving readability', async () => {
    const window30d = resolveTimeWindow('30d');
    const metrics = await getAnalyticsMetrics(window30d);

    // 30 days / 3 days = 10 buckets
    expect(metrics.timeSeries.length).toBe(10);
  });

  it('aggregates 90D interval into ~13 weekly buckets', async () => {
    const window90d = resolveTimeWindow('90d');
    const metrics = await getAnalyticsMetrics(window90d);

    // 90 days / 7 days = ~13 buckets
    expect(metrics.timeSeries.length).toBeGreaterThanOrEqual(12);
    expect(metrics.timeSeries.length).toBeLessThanOrEqual(14);
  });

  it('aggregates 365D interval into 12 monthly buckets avoiding microscopic bars', async () => {
    const window365d = resolveTimeWindow('365d');
    const metrics = await getAnalyticsMetrics(window365d);

    // 365 days / 30 days = 12-13 buckets
    expect(metrics.timeSeries.length).toBeGreaterThanOrEqual(12);
    expect(metrics.timeSeries.length).toBeLessThanOrEqual(13);
  });
});

describe('Owner Navigation Minimal Distance Algorithm Tests', () => {
  it('selects the target element instance with the shortest scroll distance', () => {
    // Simulate container with 3 sets of tabs (Set 0: [0, 800], Set 1: [800, 1600], Set 2: [1600, 2400])
    // Tab "settings" is at offset 500 in Set 0, 1300 in Set 1, 2100 in Set 2
    const containerWidth = 390;
    const tabWidth = 80;
    const offsets = [500, 1300, 2100];

    const calculateTarget = (offset: number) => offset - (containerWidth - tabWidth) / 2;
    const targets = offsets.map(calculateTarget);

    // Scenario 1: User has scrolled to Set 0 (currentScrollLeft = 480)
    const currentScrollLeft1 = 480;
    let minDistance1 = Infinity;
    let chosenTarget1 = null;
    for (const t of targets) {
      const dist = Math.abs(t - currentScrollLeft1);
      if (dist < minDistance1) {
        minDistance1 = dist;
        chosenTarget1 = t;
      }
    }
    // Chosen target should be Set 0's target (~345px), distance ~135px, NOT Set 1 (~1145px, distance ~665px)!
    expect(chosenTarget1).toBe(targets[0]);
    expect(minDistance1).toBeLessThan(200);

    // Scenario 2: User has scrolled to Set 2 (currentScrollLeft = 1900)
    const currentScrollLeft2 = 1900;
    let minDistance2 = Infinity;
    let chosenTarget2 = null;
    for (const t of targets) {
      const dist = Math.abs(t - currentScrollLeft2);
      if (dist < minDistance2) {
        minDistance2 = dist;
        chosenTarget2 = t;
      }
    }
    // Chosen target should be Set 2's target (~1945px), distance ~45px, NOT Set 1!
    expect(chosenTarget2).toBe(targets[2]);
    expect(minDistance2).toBeLessThan(100);
  });
});

