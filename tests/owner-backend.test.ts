import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { memoryStore, apiMock, BotApiError } from './sdk-mock.ts';
import { requireOwner, OWNER_TELEGRAM_ID } from '../tgcloud/lib/auth/require-owner.js';

// Owner endpoints (All 24 administrative endpoints)
import ownerCancelCampaignEndpoint from '../tgcloud/endpoints/ownerCancelCampaign.js';
import ownerCreateCampaignEndpoint from '../tgcloud/endpoints/ownerCreateCampaign.js';
import ownerExportReportEndpoint from '../tgcloud/endpoints/ownerExportReport.js';
import ownerGetAnalyticsEndpoint from '../tgcloud/endpoints/ownerGetAnalytics.js';
import ownerGetAuditLogsEndpoint from '../tgcloud/endpoints/ownerGetAuditLogs.js';
import ownerGetCampaignEndpoint from '../tgcloud/endpoints/ownerGetCampaign.js';
import ownerGetOverviewEndpoint from '../tgcloud/endpoints/ownerGetOverview.js';
import ownerGetSettingsEndpoint from '../tgcloud/endpoints/ownerGetSettings.js';
import ownerGetSystemHealthEndpoint from '../tgcloud/endpoints/ownerGetSystemHealth.js';
import ownerGetUserDetailsEndpoint from '../tgcloud/endpoints/ownerGetUserDetails.js';
import ownerListCampaignsEndpoint from '../tgcloud/endpoints/ownerListCampaigns.js';
import ownerListFeedbackEndpoint from '../tgcloud/endpoints/ownerListFeedback.js';
import ownerListUsersEndpoint from '../tgcloud/endpoints/ownerListUsers.js';
import ownerPauseCampaignEndpoint from '../tgcloud/endpoints/ownerPauseCampaign.js';
import ownerPreviewCampaignEndpoint from '../tgcloud/endpoints/ownerPreviewCampaign.js';
import ownerProcessBroadcastBatchEndpoint from '../tgcloud/endpoints/ownerProcessBroadcastBatch.js';
import ownerRestrictUserEndpoint from '../tgcloud/endpoints/ownerRestrictUser.js';
import ownerResumeCampaignEndpoint from '../tgcloud/endpoints/ownerResumeCampaign.js';
import ownerRetryCampaignEndpoint from '../tgcloud/endpoints/ownerRetryCampaign.js';
import ownerStartCampaignEndpoint from '../tgcloud/endpoints/ownerStartCampaign.js';
import ownerUnrestrictUserEndpoint from '../tgcloud/endpoints/ownerUnrestrictUser.js';
import ownerUpdateFeedbackEndpoint from '../tgcloud/endpoints/ownerUpdateFeedback.js';
import ownerUpdateSettingsEndpoint from '../tgcloud/endpoints/ownerUpdateSettings.js';
import ownerUpdateUserMetadataEndpoint from '../tgcloud/endpoints/ownerUpdateUserMetadata.js';

// Public & Gameplay endpoints for maintenance and feedback testing
import submitFeedbackEndpoint from '../tgcloud/endpoints/submitFeedback.js';
import createSessionEndpoint from '../tgcloud/endpoints/createSession.js';
import recordShotEndpoint from '../tgcloud/endpoints/recordShot.js';
import ejectShellEndpoint from '../tgcloud/endpoints/ejectShell.js';
import getActiveSessionEndpoint from '../tgcloud/endpoints/getActiveSession.js';
import abandonSessionEndpoint from '../tgcloud/endpoints/abandonSession.js';
import { updateSystemSetting } from '../tgcloud/lib/settings/settings-service.js';

