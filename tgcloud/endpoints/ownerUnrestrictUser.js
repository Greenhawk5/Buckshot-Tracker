import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { users } from '../schema.js';
import { recordAuditLog } from '../lib/audit/audit-service.js';

export default async function (input, ctx) {
  const owner = requireOwner(ctx);
  const { telegramUserId } = input || {};

  if (!telegramUserId) {
    throw new EndpointError('telegramUserId is required', { code: 'VALIDATION_ERROR' });
  }

  const tgIdStr = String(telegramUserId);

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
      isBlocked: false,
      updatedAt: now,
    })
    .where(eq(users.telegramId, tgIdStr))
    .run();

  await recordAuditLog({
    actorTelegramId: owner.id,
    action: 'unrestrict_user',
    targetType: 'user',
    targetId: tgIdStr,
  });

  return {
    ok: true,
    success: true,
    telegramUserId: tgIdStr,
    isBlocked: false,
  };
}
