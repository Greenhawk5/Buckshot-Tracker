import { db } from 'sdk';
import { desc } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { broadcastCampaigns } from '../schema.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const { page = 1, limit = 20, status = 'all' } = input || {};

  const all = await db
    .select()
    .from(broadcastCampaigns)
    .orderBy(desc(broadcastCampaigns.createdAt))
    .all();

  const filtered = status !== 'all' ? all.filter((c) => c.status === status) : all;

  const total = filtered.length;
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * pageSize;
  const paged = filtered.slice(offset, offset + pageSize);

  return {
    ok: true,
    campaigns: paged,
    total,
    page: pageNum,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

