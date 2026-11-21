import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { broadcastCampaigns, broadcastRecipients } from '../schema.js';
import { CAMPAIGN_STATUS, RECIPIENT_STATUS, canTransitionCampaign } from '../lib/broadcast/campaign-state.js';
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

  if (!canTransitionCampaign(campaign.status, CAMPAIGN_STATUS.CANCELLED)) {
    throw new EndpointError(
      `Cannot cancel campaign in terminal state '${campaign.status}'.`,
      { code: 'INVALID_TRANSITION' }
    );
  }

  const now = Date.now();
  await db
    .update(broadcastCampaigns)
    .set({
      status: CAMPAIGN_STATUS.CANCELLED,
      cancelledAt: now,
      updatedAt: now,
    })
    .where(eq(broadcastCampaigns.id, String(campaignId)))
    .run();

  // Cancel any still-pending recipients
  const recipients = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.campaignId, String(campaignId)))
    .all();

  for (const r of recipients) {
    if (r.status === RECIPIENT_STATUS.PENDING || r.status === RECIPIENT_STATUS.FAILED_RETRYABLE) {
      await db
        .update(broadcastRecipients)
        .set({ status: RECIPIENT_STATUS.CANCELLED, updatedAt: now })
        .where(eq(broadcastRecipients.id, r.id))
        .run();
    }
  }

  await recordAuditLog({
    actorTelegramId: owner.id,
    action: 'cancel_campaign',
    targetType: 'campaign',
    targetId: String(campaignId),
  });

  return {
    ok: true,
    campaignId,
    status: CAMPAIGN_STATUS.CANCELLED,
  };
}

