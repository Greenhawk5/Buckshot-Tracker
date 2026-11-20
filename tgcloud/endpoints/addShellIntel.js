import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { trackerSessions, processedOperations } from '../schema.js';
import { getAuthenticatedUserId, formatSessionRow, trackUserAndActivity } from '../lib/session-helper.js';

export default async function (input, ctx) {
  const userId = getAuthenticatedUserId(ctx);
  const { sessionId, positionFromCurrent, shellType, source = 'burner_phone', expectedVersion, operationId } = input || {};

  if (!sessionId) {
    throw new EndpointError('Session ID is required', { code: 'VALIDATION_ERROR' });
  }
  if (typeof positionFromCurrent !== 'number' || !Number.isInteger(positionFromCurrent)) {
    throw new EndpointError('Valid integer position is required', { code: 'VALIDATION_ERROR' });
  }
  if (shellType !== 'live' && shellType !== 'blank') {
    throw new EndpointError('Invalid shell type. Must be live or blank.', { code: 'VALIDATION_ERROR' });
  }

  // Idempotency check
  if (operationId) {
    const existingOp = await db
      .select()
      .from(processedOperations)
      .where(and(eq(processedOperations.operationId, operationId), eq(processedOperations.telegramUserId, userId)))
      .get();

    if (existingOp) {
      const current = await db
        .select()
        .from(trackerSessions)
        .where(eq(trackerSessions.id, sessionId))
        .get();
      if (current) {
        return { ok: true, session: formatSessionRow(current) };
      }
    }
  }

  // Retrieve current session
  const session = await db
    .select()
    .from(trackerSessions)
    .where(and(eq(trackerSessions.id, sessionId), eq(trackerSessions.telegramUserId, userId)))
    .get();

  if (!session) {
    throw new EndpointError('Session not found', { code: 'NOT_FOUND' });
  }

  if (session.status !== 'active') {
    throw new EndpointError('Session is already completed.', { code: 'VALIDATION_ERROR' });
  }

  // Optimistic concurrency check
  if (typeof expectedVersion === 'number' && session.version !== expectedVersion) {
    throw new EndpointError('Session state is out of date.', {
      code: 'VERSION_CONFLICT',
      latestSession: formatSessionRow(session),
    });
  }

  const totalRemaining = session.liveRemaining + session.blankRemaining;
  if (totalRemaining < 2) {
    throw new EndpointError('Burner Phone requires at least 2 remaining shells ("How unfortunate...").', {
      code: 'VALIDATION_ERROR',
    });
  }

  if (positionFromCurrent < 2) {
    throw new EndpointError('Position must be at least 2 (Burner Phone cannot reveal the currently chambered shell).', {
      code: 'VALIDATION_ERROR',
    });
  }

  if (positionFromCurrent > totalRemaining) {
    throw new EndpointError(`Position ${positionFromCurrent} exceeds remaining shells (${totalRemaining}).`, {
      code: 'VALIDATION_ERROR',
    });
  }

  let intelList = [];
  try {
    intelList = JSON.parse(session.intelJson || '[]');
  } catch {
    intelList = [];
  }

  // Check duplicate or conflict
  const existing = intelList.find((i) => i.positionFromCurrent === positionFromCurrent);
  if (existing) {
    if (existing.shellType === shellType) {
      throw new EndpointError(`Position ${positionFromCurrent} is already recorded as ${shellType}.`, {
        code: 'DUPLICATE_INTEL',
      });
    } else {
      throw new EndpointError(`Conflict: Position ${positionFromCurrent} is already recorded as ${existing.shellType}.`, {
        code: 'CONFLICT_INTEL',
      });
    }
  }

  // Capacity check
  const knownLive = intelList.filter((i) => i.shellType === 'live').length;
  const knownBlank = intelList.filter((i) => i.shellType === 'blank').length;

  if (shellType === 'live' && knownLive + 1 > session.liveRemaining) {
    throw new EndpointError(`Cannot record Live shell: all ${session.liveRemaining} remaining live shell(s) are already known.`, {
      code: 'CAPACITY_EXCEEDED',
    });
  }
  if (shellType === 'blank' && knownBlank + 1 > session.blankRemaining) {
    throw new EndpointError(`Cannot record Blank shell: all ${session.blankRemaining} remaining blank shell(s) are already known.`, {
      code: 'CAPACITY_EXCEEDED',
    });
  }

  const now = Date.now();
  const intelId = operationId || `intel_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const newIntel = {
    id: intelId,
    source,
    positionFromCurrent,
    shellType,
    createdAt: now,
  };

  const updatedIntel = [...intelList, newIntel].sort((a, b) => a.positionFromCurrent - b.positionFromCurrent);
  const nextVersion = session.version + 1;

  await db
    .update(trackerSessions)
    .set({
      intelJson: JSON.stringify(updatedIntel),
      version: nextVersion,
      updatedAt: now,
    })
    .where(eq(trackerSessions.id, sessionId))
    .run();

  if (operationId) {
    await db.insert(processedOperations).values({
      operationId,
      telegramUserId: userId,
      sessionId,
      createdAt: now,
    }).run();
  }

  await trackUserAndActivity(ctx, {
    eventType: 'shell_intel_added',
    sessionId,
    metadata: { positionFromCurrent, shellType, source },
    eventId: operationId ? `ev_intel_add_${operationId}` : null,
  });

  const updated = await db
    .select()
    .from(trackerSessions)
    .where(eq(trackerSessions.id, sessionId))
    .get();

  return {
    ok: true,
    session: formatSessionRow(updated),
  };
}
