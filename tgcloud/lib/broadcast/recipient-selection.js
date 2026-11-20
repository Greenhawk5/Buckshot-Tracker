import { db } from 'sdk';
import { gte, eq } from 'sdk/db';
import { users, activityEvents, broadcastRecipients } from '../../schema.js';
import { OWNER_TELEGRAM_ID } from '../auth/require-owner.js';
import { RECIPIENT_STATUS } from './campaign-state.js';

/**
 * Resolves the list of target Telegram User IDs based on target definition.
 */
export async function resolveTargetRecipients(targetDef = {}) {
  const segment = targetDef.segment || 'all';
  const customIds = Array.isArray(targetDef.customIds) ? targetDef.customIds.map(String) : [];
  const includeOwner = Boolean(targetDef.includeOwner);

  const allUsers = await db.select().from(users).all();
  // Filter out app-restricted users by default
  const eligibleUsers = allUsers.filter((u) => {
    if (u.isBlocked) return false;
    if (!includeOwner && String(u.telegramId) === OWNER_TELEGRAM_ID) return false;
    return true;
  });

  const now = Date.now();
  let targetTgIds = [];

  switch (segment) {
    case 'all':
      targetTgIds = eligibleUsers.map((u) => u.telegramId);
      break;

    case 'active_7d': {
      const start7d = now - 7 * 86400 * 1000;
      const recent = await db
        .select()
        .from(activityEvents)
        .where(gte(activityEvents.occurredAt, start7d))
        .all();
      const activeIds = new Set(recent.map((e) => e.telegramUserId));
      targetTgIds = eligibleUsers.filter((u) => activeIds.has(u.telegramId)).map((u) => u.telegramId);
      break;
    }

    case 'active_30d': {
      const start30d = now - 30 * 86400 * 1000;
      const recent = await db
        .select()
        .from(activityEvents)
        .where(gte(activityEvents.occurredAt, start30d))
        .all();
      const activeIds = new Set(recent.map((e) => e.telegramUserId));
      targetTgIds = eligibleUsers.filter((u) => activeIds.has(u.telegramId)).map((u) => u.telegramId);
      break;
    }

    case 'inactive_30d': {
      const start30d = now - 30 * 86400 * 1000;
      const recent = await db
        .select()
        .from(activityEvents)
        .where(gte(activityEvents.occurredAt, start30d))
        .all();
      const activeIds = new Set(recent.map((e) => e.telegramUserId));
      targetTgIds = eligibleUsers.filter((u) => !activeIds.has(u.telegramId)).map((u) => u.telegramId);
      break;
    }

    case 'new_7d': {
      const start7d = now - 7 * 86400 * 1000;
      targetTgIds = eligibleUsers.filter((u) => u.firstSeenAt >= start7d).map((u) => u.telegramId);
      break;
    }

    case 'vip':
      targetTgIds = eligibleUsers.filter((u) => u.isVip).map((u) => u.telegramId);
      break;

    case 'custom':
      targetTgIds = customIds.filter((id) => includeOwner || id !== OWNER_TELEGRAM_ID);
      break;

    default:
      targetTgIds = eligibleUsers.map((u) => u.telegramId);
  }

  // Deduplicate
  return Array.from(new Set(targetTgIds));
}

/**
 * Snapshots resolved recipients into the broadcast_recipients table.
 * Deduplicates and creates atomic recipient records with status 'pending'.
 */
export async function snapshotCampaignRecipients(campaignId, targetDef) {
  const targetIds = await resolveTargetRecipients(targetDef);
  const now = Date.now();

  const recipientRows = [];
  for (const tgId of targetIds) {
    const id = `recp_${campaignId}_${tgId}`;
    recipientRows.push({
      id,
      campaignId,
      telegramUserId: tgId,
      status: RECIPIENT_STATUS.PENDING,
      attempts: 0,
      nextAttemptAt: now,
      lastAttemptAt: null,
      leaseUntil: 0,
      sentAt: null,
      telegramMessageId: null,
      errorCode: null,
      errorDescription: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (recipientRows.length > 0) {
    await db.insert(broadcastRecipients).values(recipientRows).run();
  }

  return recipientRows.length;
}