describe('Owner Authorization & Security Guard Tests — Phase 3 & Specification Checklist', () => {
  beforeEach(() => {
    memoryStore.reset();
  });

  const mockNonOwnerCtx = { initData: { user: { id: 987654321, first_name: 'Player' } } };
  const mockOwnerCtx = { initData: { user: { id: 184202422, first_name: 'Architect' } } };

  it('rejects unauthenticated requests with UNAUTHORIZED', () => {
    expect(() => requireOwner(null)).toThrow(/unauthorized/i);
    expect(() => requireOwner({})).toThrow(/unauthorized/i);
    expect(() => requireOwner({ initData: {} })).toThrow(/unauthorized/i);
  });

  it('strictly rejects non-owner Telegram users with FORBIDDEN', () => {
    expect(() => requireOwner(mockNonOwnerCtx)).toThrow(/forbidden/i);
  });

  it('authorizes exclusively Telegram ID 184202422', () => {
    const owner = requireOwner(mockOwnerCtx);
    expect(owner).not.toBeNull();
    expect(String(owner.id)).toBe(OWNER_TELEGRAM_ID);
  });

  it('ignores forged client-supplied ownerId or userId in payload', async () => {
    // Calling with a non-owner context, even if payload claims ownerId = 184202422
    await expect(
      ownerGetOverviewEndpoint({ ownerId: 184202422, telegramUserId: 184202422 }, mockNonOwnerCtx)
    ).rejects.toThrow(/forbidden/i);

    await expect(
      ownerListUsersEndpoint({ ownerId: '184202422' }, mockNonOwnerCtx)
    ).rejects.toThrow(/forbidden/i);

    await expect(
      ownerCreateCampaignEndpoint({ title: 'Hack', ownerId: '184202422' }, mockNonOwnerCtx)
    ).rejects.toThrow(/forbidden/i);
  });
});

describe('Owner User Management & Metadata Tests — Phase 5', () => {
  const mockOwnerCtx = { initData: { user: { id: 184202422 } } };

  beforeEach(() => {
    memoryStore.reset();
  });

  it('lists, filters, and paginates users correctly', async () => {
    memoryStore.users.set('101', {
      telegramId: '101',
      firstName: 'Alice',
      username: 'alice_w',
      lastSeenAt: Date.now(),
      isVip: true,
      isBlocked: false,
    });
    memoryStore.users.set('102', {
      telegramId: '102',
      firstName: 'Bob',
      username: 'bob_b',
      lastSeenAt: Date.now() - 1000,
      isVip: false,
      isBlocked: true,
    });

    const resAll = await ownerListUsersEndpoint({}, mockOwnerCtx);
    expect(resAll.total).toBe(2);

    const resVip = await ownerListUsersEndpoint({ filter: 'vip' }, mockOwnerCtx);
    expect(resVip.total).toBe(1);
    expect(resVip.users[0].telegramId).toBe('101');

    const resBlocked = await ownerListUsersEndpoint({ filter: 'blocked' }, mockOwnerCtx);
    expect(resBlocked.total).toBe(1);
    expect(resBlocked.users[0].telegramId).toBe('102');

    const resSearch = await ownerListUsersEndpoint({ search: 'alice' }, mockOwnerCtx);
    expect(resSearch.total).toBe(1);
  });

  it('fetches complete user details including sessions, events, and broadcast history', async () => {
    memoryStore.users.set('101', {
      telegramId: '101',
      firstName: 'Alice',
      lastSeenAt: Date.now(),
      isVip: false,
      isBlocked: false,
    });
    memoryStore.tracker_sessions.set('sess_u1', {
      id: 'sess_u1',
      telegramUserId: '101',
      status: 'completed',
      createdAt: Date.now() - 5000,
    });
    memoryStore.activity_events.set('ev_u1', {
      eventId: 'ev_u1',
      telegramUserId: '101',
      eventType: 'shot_recorded',
      occurredAt: Date.now() - 5000,
    });

    const details = await ownerGetUserDetailsEndpoint({ telegramUserId: '101' }, mockOwnerCtx);
    expect(details.ok).toBe(true);
    expect(details.user.firstName).toBe('Alice');
    expect(details.stats.totalSessions).toBe(1);
    expect(details.stats.completedSessions).toBe(1);
    expect(details.stats.totalEvents).toBe(1);
  });

  it('updates user metadata and writes an administrative audit log', async () => {
    memoryStore.users.set('101', {
      telegramId: '101',
      firstName: 'Alice',
      displayAlias: null,
      isVip: false,
    });

    const res = await ownerUpdateUserMetadataEndpoint(
      { telegramUserId: '101', displayAlias: 'Queen of Spades', isVip: true, ownerNotes: 'Top player' },
      mockOwnerCtx
    );

    expect(res.ok).toBe(true);
    expect(res.user.displayAlias).toBe('Queen of Spades');
    expect(res.user.isVip).toBe(true);

    // Verify audit log
    expect(memoryStore.admin_audit_logs.size).toBe(1);
    const auditRow = Array.from(memoryStore.admin_audit_logs.values())[0];
    expect(auditRow.action).toBe('update_user_metadata');
    expect(auditRow.targetId).toBe('101');
  });

  it('restricts and unrestricts user with audit trail, protecting Owner from being restricted', async () => {
    memoryStore.users.set('101', { telegramId: '101', isBlocked: false });

    // Restrict
    const resRes = await ownerRestrictUserEndpoint({ telegramUserId: '101' }, mockOwnerCtx);
    expect(resRes.isBlocked).toBe(true);
    expect(memoryStore.users.get('101').isBlocked).toBe(true);

    // Unrestrict
    const resUnres = await ownerUnrestrictUserEndpoint({ telegramUserId: '101' }, mockOwnerCtx);
    expect(resUnres.isBlocked).toBe(false);
    expect(memoryStore.users.get('101').isBlocked).toBe(false);

    // Owner cannot restrict themselves
    await expect(
      ownerRestrictUserEndpoint({ telegramUserId: OWNER_TELEGRAM_ID }, mockOwnerCtx)
    ).rejects.toThrow(/cannot restrict the owner/i);
  });
});

