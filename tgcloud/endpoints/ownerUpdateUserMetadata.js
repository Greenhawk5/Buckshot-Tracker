import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { users } from '../schema.js';
import { recordAuditLog } from '../lib/audit/audit-service.js';

export default async function (input, ctx) {
  const owner = requireOwner(ctx);
  const { telegramUserId, displayAlias, hideName, isVip, ownerNotes } = input || {};

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

  const updates = {
    updatedAt: Date.now(),
  };

  if (displayAlias !== undefined) updates.displayAlias = displayAlias ? String(displayAlias).slice(0, 64) : null;
  if (hideName !== undefined) updates.hideName = Boolean(hideName);
  if (isVip !== undefined) updates.isVip = Boolean(isVip);
  if (ownerNotes !== undefined) updates.ownerNotes = ownerNotes ? String(ownerNotes).slice(0, 1024) : null;

  await db
    .update(users)
    .set(updates)
    .where(eq(users.telegramId, tgIdStr))
    .run();

  await recordAuditLog({
    actorTelegramId: owner.id,
    action: 'update_user_metadata',
    targetType: 'user',
    targetId: tgIdStr,
    details: updates,
  });

  const updated = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, tgIdStr))
    .get();

  return {
    ok: true,
    user: updated,
  };
}

