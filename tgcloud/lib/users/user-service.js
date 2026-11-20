import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { users } from '../../schema.js';

export const OWNER_TELEGRAM_ID = '184202422';

/**
 * Upserts a Telegram user in the registry whenever an interaction occurs.
 * Preserves private owner aliases, notes, and VIP/blocked status.
 */
export async function upsertObservedUser(telegramUser, options = {}) {
  if (!telegramUser || telegramUser.id === undefined || telegramUser.id === null) {
    return null;
  }

  const tgIdStr = String(telegramUser.id);
  const now = Date.now();
  const firstName = telegramUser.first_name || null;
  const lastName = telegramUser.last_name || null;
  const username = telegramUser.username || null;
  const languageCode = telegramUser.language_code || null;

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, tgIdStr))
      .get();

    if (existing) {
      const updates = {
        firstName,
        lastName,
        username,
        languageCode,
        lastSeenAt: now,
        updatedAt: now,
      };

      if (options.isAppOpen) {
        updates.lastAppOpenedAt = now;
      }
      if (options.isSessionCreated) {
        updates.lastSessionCreatedAt = now;
      }

      await db
        .update(users)
        .set(updates)
        .where(eq(users.telegramId, tgIdStr))
        .run();

      return {
        ...existing,
        ...updates,
      };
    }

    const newUser = {
      telegramId: tgIdStr,
      firstName,
      lastName,
      username,
      languageCode,
      firstSeenAt: now,
      lastSeenAt: now,
      lastAppOpenedAt: options.isAppOpen ? now : null,
      lastSessionCreatedAt: options.isSessionCreated ? now : null,
      isBlocked: false,
      isVip: false,
      displayAlias: null,
      hideName: false,
      ownerNotes: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(users).values(newUser).run();
    return newUser;
  } catch (err) {
    console.error('Failed to upsert observed user:', err);
    return null;
  }
}

/**
 * Checks whether an observed user is restricted at the application level.
 * The Owner ID 184202422 is never restricted.
 */
export async function checkUserRestriction(telegramUserId) {
  if (!telegramUserId) return;
  const tgIdStr = String(telegramUserId);
  if (tgIdStr === OWNER_TELEGRAM_ID) return;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, tgIdStr))
    .get();

  if (user && user.isBlocked) {
    throw new EndpointError('Access to application features is restricted for this account.', {
      code: 'USER_RESTRICTED',
    });
  }
}

/**
 * Retrieves a user by their Telegram ID.
 */
export async function getUserByTelegramId(telegramUserId) {
  if (!telegramUserId) return null;
  const tgIdStr = String(telegramUserId);
  return db
    .select()
    .from(users)
    .where(eq(users.telegramId, tgIdStr))
    .get();
}
