import { callServerless } from './serverless.client';

export interface OwnerOverviewData {
  window: {
    preset: string;
    startTime: number;
    endTime: number;
    duration: number;
    periodLabel: string;
    timezone: string;
  };
  totals: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    totalEvents: number;
    appOpens: number;
    sessionsCreated: number;
    sessionsCompleted: number;
    sessionsAbandoned: number;
    actionsRecorded: number;
    avgSessionsPerActiveUser: number;
    avgActionsPerActiveUser: number;
  };
  activityTrends: {
    dau: number;
    wau: number;
    mau: number;
  };
  comparison: {
    priorNewUsers: number;
    priorActiveUsers: number;
    priorEvents: number;
    priorAppOpens: number;
  };
  eventBreakdown: Record<string, number>;
  timeSeries: Array<{
    timestamp: number;
    label: string;
    eventsCount: number;
    sessionsCount: number;
    activeUsersCount: number;
  }>;
}

export interface OwnerUserRecord {
  id: number;
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  firstSeenAt: number;
  lastSeenAt: number;
  lastAppOpenedAt?: number;
  lastSessionCreatedAt?: number;
  isBlocked: boolean;
  isVip: boolean;
  displayAlias?: string;
  hideName: boolean;
  ownerNotes?: string;
}

export async function fetchOwnerOverview(preset = '7d', customStart?: number, customEnd?: number): Promise<OwnerOverviewData> {
  const res = await callServerless<{ ok: boolean; data: OwnerOverviewData }>('ownerGetOverview', {
    preset,
    customStart,
    customEnd,
  });
  return res.data;
}

export async function fetchOwnerAnalytics(preset = '30d', customStart?: number, customEnd?: number): Promise<OwnerOverviewData> {
  const res = await callServerless<{ ok: boolean; analytics: OwnerOverviewData }>('ownerGetAnalytics', {
    preset,
    customStart,
    customEnd,
  });
  return res.analytics;
}

export async function fetchOwnerUsers(params: {
  search?: string;
  filter?: string;
  page?: number;
  limit?: number;
}) {
  return callServerless<{
    ok: boolean;
    users: OwnerUserRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>('ownerListUsers', params);
}

export async function fetchOwnerUserDetails(telegramUserId: string) {
  return callServerless<{
    ok: boolean;
    user: OwnerUserRecord;
    stats: { totalSessions: number; completedSessions: number; totalEvents: number };
    recentEvents: any[];
    recentSessions: any[];
    broadcastHistory: any[];
  }>('ownerGetUserDetails', { telegramUserId });
}

export async function updateOwnerUserMetadata(params: {
  telegramUserId: string;
  displayAlias?: string | null;
  hideName?: boolean;
  isVip?: boolean;
  ownerNotes?: string | null;
}) {
  return callServerless<{ ok: boolean; user: OwnerUserRecord }>('ownerUpdateUserMetadata', params);
}

export async function restrictOwnerUser(telegramUserId: string, reason?: string) {
  return callServerless<{ ok: boolean; isBlocked: boolean }>('ownerRestrictUser', { telegramUserId, reason });
}

export async function unrestrictOwnerUser(telegramUserId: string) {
  return callServerless<{ ok: boolean; isBlocked: boolean }>('ownerUnrestrictUser', { telegramUserId });
}

export async function createOwnerCampaign(payload: {
  title: string;
  messageType: string;
  contentText?: string;
  mediaPayload?: any;
  keyboard?: any;
  targetDefinition?: any;
  autoStart?: boolean;
}) {
  return callServerless<{ ok: boolean; campaign: any }>('ownerCreateCampaign', payload);
}

export async function previewOwnerCampaign(payload: {
  messageType: string;
  contentText?: string;
  targetDefinition?: any;
}) {
  return callServerless<{ ok: boolean; preview: any }>('ownerPreviewCampaign', payload);
}

export async function startOwnerCampaign(campaignId: string) {
  return callServerless<{ ok: boolean; status: string }>('ownerStartCampaign', { campaignId });
}

export async function pauseOwnerCampaign(campaignId: string) {
  return callServerless<{ ok: boolean; status: string }>('ownerPauseCampaign', { campaignId });
}

export async function resumeOwnerCampaign(campaignId: string) {
  return callServerless<{ ok: boolean; status: string }>('ownerResumeCampaign', { campaignId });
}

export async function cancelOwnerCampaign(campaignId: string) {
  return callServerless<{ ok: boolean; status: string }>('ownerCancelCampaign', { campaignId });
}

export async function fetchOwnerCampaign(campaignId: string) {
  return callServerless<{
    ok: boolean;
    campaign: any;
    statusSummary: Record<string, number>;
    recipients: any[];
    totalRecipients: number;
  }>('ownerGetCampaign', { campaignId });
}

export async function fetchOwnerCampaigns(page = 1, limit = 20, status = 'all') {
  return callServerless<{
    ok: boolean;
    campaigns: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>('ownerListCampaigns', { page, limit, status });
}

export async function processOwnerBroadcastBatch(campaignId: string, batchSize = 5) {
  return callServerless<{
    ok: boolean;
    status: string;
    processedCount: number;
    sentDelta: number;
    failedDelta: number;
    remainingCount: number;
    paused?: boolean;
    reason?: string;
  }>('ownerProcessBroadcastBatch', { campaignId, batchSize });
}

export async function retryOwnerCampaign(campaignId: string) {
  return callServerless<{ ok: boolean; retriedCount: number; status: string }>('ownerRetryCampaign', { campaignId });
}

export async function fetchOwnerSystemHealth() {
  return callServerless<{ ok: boolean; health: any }>('ownerGetSystemHealth', {});
}

export async function fetchOwnerSettings() {
  return callServerless<{ ok: boolean; settings: any }>('ownerGetSettings', {});
}

export async function updateOwnerSettings(settings: Record<string, any>) {
  return callServerless<{ ok: boolean; settings: any }>('ownerUpdateSettings', { settings });
}

export async function fetchOwnerAuditLogs(page = 1, limit = 20, action = 'all') {
  return callServerless<{ ok: boolean; logs: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
    'ownerGetAuditLogs',
    { page, limit, action }
  );
}

export async function fetchOwnerFeedback(page = 1, limit = 20, status = 'all') {
  return callServerless<{ ok: boolean; reports: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
    'ownerListFeedback',
    { page, limit, status }
  );
}

export async function updateOwnerFeedback(reportId: string, status?: string, ownerResponse?: string) {
  return callServerless<{ ok: boolean; report: any }>('ownerUpdateFeedback', { reportId, status, ownerResponse });
}

export async function exportOwnerReport(type: string, format = 'csv') {
  return callServerless<{
    ok: boolean;
    type: string;
    format: string;
    rowCount: number;
    content: string;
    filename: string;
  }>('ownerExportReport', { type, format });
}
