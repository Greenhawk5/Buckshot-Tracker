import { describe, it, expect, beforeEach } from 'vitest';
import { memoryStore } from './sdk-mock.ts';
import { upsertObservedUser, checkUserRestriction, getUserByTelegramId, OWNER_TELEGRAM_ID } from '../tgcloud/lib/users/user-service.js';
import { recordActivityEvent } from '../tgcloud/lib/analytics/event-service.js';
import { resolveTimeWindow, getAnalyticsMetrics } from '../tgcloud/lib/analytics/metrics-service.js';
import recordAppOpenEndpoint from '../tgcloud/endpoints/recordAppOpen.js';

describe('User Registry & Activity Tracking Unit Suite — Phase 2', () => {
  beforeEach(() => {
    memoryStore.reset();
  });

  it('upserts a new user with proper default flags and Unicode profile handling', async () => {
    const tgUser = {
      id: 123456789,
      first_name: 'علي', // Persian Unicode
      last_name: 'Fanián 🎲',
      username: 'alifanian',
      language_code: 'fa',
    };

    const inserted = await upsertObservedUser(tgUser, { isAppOpen: true });
    expect(inserted).not.toBeNull();
    expect(inserted.telegramId).toBe('123456789');
    expect(inserted.firstName).toBe('علي');
    expect(inserted.lastName).toBe('Fanián 🎲');
    expect(inserted.isBlocked).toBe(false);
    expect(inserted.isVip).toBe(false);
    expect(inserted.hideName).toBe(false);
    expect(inserted.lastAppOpenedAt).toBeTypeOf('number');

    const inDb = await getUserByTelegramId('123456789');
    expect(inDb).not.toBeNull();
    expect(inDb.firstName).toBe('علي');
  });

  it('updates existing user profile while preserving private owner notes and aliases', async () => {
    // Initial insert
    await upsertObservedUser({
      id: 123456789,
      first_name: 'Original',
      username: 'orig_user',
    });

    // Owner sets private alias and notes directly
    const stored = memoryStore.users.get('123456789');
    stored.displayAlias = 'High Roller';
    stored.ownerNotes = 'VIP Playtester';
    stored.isVip = true;

    // User later changes their Telegram name and username
    const updated = await upsertObservedUser({
      id: 123456789,
      first_name: 'NewName',
      username: 'new_handle',
    });

    expect(updated.firstName).toBe('NewName');
    expect(updated.username).toBe('new_handle');
    expect(updated.displayAlias).toBe('High Roller');
    expect(updated.ownerNotes).toBe('VIP Playtester');
    expect(updated.isVip).toBe(true);
  });

  it('records activity events with idempotency and bounds metadata', async () => {
    const eventId = 'op_test_event_1';
    const ev1 = await recordActivityEvent({
      telegramUserId: '123456789',
      eventType: 'shot_recorded',
      eventCategory: 'tracker',
      sessionId: 'sess_1',
      metadata: { shell: 'live', token: 'secret-token-should-be-stripped', rawInitData: 'bad' },
      eventId,
    });

    expect(ev1).not.toBeNull();
    expect(ev1.eventId).toBe(eventId);
    const parsedMeta = JSON.parse(ev1.metadataJson);
    expect(parsedMeta.shell).toBe('live');
    expect(parsedMeta.token).toBeUndefined(); // sensitive keys stripped!
    expect(parsedMeta.rawInitData).toBeUndefined();

    // Idempotent duplicate insert
    const ev2 = await recordActivityEvent({
      telegramUserId: '123456789',
      eventType: 'shot_recorded',
      eventId,
    });
    expect(ev2.eventId).toBe(eventId);
    expect(memoryStore.activity_events.size).toBe(1);
  });

  it('enforces application-level restriction for blocked users but never blocks Owner', async () => {
    // Normal blocked user
    memoryStore.users.set('999', {
      telegramId: '999',
      isBlocked: true,
    });

    await expect(checkUserRestriction('999')).rejects.toThrow(/restricted/i);

    // Owner ID is 184202422 — even if flagged in DB, checkUserRestriction will never restrict owner
    memoryStore.users.set(OWNER_TELEGRAM_ID, {
      telegramId: OWNER_TELEGRAM_ID,
      isBlocked: true,
    });

    await expect(checkUserRestriction(OWNER_TELEGRAM_ID)).resolves.not.toThrow();
  });

  it('correctly computes time window boundaries for presets and custom ranges', () => {
    const w24h = resolveTimeWindow('24h');
    expect(w24h.duration).toBe(24 * 3600 * 1000);
    expect(w24h.timezone).toBe('UTC');

    const w7d = resolveTimeWindow('7d');
    expect(w7d.duration).toBe(7 * 86400 * 1000);

    const w30d = resolveTimeWindow('30d');
    expect(w30d.duration).toBe(30 * 86400 * 1000);

    const custom = resolveTimeWindow('custom', 1000000, 2000000);
    expect(custom.startTime).toBe(1000000);
    expect(custom.endTime).toBe(2000000);
    expect(custom.duration).toBe(1000000);
  });

  it('computes accurate analytics metrics including new vs returning users and active users', async () => {
    const now = Date.now();
    const tenDaysAgo = now - 10 * 86400 * 1000;
    const twoDaysAgo = now - 2 * 86400 * 1000;

    // User A: registered 10 days ago (returning user)
    memoryStore.users.set('user_a', {
      telegramId: 'user_a',
      firstName: 'Alice',
      firstSeenAt: tenDaysAgo,
      lastSeenAt: twoDaysAgo,
    });

    // User B: registered 2 days ago (new user)
    memoryStore.users.set('user_b', {
      telegramId: 'user_b',
      firstName: 'Bob',
      firstSeenAt: twoDaysAgo,
      lastSeenAt: twoDaysAgo,
    });

    // User C: registered 10 days ago, no recent activity (inactive in window)
    memoryStore.users.set('user_c', {
      telegramId: 'user_c',
      firstName: 'Charlie',
      firstSeenAt: tenDaysAgo,
      lastSeenAt: tenDaysAgo,
    });

    // Activity events in 7d window for User A & User B
    memoryStore.activity_events.set('ev_1', {
      eventId: 'ev_1',
      telegramUserId: 'user_a',
      eventType: 'session_created',
      occurredAt: twoDaysAgo,
      createdAt: twoDaysAgo,
    });
    memoryStore.activity_events.set('ev_2', {
      eventId: 'ev_2',
      telegramUserId: 'user_b',
      eventType: 'session_created',
      occurredAt: twoDaysAgo,
      createdAt: twoDaysAgo,
    });
    memoryStore.activity_events.set('ev_3', {
      eventId: 'ev_3',
      telegramUserId: 'user_b',
      eventType: 'shot_recorded',
      occurredAt: twoDaysAgo + 100,
      createdAt: twoDaysAgo + 100,
    });

    const window7d = resolveTimeWindow('7d');
    const metrics = await getAnalyticsMetrics(window7d);

    expect(metrics.totals.totalUsers).toBe(3);
    expect(metrics.totals.activeUsers).toBe(2); // user_a and user_b
    expect(metrics.totals.newUsers).toBe(1); // user_b
    expect(metrics.totals.returningUsers).toBe(1); // user_a
    expect(metrics.totals.sessionsCreated).toBe(2);
    expect(metrics.totals.actionsRecorded).toBe(1); // 1 shot_recorded
    expect(metrics.activityTrends.dau).toBe(0); // activity was 2 days ago, not last 24h
    expect(metrics.activityTrends.wau).toBe(2);
    expect(metrics.eventBreakdown['session_created']).toBe(2);
    expect(metrics.eventBreakdown['shot_recorded']).toBe(1);
  });

  it('endpoint recordAppOpen tracks app_opened event and reports isOwner', async () => {
    // Non-owner
    const resUser = await recordAppOpenEndpoint({}, { initData: { user: { id: 999999 } } });
    expect(resUser.ok).toBe(true);
    expect(resUser.isOwner).toBe(false);

    // Owner (184202422)
    const resOwner = await recordAppOpenEndpoint({}, { initData: { user: { id: 184202422 } } });
    expect(resOwner.ok).toBe(true);
    expect(resOwner.isOwner).toBe(true);

    expect(memoryStore.activity_events.size).toBe(2);
  });
});

