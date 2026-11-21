import { db, api } from 'sdk';
import { eq, and, lte, or, inArray } from 'sdk/db';
import { broadcastCampaigns, broadcastRecipients } from '../../schema.js';
import { CAMPAIGN_STATUS, RECIPIENT_STATUS } from './campaign-state.js';
import { classifyTelegramError } from './retry-policy.js';
import { getSystemSettings } from '../settings/settings-service.js';

/**
 * Dispatches a single message via the Telegram Bot API proxy.
 */
async function dispatchTelegramMessage(campaign, chatId) {
  const messageType = campaign.messageType || 'text';
  const text = campaign.contentText || '';

  let replyMarkup = undefined;
  if (campaign.keyboardJson) {
    try {
      replyMarkup = JSON.parse(campaign.keyboardJson);
    } catch {
      replyMarkup = undefined;
    }
  }

  let media = null;
  if (campaign.mediaPayloadJson) {
    try {
      const parsed = JSON.parse(campaign.mediaPayloadJson);
      media = parsed?.fileId || parsed?.url || parsed?.payload;
    } catch {
      media = campaign.mediaPayloadJson;
    }
  }

  switch (messageType) {
    case 'text':
      return api.sendMessage({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });

    case 'photo':
      return api.sendPhoto({
        chat_id: chatId,
        photo: media,
        caption: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });

    case 'video':
      return api.sendVideo({
        chat_id: chatId,
        video: media,
        caption: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });

    case 'voice':
      return api.sendVoice({
        chat_id: chatId,
        voice: media,
        caption: text,
        reply_markup: replyMarkup,
      });

    case 'video_note':
      return api.sendVideoNote({
        chat_id: chatId,
        video_note: media,
        reply_markup: replyMarkup,
      });

    case 'document':
      return api.sendDocument({
        chat_id: chatId,
        document: media,
        caption: text,
        reply_markup: replyMarkup,
      });

    default:
      return api.sendMessage({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });
  }
}

/**
 * Bounded, resumable batch processor for broadcast campaigns.
 * Processes up to `batchSize` recipients per call, ensuring non-blocking execution,
 * rate limit compliance, and atomic claim/lease semantics.
 */
