import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { requireOwner } from '../lib/auth/require-owner.js';
import { feedbackReports } from '../schema.js';
import { recordAuditLog } from '../lib/audit/audit-service.js';

export default async function (input, ctx) {
  const owner = requireOwner(ctx);
  const { reportId, status, ownerResponse } = input || {};

  if (!reportId) {
    throw new EndpointError('reportId is required', { code: 'VALIDATION_ERROR' });
  }

  const existing = await db
    .select()
    .from(feedbackReports)
    .where(eq(feedbackReports.id, String(reportId)))
    .get();

  if (!existing) {
    throw new EndpointError('Feedback report not found', { code: 'NOT_FOUND' });
  }

  const updates = { updatedAt: Date.now() };
  if (status) updates.status = status;
  if (ownerResponse !== undefined) updates.ownerResponse = ownerResponse ? String(ownerResponse).slice(0, 1024) : null;

  await db
    .update(feedbackReports)
    .set(updates)
    .where(eq(feedbackReports.id, String(reportId)))
    .run();

  await recordAuditLog({
    actorTelegramId: owner.id,
    action: 'update_feedback_status',
    targetType: 'feedback_report',
    targetId: String(reportId),
    details: updates,
  });

  const updated = await db
    .select()
    .from(feedbackReports)
    .where(eq(feedbackReports.id, String(reportId)))
    .get();

  return {
    ok: true,
    report: updated,
  };
}
