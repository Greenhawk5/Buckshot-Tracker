import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { broadcastCampaigns } from '../schema.js';
import { CAMPAIGN_STATUS, canTransitionCampaign } from '../lib/broadcast/campaign-state.js';
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

  if (!canTransitionCampaign(campaign.status, CAMPAIGN_STATUS.PAUSED)) {
    throw new EndpointError(
      `Cannot pause campaign in state '${campaign.status}'.`,
      { code: 'INVALID_TRANSITION' }
    );
  }

  const now = Date.now();
  await db
    .update(broadcastCampaigns)
    .set({
      status: CAMPAIGN_STATUS.PAUSED,
      pausedAt: now,
      updatedAt: now,
    })
    .where(eq(broadcastCampaigns.id, String(campaignId)))
    .run();

  await recordAuditLog({
    actorTelegramId: owner.id,
    action: 'pause_campaign',
    targetType: 'campaign',
    targetId: String(campaignId),
  });

  return {
    ok: true,
    campaignId,
    status: CAMPAIGN_STATUS.PAUSED,
  };
}
