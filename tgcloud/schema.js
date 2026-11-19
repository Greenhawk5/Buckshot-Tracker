import { table, integer, text, index } from 'sdk/db';

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
