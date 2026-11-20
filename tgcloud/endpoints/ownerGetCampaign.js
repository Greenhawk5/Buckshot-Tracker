import { db, EndpointError } from 'sdk';
import { eq, desc } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { broadcastCampaigns, broadcastRecipients } from '../schema.js';

export default async function (input, ctx) {
  requireOwner(ctx);
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

  const recipients = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.campaignId, String(campaignId)))
    .orderBy(desc(broadcastRecipients.updatedAt))
    .all();

  const statusSummary = {};
  for (const r of recipients) {
    statusSummary[r.status] = (statusSummary[r.status] || 0) + 1;
  }

  return {
    ok: true,
    campaign,
    statusSummary,
    recipients: recipients.slice(0, 50),
    totalRecipients: recipients.length,
  };
}
