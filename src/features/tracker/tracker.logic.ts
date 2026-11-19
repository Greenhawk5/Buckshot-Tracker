import {
  TrackerSession,
  ShellType,
  ShotEvent,
  EjectEvent,
  ShellIntel,
  AddIntelParams,
  ProbabilityResult,
  CreateSessionParams,
} from './tracker.types';
import {
  validateInitialCounts,
  canRecordShot,
  canEjectShell,
  canUndo,
  validateAddIntel,
  validateSessionInvariants,
} from './tracker.validation';

export function generateOperationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'op_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

/**
 * Advance surviving shell intelligence when position 1 is consumed (by shot or ejection).
 * Position 1 intel is consumed. All positions > 1 shift down by 1 (position 2 becomes 1, etc.).
 */
export function advanceIntelOnConsumption(intelList: ShellIntel[]): ShellIntel[] {
  if (!intelList || intelList.length === 0) return [];
  return intelList
    .filter((intel) => intel.positionFromCurrent > 1)
    .map((intel) => ({
      ...intel,
      positionFromCurrent: intel.positionFromCurrent - 1,
    }))
    .sort((a, b) => a.positionFromCurrent - b.positionFromCurrent);
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
    shellIntel: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  return session;
}

export function addShellIntel(
  session: TrackerSession,
  params: AddIntelParams,
  intelId: string = generateOperationId()
): TrackerSession {
  const check = validateAddIntel(session, params);
  if (!check.allowed) {
    throw new Error(check.error || 'Cannot add shell intelligence');
  }

  const now = Date.now();
  const newIntel: ShellIntel = {
    id: intelId,
    source: params.source || 'burner_phone',
    positionFromCurrent: params.positionFromCurrent,
    shellType: params.shellType,
    createdAt: now,
  };

  const currentIntel = session.shellIntel || [];
  const updatedIntel = [...currentIntel, newIntel].sort(
    (a, b) => a.positionFromCurrent - b.positionFromCurrent
  );

  const updated: TrackerSession = {
    ...session,
    shellIntel: updatedIntel,
    version: session.version + 1,
    updatedAt: now,
  };

  const invariantCheck = validateSessionInvariants(updated);
  if (!invariantCheck.valid) {
    throw new Error(`Invariant violation: ${invariantCheck.violations.join(', ')}`);
  }

  return updated;
}

export function removeShellIntel(
  session: TrackerSession,
  intelId: string
): TrackerSession {
  const currentIntel = session.shellIntel || [];
  const exists = currentIntel.some((i) => i.id === intelId);
  if (!exists) {
    return session;
  }

  const now = Date.now();
  const updatedIntel = currentIntel.filter((i) => i.id !== intelId);

  const updated: TrackerSession = {
    ...session,
    shellIntel: updatedIntel,
    version: session.version + 1,
    updatedAt: now,
  };

  const invariantCheck = validateSessionInvariants(updated);
  if (!invariantCheck.valid) {
    throw new Error(`Invariant violation: ${invariantCheck.violations.join(', ')}`);
  }

  return updated;
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
  const previousIntel: ShellIntel[] = [...(session.shellIntel || [])];
  const advancedIntel = advanceIntelOnConsumption(previousIntel);

  const event: ShotEvent = {
    id: eventId,
    type: 'shot',
    shell,
    previousIntel,
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
    shellIntel: isCompleted ? [] : advancedIntel,
    version: session.version + 1,
    updatedAt: now,
  };

  const invariantCheck = validateSessionInvariants(updated);
  if (!invariantCheck.valid) {
    throw new Error(`Invariant violation: ${invariantCheck.violations.join(', ')}`);
  }

  return updated;
}

export function ejectShell(
  session: TrackerSession,
  shell: ShellType | 'unknown',
  eventId: string = generateOperationId()
): TrackerSession {
  const check = canEjectShell(session, shell);
  if (!check.allowed) {
    throw new Error(check.error || 'Ejection not permitted');
  }

  // If unknown, check if position 1 is already known in shellIntel
  let effectiveShell = shell;
  const currentIntel = session.shellIntel || [];
  if (effectiveShell === 'unknown') {
    const knownPos1 = currentIntel.find((i) => i.positionFromCurrent === 1);
    if (knownPos1) {
      effectiveShell = knownPos1.shellType;
    }
  }

  const now = Date.now();
  const previousIntel: ShellIntel[] = [...currentIntel];
  const advancedIntel = advanceIntelOnConsumption(previousIntel);

  let newLive = session.liveRemaining;
  let newBlank = session.blankRemaining;

  if (effectiveShell === 'live') {
    newLive = Math.max(0, session.liveRemaining - 1);
  } else if (effectiveShell === 'blank') {
    newBlank = Math.max(0, session.blankRemaining - 1);
  }

  const event: EjectEvent = {
    id: eventId,
    type: 'eject',
    shell: effectiveShell,
    previousIntel,
    createdAt: now,
  };

  const isCompleted = newLive === 0 && newBlank === 0;

  const updated: TrackerSession = {
    ...session,
    liveRemaining: newLive,
    blankRemaining: newBlank,
    status: isCompleted ? 'completed' : 'active',
    events: [...session.events, event],
    shellIntel: isCompleted ? [] : advancedIntel,
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

  // Restore shellIntel
  let restoredIntel: ShellIntel[];
  if (lastEvent.previousIntel) {
    restoredIntel = lastEvent.previousIntel;
  } else {
    // Fallback: Shift all current intel back (+1)
    restoredIntel = (session.shellIntel || []).map((i) => ({
      ...i,
      positionFromCurrent: i.positionFromCurrent + 1,
    }));
  }

  const now = Date.now();
  const updated: TrackerSession = {
    ...session,
    liveRemaining: restoredLive,
    blankRemaining: restoredBlank,
    status: (restoredLive > 0 || restoredBlank > 0) ? 'active' : 'completed',
    events,
    shellIntel: restoredIntel,
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