export async function processBroadcastBatch(campaignId, batchSize = 5) {
  const settings = await getSystemSettings();
  if (settings.globalBroadcastPaused) {
    return {
      paused: true,
      reason: 'Global broadcast is currently paused in settings.',
      processedCount: 0,
    };
  }

  const campaign = await db
    .select()
    .from(broadcastCampaigns)
    .where(eq(broadcastCampaigns.id, campaignId))
    .get();

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  if (campaign.status === CAMPAIGN_STATUS.PAUSED || campaign.status === CAMPAIGN_STATUS.CANCELLED) {
    return {
      status: campaign.status,
      processedCount: 0,
      remainingCount: 0,
    };
  }

  const now = Date.now();

  // Find candidate claimable recipients:
  // 1. Pending or retryable (with nextAttemptAt <= now and leaseUntil <= now)
  // 2. OR currently in 'sending' whose lease has expired (leaseUntil <= now) -> expired lease recovery
  const allRecipients = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.campaignId, campaignId))
    .all();

  const claimableCandidates = allRecipients.filter((r) => {
    const isPendingOrRetryable =
      r.status === RECIPIENT_STATUS.PENDING || r.status === RECIPIENT_STATUS.FAILED_RETRYABLE;
    const isExpiredSending =
      r.status === RECIPIENT_STATUS.SENDING && (r.leaseUntil || 0) <= now;
    const isReadyTime = (r.nextAttemptAt || 0) <= now;
    const isLeaseExpired = (r.leaseUntil || 0) <= now;

    return (isPendingOrRetryable && isReadyTime && isLeaseExpired) || isExpiredSending;
  });

  // Genuinely atomic recipient claiming using Compare-And-Swap (CAS) conditional updates.
  // Guarantees that concurrent batch invocations cannot claim the same recipient.
  const leaseTime = now + 60000;
  const claimedBatch = [];

  for (const candidate of claimableCandidates) {
    if (claimedBatch.length >= batchSize) {
      break;
    }

    const claimResult = await db
      .update(broadcastRecipients)
      .set({
        status: RECIPIENT_STATUS.SENDING,
        leaseUntil: leaseTime,
        updatedAt: now,
      })
      .where(
        and(
          eq(broadcastRecipients.id, candidate.id),
          or(
            eq(broadcastRecipients.status, RECIPIENT_STATUS.PENDING),
            eq(broadcastRecipients.status, RECIPIENT_STATUS.FAILED_RETRYABLE),
            and(
              eq(broadcastRecipients.status, RECIPIENT_STATUS.SENDING),
              lte(broadcastRecipients.leaseUntil, now)
            )
          ),
          lte(broadcastRecipients.leaseUntil, now),
          lte(broadcastRecipients.nextAttemptAt, now)
        )
      )
      .run();

    if (claimResult && claimResult.rowsAffected === 1) {
      claimedBatch.push({
        ...candidate,
        status: RECIPIENT_STATUS.SENDING,
        leaseUntil: leaseTime,
        updatedAt: now,
      });
    }
  }

  const batch = claimedBatch;

  if (batch.length === 0) {
    // Check if campaign is finished or has remaining in-flight/retryable recipients
    const hasRemaining = allRecipients.some((r) => {
      if (r.status === RECIPIENT_STATUS.PENDING || r.status === RECIPIENT_STATUS.FAILED_RETRYABLE) {
        return true;
      }
      if (r.status === RECIPIENT_STATUS.SENDING) {
        return true;
      }
      return false;
    });

    if (!hasRemaining && campaign.status === CAMPAIGN_STATUS.RUNNING) {
      const finalStatus =
        campaign.failedCount > 0 ? CAMPAIGN_STATUS.COMPLETED_WITH_ERRORS : CAMPAIGN_STATUS.COMPLETED;
      await db
        .update(broadcastCampaigns)
        .set({
          status: finalStatus,
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(broadcastCampaigns.id, campaignId))
        .run();
      return { status: finalStatus, processedCount: 0, remainingCount: 0 };
    }

    const uncompletedCount = allRecipients.filter(
      (r) => r.status !== RECIPIENT_STATUS.SENT && r.status !== RECIPIENT_STATUS.FAILED_PERMANENT
    ).length;

    return {
      status: campaign.status,
      processedCount: 0,
      remainingCount: uncompletedCount,
    };
  }

  // Update campaign to running if it was queued
  if (campaign.status === CAMPAIGN_STATUS.QUEUED) {
    await db
      .update(broadcastCampaigns)
      .set({
        status: CAMPAIGN_STATUS.RUNNING,
        startedAt: campaign.startedAt || now,
        updatedAt: now,
      })
      .where(eq(broadcastCampaigns.id, campaignId))
      .run();
  }

  let sentDelta = 0;
  let failedDelta = 0;

  for (const item of batch) {
    const sendNow = Date.now();
    try {
      const result = await dispatchTelegramMessage(campaign, item.telegramUserId);
      const msgId = result?.message_id || null;

      await db
        .update(broadcastRecipients)
        .set({
          status: RECIPIENT_STATUS.SENT,
          sentAt: sendNow,
          telegramMessageId: msgId,
          attempts: (item.attempts || 0) + 1,
          leaseUntil: 0,
          updatedAt: sendNow,
        })
        .where(eq(broadcastRecipients.id, item.id))
        .run();

      sentDelta++;
    } catch (err) {
      const classification = classifyTelegramError(err, (item.attempts || 0) + 1);
      const nextStatus = classification.isRetryable
        ? RECIPIENT_STATUS.FAILED_RETRYABLE
        : RECIPIENT_STATUS.FAILED_PERMANENT;

      await db
        .update(broadcastRecipients)
        .set({
          status: nextStatus,
          attempts: (item.attempts || 0) + 1,
          nextAttemptAt: classification.nextAttemptAt,
          errorCode: classification.code,
          errorDescription: classification.description,
          leaseUntil: 0,
          updatedAt: sendNow,
        })
        .where(eq(broadcastRecipients.id, item.id))
        .run();

      if (!classification.isRetryable) {
        failedDelta++;
      }
    }

    // Pacing delay
    const pacingMs = settings.defaultBroadcastPacingMs || 50;
    if (pacingMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, pacingMs));
    }
  }

  // Update campaign counts
  const newSent = campaign.sentCount + sentDelta;
  const newFailed = campaign.failedCount + failedDelta;

  await db
    .update(broadcastCampaigns)
    .set({
      sentCount: newSent,
      failedCount: newFailed,
      updatedAt: Date.now(),
    })
    .where(eq(broadcastCampaigns.id, campaignId))
    .run();

  // Re-check remaining
  const updatedAll = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.campaignId, campaignId))
    .all();

  const remaining = updatedAll.filter(
    (r) => r.status === RECIPIENT_STATUS.PENDING || r.status === RECIPIENT_STATUS.FAILED_RETRYABLE
  ).length;

  let finalStatus = CAMPAIGN_STATUS.RUNNING;
  if (remaining === 0) {
    finalStatus = newFailed > 0 ? CAMPAIGN_STATUS.COMPLETED_WITH_ERRORS : CAMPAIGN_STATUS.COMPLETED;
    await db
      .update(broadcastCampaigns)
      .set({
        status: finalStatus,
        completedAt: Date.now(),
        updatedAt: Date.now(),
      })
      .where(eq(broadcastCampaigns.id, campaignId))
      .run();
  }

  return {
    status: finalStatus,
    processedCount: batch.length,
    sentDelta,
    failedDelta,
    remainingCount: remaining,
  };
}

