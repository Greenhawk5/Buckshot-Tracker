import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { broadcastCampaigns, broadcastRecipients } from '../schema.js';
import { CAMPAIGN_STATUS, RECIPIENT_STATUS } from '../lib/broadcast/campaign-state.js';
import { recordAuditLog } from '../lib/audit/audit-service.js';

export default async function (input, ctx) {
  const owner = requireOwner(ctx);
  const { campaignId } = input || {};

  if (!campaignId) {
    throw new EndpointError('campaignId is required', { code: 'VALIDATION_ERROR' });
  }

  const campaign = await db
    .select()
    .from(broadcastCampaigns)
    .where(eq(broadcastCampaigns.id, String(campaignId)))
    .get();

  if (!campaign) {
    throw new EndpointError('Campaign not found', { code: 'NOT_FOUND' });
  }

  const now = Date.now();
  // Find all failed_retryable recipients
  const recipients = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.campaignId, String(campaignId)))
    .all();

  const retryable = recipients.filter((r) => r.status === RECIPIENT_STATUS.FAILED_RETRYABLE);

  for (const r of retryable) {
    await db
      .update(broadcastRecipients)
      .set({
        status: RECIPIENT_STATUS.PENDING,
        nextAttemptAt: now,
        leaseUntil: 0,
        updatedAt: now,
      })
      .where(eq(broadcastRecipients.id, r.id))
      .run();
  }

  if (retryable.length > 0) {
    await db
      .update(broadcastCampaigns)
      .set({
        status: CAMPAIGN_STATUS.QUEUED,
        updatedAt: now,
      })
      .where(eq(broadcastCampaigns.id, String(campaignId)))
      .run();
  }

  await recordAuditLog({
    actorTelegramId: owner.id,
    action: 'retry_campaign',
    targetType: 'campaign',
    targetId: String(campaignId),
    details: { retriedCount: retryable.length },
  });

  return {
    ok: true,
    campaignId,
    retriedCount: retryable.length,
    status: retryable.length > 0 ? CAMPAIGN_STATUS.QUEUED : campaign.status,
  };
}
