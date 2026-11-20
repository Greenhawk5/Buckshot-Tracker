import { db, EndpointError } from 'sdk';
import { feedbackReports } from '../schema.js';
import { getAuthenticatedUserId, trackUserAndActivity } from '../lib/session-helper.js';

export default async function (input, ctx) {
  const userId = getAuthenticatedUserId(ctx);
  const { category = 'general', message = '' } = input || {};

  const validCategories = new Set(['bug', 'feature', 'general']);
  if (!validCategories.has(category)) {
    throw new EndpointError('Invalid category. Must be bug, feature, or general.', {
      code: 'VALIDATION_ERROR',
    });
  }

  const trimmedMessage = String(message).trim();
  if (!trimmedMessage || trimmedMessage.length < 3) {
    throw new EndpointError('Feedback message must be at least 3 characters.', {
      code: 'VALIDATION_ERROR',
    });
  }
  if (trimmedMessage.length > 2000) {
    throw new EndpointError('Feedback message cannot exceed 2000 characters.', {
      code: 'VALIDATION_ERROR',
    });
  }

  const now = Date.now();
  const id = `fb_${now}_${Math.random().toString(36).slice(2, 9)}`;

  await db.insert(feedbackReports).values({
    id,
    telegramUserId: userId,
    category,
    message: trimmedMessage,
    status: 'new',
    ownerResponse: null,
    createdAt: now,
    updatedAt: now,
  }).run();

  await trackUserAndActivity(ctx, {
    eventType: 'feedback_submitted',
    eventCategory: 'feedback',
    metadata: { category },
    eventId: `ev_${id}`,
  });

  return {
    ok: true,
    feedbackId: id,
    message: 'Thank you for your feedback!',
  };
}
