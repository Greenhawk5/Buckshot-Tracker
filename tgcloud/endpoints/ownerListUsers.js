import { db } from 'sdk';
import { desc } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { users } from '../schema.js';

export default async function (input, ctx) {
  requireOwner(ctx);

  const {
    search = '',
    filter = 'all', // 'all' | 'vip' | 'blocked' | 'recent'
    page = 1,
    limit = 20,
  } = input || {};

  const allRows = await db
    .select()
    .from(users)
    .orderBy(desc(users.lastSeenAt))
    .all();

  const searchNorm = search.trim().toLowerCase();

  let filtered = allRows.filter((u) => {
    // Filter matching
    if (filter === 'vip' && !u.isVip) return false;
    if (filter === 'blocked' && !u.isBlocked) return false;
    if (filter === 'recent') {
      const sevenDaysAgo = Date.now() - 7 * 86400 * 1000;
      if (u.lastSeenAt < sevenDaysAgo) return false;
    }

    // Search matching
    if (searchNorm) {
      const matchTgId = u.telegramId.toLowerCase().includes(searchNorm);
      const matchUsername = (u.username || '').toLowerCase().includes(searchNorm);
      const matchFirst = (u.firstName || '').toLowerCase().includes(searchNorm);
      const matchLast = (u.lastName || '').toLowerCase().includes(searchNorm);
      const matchAlias = (u.displayAlias || '').toLowerCase().includes(searchNorm);
      return matchTgId || matchUsername || matchFirst || matchLast || matchAlias;
    }

    return true;
  });

  const total = filtered.length;
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * pageSize;
  const pagedUsers = filtered.slice(offset, offset + pageSize);

  return {
    ok: true,
    users: pagedUsers,
    total,
    page: pageNum,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}
