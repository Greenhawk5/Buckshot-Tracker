import {
  TrackerSession,
  ShellType,
  ShotEvent,
  ProbabilityResult,
  CreateSessionParams,
} from './tracker.types';
import {
  validateInitialCounts,
  canRecordShot,
  canUndo,
  validateSessionInvariants,
} from './tracker.validation';

export function generateOperationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'op_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

export function createNewSession(params: CreateSessionParams): TrackerSession {
  const { initialLive, initialBlank, telegramUserId = 'anonymous' } = params;
  const validation = validateInitialCounts(initialLive, initialBlank);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid ammunition counts');
  }

  const now = Date.now();
  const session: TrackerSession = {
    id: params.operationId || generateOperationId(),
    telegramUserId,
    initialLive,
    initialBlank,
    liveRemaining: initialLive,
    blankRemaining: initialBlank,
    status: 'active',
    events: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  return session;
}

export function recordShot(
  session: TrackerSession,
  shell: ShellType,
  eventId: string = generateOperationId()
): TrackerSession {
  const check = canRecordShot(session, shell);
  if (!check.allowed) {
    throw new Error(check.error || 'Shot not permitted');
  }

  const now = Date.now();
  const event: ShotEvent = {
    id: eventId,
    type: 'shot',
    shell,
    createdAt: now,
  };

  const newLive = shell === 'live' ? session.liveRemaining - 1 : session.liveRemaining;
  const newBlank = shell === 'blank' ? session.blankRemaining - 1 : session.blankRemaining;
  const isCompleted = newLive === 0 && newBlank === 0;

  const updated: TrackerSession = {
    ...session,
    liveRemaining: newLive,
    blankRemaining: newBlank,
    status: isCompleted ? 'completed' : 'active',
    events: [...session.events, event],
    version: session.version + 1,
    updatedAt: now,
  };

  const invariantCheck = validateSessionInvariants(updated);
  if (!invariantCheck.valid) {
    throw new Error(`Invariant violation: ${invariantCheck.violations.join(', ')}`);
  }

  return updated;
}

export function undoLastAction(session: TrackerSession): TrackerSession {
  if (!canUndo(session)) {
    throw new Error('No reversible action to undo');
  }

  const events = [...session.events];
  const lastEvent = events.pop();
  if (!lastEvent) {
    throw new Error('No events found');
  }

  let restoredLive = session.liveRemaining;
  let restoredBlank = session.blankRemaining;

  if (lastEvent.type === 'shot') {
    if (lastEvent.shell === 'live') {
      restoredLive += 1;
    } else if (lastEvent.shell === 'blank') {
      restoredBlank += 1;
    }
  } else if (lastEvent.type === 'eject' && lastEvent.shell !== 'unknown') {
    if (lastEvent.shell === 'live') {
      restoredLive += 1;
    } else if (lastEvent.shell === 'blank') {
      restoredBlank += 1;
    }
  } else {
    throw new Error('Cannot undo unknown shell ejection');
  }

  const now = Date.now();
  const updated: TrackerSession = {
    ...session,
    liveRemaining: restoredLive,
    blankRemaining: restoredBlank,
    status: (restoredLive > 0 || restoredBlank > 0) ? 'active' : 'completed',
    events,
    version: session.version + 1,
    updatedAt: now,
  };

  const invariantCheck = validateSessionInvariants(updated);
  if (!invariantCheck.valid) {
    throw new Error(`Invariant violation: ${invariantCheck.violations.join(', ')}`);
  }

  return updated;
}

export function calculateProbability(session: TrackerSession): ProbabilityResult | null {
  const total = session.liveRemaining + session.blankRemaining;
  if (total <= 0) {
    return null;
  }

  const livePercentage = Math.round((session.liveRemaining / total) * 100);
  const blankPercentage = 100 - livePercentage;

  return {
    livePercentage,
    blankPercentage,
    totalRemaining: total,
  };
}
