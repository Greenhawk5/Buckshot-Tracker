import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { requireOwner, OWNER_TELEGRAM_ID } from '../lib/auth/require-owner.js';
import { users } from '../schema.js';
import { recordAuditLog } from '../lib/audit/audit-service.js';

export default async function (input, ctx) {
  const owner = requireOwner(ctx);
  const { telegramUserId, reason = 'Administrative restriction' } = input || {};

  if (!telegramUserId) {
    throw new EndpointError('telegramUserId is required', { code: 'VALIDATION_ERROR' });
  }

  const tgIdStr = String(telegramUserId);
  if (tgIdStr === OWNER_TELEGRAM_ID) {
    throw new EndpointError('Cannot restrict the owner account.', { code: 'FORBIDDEN' });
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, tgIdStr))
    .get();

  if (!existing) {
    throw new EndpointError('User not found', { code: 'NOT_FOUND' });
  }

  const now = Date.now();
  await db
    .update(users)
    .set({
      isBlocked: true,
      updatedAt: now,
    })
    .where(eq(users.telegramId, tgIdStr))
    .run();

  await recordAuditLog({
    actorTelegramId: owner.id,
    action: 'restrict_user',
    targetType: 'user',
    targetId: tgIdStr,
    details: { reason },
  });

  return {
    ok: true,
    success: true,
    telegramUserId: tgIdStr,
    isBlocked: true,
  };
}
