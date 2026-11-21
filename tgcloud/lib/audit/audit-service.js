import { db } from 'sdk';
import { adminAuditLogs } from '../../schema.js';

/**
 * Records an immutable administrative audit log entry for sensitive owner mutations.
 */
export async function recordAuditLog({
  actorTelegramId,
  action,
  targetType,
  targetId = null,
  details = null,
  outcome = 'success',
  requestId = null,
}) {
  const now = Date.now();
  const id = `audit_${now}_${Math.random().toString(36).slice(2, 9)}`;

  let detailsJson = null;
  if (details && typeof details === 'object') {
    try {
      const sanitized = { ...details };
      // Strip credentials or sensitive blobs
      delete sanitized.token;
      delete sanitized.secret;
      delete sanitized.initData;
      detailsJson = JSON.stringify(sanitized).slice(0, 2048);
    } catch {
      detailsJson = null;
    }
  }

  try {
    await db.insert(adminAuditLogs).values({
      id,
      actorTelegramId: String(actorTelegramId),
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      detailsJson,
      outcome,
      requestId: requestId ? String(requestId) : null,
      occurredAt: now,
    }).run();
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

