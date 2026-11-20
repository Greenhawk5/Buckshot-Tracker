import { db } from 'sdk';
import { desc } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { adminAuditLogs } from '../schema.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const { page = 1, limit = 20, action = 'all' } = input || {};

  const allLogs = await db
    .select()
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.occurredAt))
    .all();

  const filtered = action !== 'all' ? allLogs.filter((l) => l.action === action) : allLogs;

  const total = filtered.length;
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * pageSize;
  const paged = filtered.slice(offset, offset + pageSize);

  return {
    ok: true,
    logs: paged,
    total,
    page: pageNum,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

