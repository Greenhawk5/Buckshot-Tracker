import { table, integer, text, boolean, index, uniqueIndex } from 'sdk/db';

// ---------------------------------------------------------------------------
// Existing v1.0.0 Tables (Preserved for full backward compatibility)
// ---------------------------------------------------------------------------

export const trackerSessions = table('tracker_sessions', {
  id: text('id').primaryKey(),
  telegramUserId: text('telegram_user_id').notNull(),
  initialLive: integer('initial_live').notNull(),
  initialBlank: integer('initial_blank').notNull(),
  liveRemaining: integer('live_remaining').notNull(),
  blankRemaining: integer('blank_remaining').notNull(),
  status: text('status').notNull(),
  eventsJson: text('events_json').notNull(),
  intelJson: text('intel_json'),
  version: integer('version').default(1).notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (t) => ({
  userUpdatedIdx: index('idx_tracker_sessions_user_updated').on(t.telegramUserId, t.updatedAt),
}));

export const processedOperations = table('processed_operations', {
  operationId: text('operation_id').primaryKey(),
  telegramUserId: text('telegram_user_id').notNull(),
  sessionId: text('session_id').notNull(),
  createdAt: integer('created_at').notNull(),
}, (t) => ({
  userOpIdx: index('idx_processed_ops_user').on(t.telegramUserId),
}));

// ---------------------------------------------------------------------------
// v1.2.0 Tables: Users, Analytics, Broadcast, Ops, Audit, Settings & Feedback
// ---------------------------------------------------------------------------

export const users = table('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: text('telegram_id').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  username: text('username'),
  languageCode: text('language_code'),
  firstSeenAt: integer('first_seen_at').notNull(),
  lastSeenAt: integer('last_seen_at').notNull(),
  lastAppOpenedAt: integer('last_app_opened_at'),
  lastSessionCreatedAt: integer('last_session_created_at'),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  isVip: boolean('is_vip').default(false).notNull(),
  displayAlias: text('display_alias'),
  hideName: boolean('hide_name').default(false).notNull(),
  ownerNotes: text('owner_notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (t) => ({
  tgIdIdx: uniqueIndex('uidx_users_tg_id').on(t.telegramId),
  lastSeenIdx: index('idx_users_last_seen').on(t.lastSeenAt),
}));

export const activityEvents = table('activity_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: text('event_id').unique().notNull(),
  telegramUserId: text('telegram_user_id').notNull(),
  eventType: text('event_type').notNull(),
  eventCategory: text('event_category').notNull(),
  sessionId: text('session_id'),
  metadataJson: text('metadata_json'),
  occurredAt: integer('occurred_at').notNull(),
  createdAt: integer('created_at').notNull(),
}, (t) => ({
  eventUniqueIdx: uniqueIndex('uidx_activity_events_id').on(t.eventId),
  userOccurredIdx: index('idx_activity_events_user_occurred').on(t.telegramUserId, t.occurredAt),
  typeOccurredIdx: index('idx_activity_events_type_occurred').on(t.eventType, t.occurredAt),
  occurredIdx: index('idx_activity_events_occurred').on(t.occurredAt),
}));

export const broadcastCampaigns = table('broadcast_campaigns', {
  id: text('id').primaryKey(),
  campaignKey: text('campaign_key').unique().notNull(),
  title: text('title').notNull(),
  messageType: text('message_type').notNull(), // 'text' | 'photo' | 'video' | 'voice' | 'video_note' | 'document'
  contentText: text('content_text'),
  mediaPayloadJson: text('media_payload_json'),
  keyboardJson: text('keyboard_json'),
  targetDefinitionJson: text('target_definition_json').notNull(),
  status: text('status').notNull(), // 'draft' | 'queued' | 'running' | 'paused' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled'
  totalRecipients: integer('total_recipients').default(0).notNull(),
  sentCount: integer('sent_count').default(0).notNull(),
  failedCount: integer('failed_count').default(0).notNull(),
  skippedCount: integer('skipped_count').default(0).notNull(),
  createdByOwnerId: text('created_by_owner_id').notNull(),
  createdAt: integer('created_at').notNull(),
  scheduledAt: integer('scheduled_at'),
  startedAt: integer('started_at'),
  completedAt: integer('completed_at'),
  pausedAt: integer('paused_at'),
  cancelledAt: integer('cancelled_at'),
  lastErrorSummary: text('last_error_summary'),
  updatedAt: integer('updated_at').notNull(),
}, (t) => ({
  campaignKeyIdx: uniqueIndex('uidx_campaigns_key').on(t.campaignKey),
  statusCreatedIdx: index('idx_campaigns_status_created').on(t.status, t.createdAt),
}));

export const broadcastRecipients = table('broadcast_recipients', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull(),
  telegramUserId: text('telegram_user_id').notNull(),
  status: text('status').notNull(), // 'pending' | 'sending' | 'sent' | 'failed_retryable' | 'failed_permanent' | 'skipped' | 'cancelled'
  attempts: integer('attempts').default(0).notNull(),
  nextAttemptAt: integer('next_attempt_at').default(0).notNull(),
  lastAttemptAt: integer('last_attempt_at'),
  leaseUntil: integer('lease_until').default(0).notNull(),
  sentAt: integer('sent_at'),
  telegramMessageId: integer('telegram_message_id'),
  errorCode: integer('error_code'),
  errorDescription: text('error_description'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (t) => ({
  campaignUserIdx: uniqueIndex('uidx_recipients_campaign_user').on(t.campaignId, t.telegramUserId),
  claimIdx: index('idx_recipients_claim').on(t.campaignId, t.status, t.nextAttemptAt, t.leaseUntil),
}));

export const adminAuditLogs = table('admin_audit_logs', {
  id: text('id').primaryKey(),
  actorTelegramId: text('actor_telegram_id').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  detailsJson: text('details_json'),
  outcome: text('outcome').notNull(), // 'success' | 'failure'
  requestId: text('request_id'),
  occurredAt: integer('occurred_at').notNull(),
}, (t) => ({
  occurredIdx: index('idx_audit_logs_occurred').on(t.occurredAt),
  actionOccurredIdx: index('idx_audit_logs_action_occurred').on(t.action, t.occurredAt),
}));

export const appSettings = table('app_settings', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
  updatedBy: text('updated_by').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const feedbackReports = table('feedback_reports', {
  id: text('id').primaryKey(),
  telegramUserId: text('telegram_user_id').notNull(),
  category: text('category').notNull(), // 'bug' | 'feature' | 'general'
  message: text('message').notNull(),
  status: text('status').default('new').notNull(), // 'new' | 'reviewing' | 'resolved' | 'dismissed'
  ownerResponse: text('owner_response'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (t) => ({
  statusCreatedIdx: index('idx_feedback_status_created').on(t.status, t.createdAt),
  userCreatedIdx: index('idx_feedback_user_created').on(t.telegramUserId, t.createdAt),
}));
