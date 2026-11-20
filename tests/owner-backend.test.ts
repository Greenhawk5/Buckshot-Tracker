import { describe, it, expect, beforeEach } from 'vitest';
import { memoryStore, apiMock, BotApiError } from './sdk-mock.ts';
import { requireOwner, OWNER_TELEGRAM_ID } from '../tgcloud/lib/auth/require-owner.js';

// Owner endpoints
import ownerGetOverviewEndpoint from '../tgcloud/endpoints/ownerGetOverview.js';
import ownerGetAnalyticsEndpoint from '../tgcloud/endpoints/ownerGetAnalytics.js';
import ownerListUsersEndpoint from '../tgcloud/endpoints/ownerListUsers.js';
import ownerGetUserDetailsEndpoint from '../tgcloud/endpoints/ownerGetUserDetails.js';
import ownerUpdateUserMetadataEndpoint from '../tgcloud/endpoints/ownerUpdateUserMetadata.js';
import ownerRestrictUserEndpoint from '../tgcloud/endpoints/ownerRestrictUser.js';
import ownerUnrestrictUserEndpoint from '../tgcloud/endpoints/ownerUnrestrictUser.js';
import ownerCreateCampaignEndpoint from '../tgcloud/endpoints/ownerCreateCampaign.js';
import ownerPreviewCampaignEndpoint from '../tgcloud/endpoints/ownerPreviewCampaign.js';
import ownerStartCampaignEndpoint from '../tgcloud/endpoints/ownerStartCampaign.js';
import ownerPauseCampaignEndpoint from '../tgcloud/endpoints/ownerPauseCampaign.js';
import ownerResumeCampaignEndpoint from '../tgcloud/endpoints/ownerResumeCampaign.js';
import ownerCancelCampaignEndpoint from '../tgcloud/endpoints/ownerCancelCampaign.js';
import ownerGetCampaignEndpoint from '../tgcloud/endpoints/ownerGetCampaign.js';
import ownerProcessBroadcastBatchEndpoint from '../tgcloud/endpoints/ownerProcessBroadcastBatch.js';
import ownerRetryCampaignEndpoint from '../tgcloud/endpoints/ownerRetryCampaign.js';
import ownerGetSystemHealthEndpoint from '../tgcloud/endpoints/ownerGetSystemHealth.js';
import ownerGetSettingsEndpoint from '../tgcloud/endpoints/ownerGetSettings.js';
import ownerUpdateSettingsEndpoint from '../tgcloud/endpoints/ownerUpdateSettings.js';
import ownerGetAuditLogsEndpoint from '../tgcloud/endpoints/ownerGetAuditLogs.js';
import ownerListFeedbackEndpoint from '../tgcloud/endpoints/ownerListFeedback.js';
import ownerUpdateFeedbackEndpoint from '../tgcloud/endpoints/ownerUpdateFeedback.js';
import ownerExportReportEndpoint from '../tgcloud/endpoints/ownerExportReport.js';
import submitFeedbackEndpoint from '../tgcloud/endpoints/submitFeedback.js';

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