describe('Multimedia Broadcast Center & Queue Processing Tests — Phase 6', () => {
  const mockOwnerCtx = { initData: { user: { id: 184202422 } } };

  beforeEach(() => {
    memoryStore.reset();
  });

  it('previews and creates a draft broadcast campaign with recipient snapshots', async () => {
    memoryStore.users.set('201', { telegramId: '201', isBlocked: false, isVip: false });
    memoryStore.users.set('202', { telegramId: '202', isBlocked: false, isVip: false });
    memoryStore.users.set('203', { telegramId: '203', isBlocked: true, isVip: false }); // blocked -> excluded

    const preview = await ownerPreviewCampaignEndpoint(
      { messageType: 'text', contentText: 'Hello players', targetDefinition: { segment: 'all' } },
      mockOwnerCtx
    );

    expect(preview.ok).toBe(true);
    expect(preview.preview.totalRecipients).toBe(2);

    const createRes = await ownerCreateCampaignEndpoint(
      {
        title: 'Tactical Briefing #1',
        messageType: 'photo',
        contentText: 'Check out the update!',
        mediaPayload: { fileId: 'photo_file_123' },
        targetDefinition: { segment: 'all' },
      },
      mockOwnerCtx
    );

    expect(createRes.ok).toBe(true);
    expect(createRes.campaign.status).toBe('draft');
    expect(createRes.campaign.totalRecipients).toBe(2);

    // Recipients table has 2 pending snapshots
    expect(memoryStore.broadcast_recipients.size).toBe(2);
  });

  it('orchestrates campaign lifecycle (draft -> queued -> running -> paused -> running -> completed)', async () => {
    memoryStore.users.set('201', { telegramId: '201', isBlocked: false });

    const createRes = await ownerCreateCampaignEndpoint(
      { title: 'Launch Test', messageType: 'text', contentText: 'Test msg' },
      mockOwnerCtx
    );
    const campId = createRes.campaign.id;

    // Start
    const startRes = await ownerStartCampaignEndpoint({ campaignId: campId }, mockOwnerCtx);
    expect(startRes.status).toBe('queued');

    // Pause
    const pauseRes = await ownerPauseCampaignEndpoint({ campaignId: campId }, mockOwnerCtx);
    expect(pauseRes.status).toBe('paused');

    // Resume
    const resumeRes = await ownerResumeCampaignEndpoint({ campaignId: campId }, mockOwnerCtx);
    expect(resumeRes.status).toBe('running');

    // Process batch (mock sends message via apiMock)
    const batchRes = await ownerProcessBroadcastBatchEndpoint(
      { campaignId: campId, batchSize: 5 },
      mockOwnerCtx
    );
    expect(batchRes.ok).toBe(true);
    expect(batchRes.sentDelta).toBe(1);
    expect(batchRes.status).toBe('completed');

    expect(apiMock.calls).toHaveLength(1);
    expect(apiMock.calls[0].method).toBe('sendMessage');
    expect(apiMock.calls[0].params.chat_id).toBe('201');
  });

  it('handles rate-limits (429) gracefully and retries retryable failures', async () => {
    memoryStore.users.set('301', { telegramId: '301', isBlocked: false });

    const createRes = await ownerCreateCampaignEndpoint(
      { title: 'Rate Limit Test', messageType: 'text', contentText: 'Msg' },
      mockOwnerCtx
    );
    const campId = createRes.campaign.id;
    await ownerStartCampaignEndpoint({ campaignId: campId }, mockOwnerCtx);

    // Simulate Telegram 429 Too Many Requests
    apiMock.onMethod('sendMessage', () => {
      throw new BotApiError('Too Many Requests', 429, { retry_after: 2 });
    });

    const batchRes = await ownerProcessBroadcastBatchEndpoint(
      { campaignId: campId, batchSize: 5 },
      mockOwnerCtx
    );

    // Recipient should be marked failed_retryable
    const recipient = Array.from(memoryStore.broadcast_recipients.values())[0];
    expect(recipient.status).toBe('failed_retryable');
    expect(recipient.errorCode).toBe(429);
    expect(recipient.attempts).toBe(1);

    // Now reset Bot API to succeed and retry
    apiMock.reset();
    recipient.nextAttemptAt = Date.now() - 1000; // time elapsed

    await ownerRetryCampaignEndpoint({ campaignId: campId }, mockOwnerCtx);
    const retryBatch = await ownerProcessBroadcastBatchEndpoint(
      { campaignId: campId, batchSize: 5 },
      mockOwnerCtx
    );
    expect(retryBatch.sentDelta).toBe(1);
    expect(retryBatch.status).toBe('completed');
  });

  it('marks 403 bot blocked as permanent failure without endless retry', async () => {
    memoryStore.users.set('401', { telegramId: '401', isBlocked: false });

    const createRes = await ownerCreateCampaignEndpoint(
      { title: 'Block Test', messageType: 'text', contentText: 'Msg' },
      mockOwnerCtx
    );
    const campId = createRes.campaign.id;
    await ownerStartCampaignEndpoint({ campaignId: campId }, mockOwnerCtx);

    // Simulate 403 Bot Blocked
    apiMock.onMethod('sendMessage', () => {
      throw new BotApiError('Forbidden: bot was blocked by the user', 403);
    });

    const batchRes = await ownerProcessBroadcastBatchEndpoint(
      { campaignId: campId, batchSize: 5 },
      mockOwnerCtx
    );

    const recipient = Array.from(memoryStore.broadcast_recipients.values())[0];
    expect(recipient.status).toBe('failed_permanent');
    expect(recipient.errorCode).toBe(403);
    expect(batchRes.failedDelta).toBe(1);
    expect(batchRes.status).toBe('completed_with_errors');
  });

  it('Task 1 — prevents race conditions and double claims when two batch invocations run concurrently', async () => {
    // Setup 6 distinct users
    for (let i = 1; i <= 6; i++) {
      memoryStore.users.set(`user_${i}`, { telegramId: `user_${i}`, isBlocked: false });
    }

    const createRes = await ownerCreateCampaignEndpoint(
      { title: 'Concurrent Race Test', messageType: 'text', contentText: 'Testing atomic claim' },
      mockOwnerCtx
    );
    const campId = createRes.campaign.id;
    await ownerStartCampaignEndpoint({ campaignId: campId }, mockOwnerCtx);

    apiMock.reset();

    // Trigger two simulated concurrent batch invocations simultaneously
    const [batch1, batch2] = await Promise.all([
      ownerProcessBroadcastBatchEndpoint({ campaignId: campId, batchSize: 3 }, mockOwnerCtx),
      ownerProcessBroadcastBatchEndpoint({ campaignId: campId, batchSize: 3 }, mockOwnerCtx),
    ]);

    expect(batch1.ok).toBe(true);
    expect(batch2.ok).toBe(true);

    // Sum of processed recipients across both calls must equal 6
    expect(batch1.processedCount + batch2.processedCount).toBe(6);
    expect(batch1.sentDelta + batch2.sentDelta).toBe(6);

    // Zero duplicate Telegram messages were dispatched
    expect(apiMock.calls).toHaveLength(6);
    const deliveredChatIds = apiMock.calls.map((c) => c.params.chat_id);
    const uniqueDeliveredChatIds = new Set(deliveredChatIds);
    expect(uniqueDeliveredChatIds.size).toBe(6);

    // All recipient records in DB are uniquely in 'sent' status
    const allRecipients = Array.from(memoryStore.broadcast_recipients.values());
    expect(allRecipients).toHaveLength(6);
    for (const r of allRecipients) {
      expect(r.status).toBe('sent');
      expect(r.leaseUntil).toBe(0);
    }
  });

  it('Task 1 — successfully recovers expired leases for crashed or interrupted workers', async () => {
    memoryStore.users.set('user_lease_1', { telegramId: 'user_lease_1', isBlocked: false });

    const createRes = await ownerCreateCampaignEndpoint(
      { title: 'Lease Recovery Test', messageType: 'text', contentText: 'Recovery' },
      mockOwnerCtx
    );
    const campId = createRes.campaign.id;
    await ownerStartCampaignEndpoint({ campaignId: campId }, mockOwnerCtx);

    // Manually simulate a worker that crashed: recipient left in 'sending' with expired lease
    const recipient = Array.from(memoryStore.broadcast_recipients.values())[0];
    recipient.status = 'sending';
    recipient.leaseUntil = Date.now() - 10000; // expired 10 seconds ago

    apiMock.reset();

    // Trigger batch run
    const batchRes = await ownerProcessBroadcastBatchEndpoint(
      { campaignId: campId, batchSize: 5 },
      mockOwnerCtx
    );

    expect(batchRes.ok).toBe(true);
    expect(batchRes.processedCount).toBe(1);
    expect(batchRes.sentDelta).toBe(1);
    expect(batchRes.status).toBe('completed');

    expect(apiMock.calls).toHaveLength(1);
    expect(apiMock.calls[0].params.chat_id).toBe('user_lease_1');
    const updatedRecipient = memoryStore.broadcast_recipients.get(recipient.id);
    expect(updatedRecipient.status).toBe('sent');
    expect(updatedRecipient.leaseUntil).toBe(0);
  });
});

