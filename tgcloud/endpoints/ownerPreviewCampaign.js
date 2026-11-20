import { EndpointError } from 'sdk';
import { requireOwner } from '../lib/auth/require-owner.js';
import { VALID_MESSAGE_TYPES } from '../lib/broadcast/campaign-state.js';
import { resolveTargetRecipients } from '../lib/broadcast/recipient-selection.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const { messageType = 'text', contentText = '', targetDefinition = { segment: 'all' } } = input || {};

  if (!VALID_MESSAGE_TYPES.has(messageType)) {
    throw new EndpointError(`Invalid message type: ${messageType}`, { code: 'VALIDATION_ERROR' });
  }

  const recipientIds = await resolveTargetRecipients(targetDefinition);

  return {
    ok: true,
    preview: {
      messageType,
      contentText,
      totalRecipients: recipientIds.length,
      sampleRecipients: recipientIds.slice(0, 5),
    },
  };
}
