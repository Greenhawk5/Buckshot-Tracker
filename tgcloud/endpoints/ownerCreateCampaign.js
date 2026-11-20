import { db, EndpointError } from 'sdk';
import { requireOwner } from '../lib/auth/require-owner.js';
import { broadcastCampaigns } from '../schema.js';
import { VALID_MESSAGE_TYPES, CAMPAIGN_STATUS } from '../lib/broadcast/campaign-state.js';
import { resolveTargetRecipients, snapshotCampaignRecipients } from '../lib/broadcast/recipient-selection.js';
import { recordAuditLog } from '../lib/audit/audit-service.js';

export default async function (input, ctx) {
  const owner = requireOwner(ctx);
  const {
    title,
    messageType = 'text',
    contentText = '',
    mediaPayload = null,
    keyboard = null,
    targetDefinition = { segment: 'all' },
    autoStart = false,
  } = input || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new EndpointError('Campaign title is required', { code: 'VALIDATION_ERROR' });
  }
  if (!VALID_MESSAGE_TYPES.has(messageType)) {
    throw new EndpointError(`Invalid message type: ${messageType}`, { code: 'VALIDATION_ERROR' });
  }

  const now = Date.now();
  const campaignKey = `camp_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const campaignId = campaignKey;

  // Snapshot recipients
  const totalRecipients = await resolveTargetRecipients(targetDefinition);

  const initialStatus = autoStart ? CAMPAIGN_STATUS.QUEUED : CAMPAIGN_STATUS.DRAFT;

  const campaignRecord = {
    id: campaignId,
    campaignKey,
    title: title.trim().slice(0, 128),
    messageType,
    contentText: contentText ? String(contentText).slice(0, 4096) : null,
    mediaPayloadJson: mediaPayload ? JSON.stringify(mediaPayload).slice(0, 2048) : null,
    keyboardJson: keyboard ? JSON.stringify(keyboard).slice(0, 2048) : null,
    targetDefinitionJson: JSON.stringify(targetDefinition),
    status: initialStatus,
    totalRecipients: totalRecipients.length,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    createdByOwnerId: String(owner.id),
    createdAt: now,
    scheduledAt: null,
    startedAt: autoStart ? now : null,
    completedAt: null,
    pausedAt: null,
    cancelledAt: null,
    lastErrorSummary: null,
    updatedAt: now,
  };

  await db.insert(broadcastCampaigns).values(campaignRecord).run();

  // Snapshot recipient rows
  await snapshotCampaignRecipients(campaignId, targetDefinition);

  await recordAuditLog({
    actorTelegramId: owner.id,
    action: 'create_campaign',
    targetType: 'campaign',
    targetId: campaignId,
    details: { title, messageType, totalRecipients: totalRecipients.length, autoStart },
  });

  return {
    ok: true,
    campaign: campaignRecord,
  };
}