describe('Operations, System Health, Settings, Audit & Exports — Phase 7', () => {
  const mockOwnerCtx = { initData: { user: { id: 184202422 } } };
  const mockUserCtx = { initData: { user: { id: 555555 } } };

  beforeEach(() => {
    memoryStore.reset();
  });

  it('returns valid system health diagnostics', async () => {
    const res = await ownerGetSystemHealthEndpoint({}, mockOwnerCtx);
    expect(res.ok).toBe(true);
    expect(res.health.status).toBe('healthy');
    expect(res.health.database.healthy).toBe(true);
    expect(res.health.version).toBe('1.2.0');
  });

  it('reads and updates system settings with defaults and audit trail', async () => {
    const initial = await ownerGetSettingsEndpoint({}, mockOwnerCtx);
    expect(initial.settings.maintenanceMode).toBe(false);

    const updated = await ownerUpdateSettingsEndpoint(
      { settings: { maintenanceMode: true, announcementBanner: 'Update tonight!' } },
      mockOwnerCtx
    );
    expect(updated.settings.maintenanceMode).toBe(true);
    expect(updated.settings.announcementBanner).toBe('Update tonight!');

    // Check audit log
    const lastAudit = Array.from(memoryStore.admin_audit_logs.values()).pop();
    expect(lastAudit.action).toBe('update_settings');
  });

  it('submits feedback from user and allows owner review/response', async () => {
    const submitRes = await submitFeedbackEndpoint(
      { category: 'feature', message: 'Add custom shell skins please!' },
      mockUserCtx
    );
    expect(submitRes.ok).toBe(true);
    expect(submitRes.feedbackId).toBeDefined();

    const ownerList = await ownerListFeedbackEndpoint({}, mockOwnerCtx);
    expect(ownerList.total).toBe(1);
    expect(ownerList.reports[0].message).toBe('Add custom shell skins please!');

    const updateRes = await ownerUpdateFeedbackEndpoint(
      { reportId: submitRes.feedbackId, status: 'reviewing', ownerResponse: 'Under consideration.' },
      mockOwnerCtx
    );
    expect(updateRes.report.status).toBe('reviewing');
    expect(updateRes.report.ownerResponse).toBe('Under consideration.');
  });

  it('exports data with spreadsheet formula injection prevention', async () => {
    memoryStore.users.set('malicious_1', {
      telegramId: 'malicious_1',
      firstName: '=cmd|’ /C calc’!A0', // Excel formula injection payload
      lastName: '+SUM(1,2)',
      username: 'hacker',
      firstSeenAt: Date.now(),
      lastSeenAt: Date.now(),
    });

    const exportRes = await ownerExportReportEndpoint({ type: 'users', format: 'csv' }, mockOwnerCtx);
    expect(exportRes.ok).toBe(true);
    expect(exportRes.format).toBe('csv');
    // Formula characters must be neutralized with leading single quote '
    expect(exportRes.content).toContain("'=cmd|’ /C calc’!A0");
    expect(exportRes.content).toContain("'+SUM(1,2)");
  });
});

