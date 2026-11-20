import { EndpointError } from 'sdk';
import { requireOwner } from '../lib/auth/require-owner.js';
import { processBroadcastBatch } from '../lib/broadcast/batch-processor.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const { campaignId, batchSize = 5 } = input || {};

  if (!campaignId) {
    throw new EndpointError('campaignId is required', { code: 'VALIDATION_ERROR' });
  }

  const safeBatch = Math.min(20, Math.max(1, Number(batchSize) || 5));
  const result = await processBroadcastBatch(String(campaignId), safeBatch);

  return {
    ok: true,
    campaignId,
    ...result,
  };
}
