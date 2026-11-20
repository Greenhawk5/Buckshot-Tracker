import { db } from 'sdk';
import { eq, and } from 'sdk/db';
import { activityEvents } from '../../schema.js';

export const VALID_EVENT_TYPES = new Set([
  'app_opened',
  'session_created',
  'shot_recorded',
  'shell_ejected',
  'shell_intel_added',
  'shell_intel_removed',
  'undo_executed',
  'session_completed',
  'session_abandoned',
  'feedback_submitted',
  'broadcast_interaction',
]);

/**
 * Sanitizes and bounds metadata JSON to avoid storing oversized or sensitive data.
 */
function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  try {
    const copy = { ...metadata };
    // Strip forbidden or sensitive keys
    delete copy.initData;
    delete copy.rawInitData;
    delete copy.token;
    delete copy.secret;
    delete copy.password;
    delete copy.hash;

    const str = JSON.stringify(copy);
    if (str.length > 2048) {
      return JSON.stringify({ truncated: true, summary: str.slice(0, 500) });
    }
    return str;
  } catch {
    return null;
  }
}

/**
 * Records an activity event with idempotency guarantees and safe failure handling.
 */
export async function recordActivityEvent({
  telegramUserId,
  eventType,
  eventCategory = 'tracker',
  sessionId = null,
  metadata = null,
  eventId = null,
  occurredAt = Date.now(),
}) {
  if (!telegramUserId || !eventType) return null;
  if (!VALID_EVENT_TYPES.has(eventType)) {
    console.warn(`Unrecognized event type attempted: ${eventType}`);
  }

  const tgIdStr = String(telegramUserId);
  const now = Date.now();
  const resolvedEventId = eventId || `ev_${now}_${Math.random().toString(36).slice(2, 9)}`;
  const metadataJson = sanitizeMetadata(metadata);

  try {
    // Idempotency check
    if (eventId) {
      const existing = await db
        .select()
        .from(activityEvents)
        .where(and(eq(activityEvents.eventId, eventId), eq(activityEvents.telegramUserId, tgIdStr)))
        .get();

      if (existing) {
        return existing;
      }
    }

    const eventRecord = {
      eventId: resolvedEventId,
      telegramUserId: tgIdStr,
      eventType,
      eventCategory,
      sessionId: sessionId ? String(sessionId) : null,
      metadataJson,
      occurredAt,
      createdAt: now,
    };

    await db.insert(activityEvents).values(eventRecord).run();
    return eventRecord;
  } catch (err) {
    // Best-effort: Log analytics failure so it never blocks the primary game action
    console.error(`Failed to record activity event [${eventType}]:`, err);
    return null;
  }
}

