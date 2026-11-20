import { db, EndpointError } from 'sdk';
import { desc } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import {
  users,
  activityEvents,
  trackerSessions,
  broadcastCampaigns,
  adminAuditLogs,
  feedbackReports,
} from '../schema.js';
import { recordAuditLog } from '../lib/audit/audit-service.js';

/**
 * Escapes values for CSV output to prevent formula injection (=, +, -, @)
 * and properly quote commas, quotes, and newlines. Preserves UTF-8 Unicode.
 */
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // Neutralize spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvString(headers, rows) {
  const headerLine = headers.join(',');
  const rowLines = rows.map((r) => headers.map((h) => escapeCsvValue(r[h])).join(','));
  return [headerLine, ...rowLines].join('\n');
}

export default async function (input, ctx) {
  const owner = requireOwner(ctx);
  const { type = 'users', format = 'csv' } = input || {};

  let data = [];
  let headers = [];

  switch (type) {
    case 'users': {
      data = await db.select().from(users).orderBy(desc(users.lastSeenAt)).all();
      headers = [
        'telegramId',
        'firstName',
        'lastName',
        'username',
        'displayAlias',
        'isVip',
        'isBlocked',
        'firstSeenAt',
        'lastSeenAt',
      ];
      break;
    }

    case 'events': {
      data = await db.select().from(activityEvents).orderBy(desc(activityEvents.occurredAt)).all();
      headers = [
        'eventId',
        'telegramUserId',
        'eventType',
        'eventCategory',
        'sessionId',
        'metadataJson',
        'occurredAt',
      ];
      break;
    }

    case 'sessions': {
      data = await db.select().from(trackerSessions).orderBy(desc(trackerSessions.createdAt)).all();
      headers = [
        'id',
        'telegramUserId',
        'initialLive',
        'initialBlank',
        'liveRemaining',
        'blankRemaining',
        'status',
        'version',
        'createdAt',
        'updatedAt',
      ];
      break;
    }

    case 'campaigns': {
      data = await db.select().from(broadcastCampaigns).orderBy(desc(broadcastCampaigns.createdAt)).all();
      headers = [
        'id',
        'title',
        'messageType',
        'status',
        'totalRecipients',
        'sentCount',
        'failedCount',
        'createdAt',
        'startedAt',
        'completedAt',
      ];
      break;
    }

    case 'audit': {
      data = await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.occurredAt)).all();
      headers = [
        'id',
        'actorTelegramId',
        'action',
        'targetType',
        'targetId',
        'outcome',
        'occurredAt',
      ];
      break;
    }

    case 'feedback': {
      data = await db.select().from(feedbackReports).orderBy(desc(feedbackReports.createdAt)).all();
      headers = ['id', 'telegramUserId', 'category', 'message', 'status', 'ownerResponse', 'createdAt'];
      break;
    }

    default:
      throw new EndpointError(`Unknown export type: ${type}`, { code: 'VALIDATION_ERROR' });
  }

  await recordAuditLog({
    actorTelegramId: owner.id,
    action: 'export_report',
    targetType: type,
    details: { format, rowCount: data.length },
  });

  if (format === 'json') {
    return {
      ok: true,
      type,
      format: 'json',
      rowCount: data.length,
      content: JSON.stringify(data, null, 2),
      filename: `buckshot_${type}_${Date.now()}.json`,
    };
  }

  const csvContent = toCsvString(headers, data);
  return {
    ok: true,
    type,
    format: 'csv',
    rowCount: data.length,
    content: csvContent,
    filename: `buckshot_${type}_${Date.now()}.csv`,
  };
}