describe('Maintenance Mode Policy Enforcement Tests — Pre-Staging Hardening Task 2', () => {
  const mockOwnerCtx = { initData: { user: { id: 184202422, first_name: 'Architect' } } };
  const mockUserCtx = { initData: { user: { id: 777888999, first_name: 'RegularPlayer' } } };

  beforeEach(() => {
    memoryStore.reset();
  });

  it('allows normal gameplay when maintenanceMode is disabled', async () => {
    // Maintenance mode disabled by default
    const createRes = await createSessionEndpoint(
      { initialLive: 2, initialBlank: 2, operationId: 'maint_test_op1' },
      mockUserCtx
    );
    expect(createRes.ok).toBe(true);
    expect(createRes.session.status).toBe('active');

    const shotRes = await recordShotEndpoint(
      { sessionId: createRes.session.id, shell: 'live', expectedVersion: 1 },
      mockUserCtx
    );
    expect(shotRes.ok).toBe(true);
    expect(shotRes.session.liveRemaining).toBe(1);
  });

  it('strictly rejects session creation and modifications from normal users when maintenanceMode is enabled', async () => {
    // Enable maintenance mode via settings
    await updateSystemSetting('maintenanceMode', true, OWNER_TELEGRAM_ID);
    await updateSystemSetting('maintenanceMessage', 'Scheduled maintenance in progress. Back in 30 mins.', OWNER_TELEGRAM_ID);

    // 1. Session creation blocked
    await expect(
      createSessionEndpoint({ initialLive: 2, initialBlank: 2 }, mockUserCtx)
    ).rejects.toThrow(/maintenance/i);

    // Seed an existing session for the user
    memoryStore.tracker_sessions.set('user_active_sess', {
      id: 'user_active_sess',
      telegramUserId: '777888999',
      initialLive: 3,
      initialBlank: 2,
      liveRemaining: 3,
      blankRemaining: 2,
      status: 'active',
      eventsJson: '[]',
      intelJson: '[]',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 2. Mutations blocked: recordShot, ejectShell, abandonSession
    await expect(
      recordShotEndpoint({ sessionId: 'user_active_sess', shell: 'live', expectedVersion: 1 }, mockUserCtx)
    ).rejects.toThrow(/maintenance/i);

    await expect(
      ejectShellEndpoint({ sessionId: 'user_active_sess', shell: 'blank', expectedVersion: 1 }, mockUserCtx)
    ).rejects.toThrow(/maintenance/i);

    await expect(
      abandonSessionEndpoint({ sessionId: 'user_active_sess', expectedVersion: 1 }, mockUserCtx)
    ).rejects.toThrow(/maintenance/i);
  });

  it('preserves existing sessions and allows read-only getActiveSession during maintenance', async () => {
    // Enable maintenance mode
    await updateSystemSetting('maintenanceMode', true, OWNER_TELEGRAM_ID);

    // Seed existing session
    memoryStore.tracker_sessions.set('preserve_sess', {
      id: 'preserve_sess',
      telegramUserId: '777888999',
      initialLive: 4,
      initialBlank: 3,
      liveRemaining: 4,
      blankRemaining: 3,
      status: 'active',
      eventsJson: '[]',
      intelJson: '[]',
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
    });

    // Read-only endpoint does NOT throw error
    const activeRes = await getActiveSessionEndpoint({}, mockUserCtx);
    expect(activeRes.ok).toBe(true);
    expect(activeRes.session).not.toBeNull();
    expect(activeRes.session.id).toBe('preserve_sess');
    expect(activeRes.session.liveRemaining).toBe(4);
    expect(activeRes.maintenance.active).toBe(true);

    // Session row in DB remains 100% unaltered
    const stored = memoryStore.tracker_sessions.get('preserve_sess');
    expect(stored.liveRemaining).toBe(4);
    expect(stored.status).toBe('active');
  });

  it('ensures Owner ID 184202422 always retains full access to both Command Center and Tracker gameplay during maintenance', async () => {
    // Enable maintenance mode
    await updateSystemSetting('maintenanceMode', true, OWNER_TELEGRAM_ID);

    // Owner can still create sessions
    const ownerSess = await createSessionEndpoint(
      { initialLive: 2, initialBlank: 2, operationId: 'owner_maint_op' },
      mockOwnerCtx
    );
    expect(ownerSess.ok).toBe(true);
    expect(ownerSess.session.status).toBe('active');

    // Owner can still record actions
    const ownerShot = await recordShotEndpoint(
      { sessionId: ownerSess.session.id, shell: 'live', expectedVersion: 1 },
      mockOwnerCtx
    );
    expect(ownerShot.ok).toBe(true);
    expect(ownerShot.session.liveRemaining).toBe(1);

    // Owner Command Center remains fully accessible
    const health = await ownerGetSystemHealthEndpoint({}, mockOwnerCtx);
    expect(health.ok).toBe(true);
    expect(health.health.status).toBe('healthy');
  });

  it('immediately restores gameplay access for all users when maintenanceMode is disabled', async () => {
    // Enable then disable
    await updateSystemSetting('maintenanceMode', true, OWNER_TELEGRAM_ID);
    await expect(createSessionEndpoint({ initialLive: 2, initialBlank: 2 }, mockUserCtx)).rejects.toThrow(/maintenance/i);

    // Disable
    await updateSystemSetting('maintenanceMode', false, OWNER_TELEGRAM_ID);

    // Normal user can now play freely
    const restored = await createSessionEndpoint({ initialLive: 2, initialBlank: 2 }, mockUserCtx);
    expect(restored.ok).toBe(true);
    expect(restored.session.status).toBe('active');
  });
});

describe('Verified Owner Endpoint Inventory Audit — Pre-Staging Hardening Task 3', () => {
  const mockNonOwnerCtx = { initData: { user: { id: 987654321, first_name: 'Player' } } };

  // Explicit, canonical mapping of all 24 administrative owner endpoints
  const allOwnerEndpoints = [
    { name: 'ownerCancelCampaign.js', fn: ownerCancelCampaignEndpoint },
    { name: 'ownerCreateCampaign.js', fn: ownerCreateCampaignEndpoint },
    { name: 'ownerExportReport.js', fn: ownerExportReportEndpoint },
    { name: 'ownerGetAnalytics.js', fn: ownerGetAnalyticsEndpoint },
    { name: 'ownerGetAuditLogs.js', fn: ownerGetAuditLogsEndpoint },
    { name: 'ownerGetCampaign.js', fn: ownerGetCampaignEndpoint },
    { name: 'ownerGetOverview.js', fn: ownerGetOverviewEndpoint },
    { name: 'ownerGetSettings.js', fn: ownerGetSettingsEndpoint },
    { name: 'ownerGetSystemHealth.js', fn: ownerGetSystemHealthEndpoint },
    { name: 'ownerGetUserDetails.js', fn: ownerGetUserDetailsEndpoint },
    { name: 'ownerListCampaigns.js', fn: ownerListCampaignsEndpoint },
    { name: 'ownerListFeedback.js', fn: ownerListFeedbackEndpoint },
    { name: 'ownerListUsers.js', fn: ownerListUsersEndpoint },
    { name: 'ownerPauseCampaign.js', fn: ownerPauseCampaignEndpoint },
    { name: 'ownerPreviewCampaign.js', fn: ownerPreviewCampaignEndpoint },
    { name: 'ownerProcessBroadcastBatch.js', fn: ownerProcessBroadcastBatchEndpoint },
    { name: 'ownerRestrictUser.js', fn: ownerRestrictUserEndpoint },
    { name: 'ownerResumeCampaign.js', fn: ownerResumeCampaignEndpoint },
    { name: 'ownerRetryCampaign.js', fn: ownerRetryCampaignEndpoint },
    { name: 'ownerStartCampaign.js', fn: ownerStartCampaignEndpoint },
    { name: 'ownerUnrestrictUser.js', fn: ownerUnrestrictUserEndpoint },
    { name: 'ownerUpdateFeedback.js', fn: ownerUpdateFeedbackEndpoint },
    { name: 'ownerUpdateSettings.js', fn: ownerUpdateSettingsEndpoint },
    { name: 'ownerUpdateUserMetadata.js', fn: ownerUpdateUserMetadataEndpoint },
  ];

  it('guarantees that there are exactly 24 administrative owner endpoints on disk', () => {
    const endpointsDir = path.resolve(__dirname, '../tgcloud/endpoints');
    const diskOwnerFiles = fs
      .readdirSync(endpointsDir)
      .filter((file) => file.startsWith('owner') && file.endsWith('.js'));

    expect(diskOwnerFiles).toHaveLength(24);
    expect(allOwnerEndpoints).toHaveLength(24);

    const mappedNames = new Set(allOwnerEndpoints.map((e) => e.name));
    for (const file of diskOwnerFiles) {
      expect(mappedNames.has(file)).toBe(true);
    }
  });

  it('dynamically asserts that 100% of all 24 owner endpoints reject unauthenticated and non-owner callers', async () => {
    expect.assertions(24 * 3);

    for (const ep of allOwnerEndpoints) {
      // 1. Rejects null / missing context
      await expect(
        ep.fn({}, null)
      ).rejects.toThrow(/(unauthorized|forbidden)/i);

      // 2. Rejects empty context
      await expect(
        ep.fn({}, {})
      ).rejects.toThrow(/(unauthorized|forbidden)/i);

      // 3. Rejects authenticated non-owner context (Telegram ID 987654321)
      await expect(
        ep.fn({}, mockNonOwnerCtx)
      ).rejects.toThrow(/(unauthorized|forbidden)/i);
    }
  });
});
