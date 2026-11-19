import { TrackerSession, ShellType, AddIntelParams } from './tracker.types';

export const MAX_SHELLS_PER_TYPE = 8;
export const MAX_TOTAL_SHELLS = 16;

export function isValidCount(count: unknown): count is number {
  return typeof count === 'number' && Number.isInteger(count) && count >= 0;
}

export function validateInitialCounts(live: number, blank: number): { valid: boolean; error?: string } {
  if (!isValidCount(live)) {
    return { valid: false, error: 'Live count must be a non-negative integer.' };
  }
  if (!isValidCount(blank)) {
    return { valid: false, error: 'Blank count must be a non-negative integer.' };
  }
  if (live + blank <= 0) {
    return { valid: false, error: 'Total ammunition must be greater than zero.' };
  }
  if (live > MAX_SHELLS_PER_TYPE) {
    return { valid: false, error: `Live shells cannot exceed ${MAX_SHELLS_PER_TYPE}.` };
  }
  if (blank > MAX_SHELLS_PER_TYPE) {
    return { valid: false, error: `Blank shells cannot exceed ${MAX_SHELLS_PER_TYPE}.` };
  }
  if (live + blank > MAX_TOTAL_SHELLS) {
    return { valid: false, error: `Total shells cannot exceed ${MAX_TOTAL_SHELLS}.` };
  }
  return { valid: true };
}

export function canRecordShot(session: TrackerSession, shell: ShellType): { allowed: boolean; error?: string } {
  if (session.status === 'completed') {
    return { allowed: false, error: 'Session is already completed.' };
  }
  if (shell === 'live') {
    if (session.liveRemaining <= 0) {
      return { allowed: false, error: 'No live shells remaining.' };
    }
  } else if (shell === 'blank') {
    if (session.blankRemaining <= 0) {
      return { allowed: false, error: 'No blank shells remaining.' };
    }
  } else {
    return { allowed: false, error: 'Invalid shell type.' };
  }
  return { allowed: true };
}

export function canEjectShell(session: TrackerSession, shell: ShellType | 'unknown'): { allowed: boolean; error?: string } {
  if (session.status === 'completed') {
    return { allowed: false, error: 'Session is already completed.' };
  }
  const totalRemaining = session.liveRemaining + session.blankRemaining;
  if (totalRemaining <= 0) {
    return { allowed: false, error: 'No shells remaining in chamber to eject.' };
  }

  // If unknown, check if position 1 is known via intelligence
  const knownPos1 = (session.shellIntel || []).find((i) => i.positionFromCurrent === 1);
  let effectiveShell = shell;
  if (effectiveShell === 'unknown') {
    if (knownPos1) {
      effectiveShell = knownPos1.shellType;
    } else {
      return { allowed: false, error: 'Cannot eject unknown shell: Chambered shell type is not known.' };
    }
  } else if (knownPos1 && effectiveShell !== knownPos1.shellType) {
    return { allowed: false, error: `Conflict: Chambered shell is already known to be ${knownPos1.shellType.toUpperCase()}.` };
  }

  if (effectiveShell === 'live') {
    if (session.liveRemaining <= 0) {
      return { allowed: false, error: 'No live shells remaining to eject.' };
    }
    const knownFutureLive = (session.shellIntel || []).filter(
      (i) => i.positionFromCurrent > 1 && i.shellType === 'live'
    ).length;
    if (session.liveRemaining <= knownFutureLive) {
      return { allowed: false, error: 'Cannot eject Live shell: all remaining live shells are known at upcoming positions.' };
    }
  } else if (effectiveShell === 'blank') {
    if (session.blankRemaining <= 0) {
      return { allowed: false, error: 'No blank shells remaining to eject.' };
    }
    const knownFutureBlank = (session.shellIntel || []).filter(
      (i) => i.positionFromCurrent > 1 && i.shellType === 'blank'
    ).length;
    if (session.blankRemaining <= knownFutureBlank) {
      return { allowed: false, error: 'Cannot eject Blank shell: all remaining blank shells are known at upcoming positions.' };
    }
  } else {
    return { allowed: false, error: 'Invalid shell type for ejection.' };
  }

  return { allowed: true };
}

export function validateAddIntel(
  session: TrackerSession,
  params: AddIntelParams
): { allowed: boolean; error?: string } {
  if (session.status === 'completed') {
    return { allowed: false, error: 'Session is already completed.' };
  }

  const totalRemaining = session.liveRemaining + session.blankRemaining;
  const mode = params.mode || 'singleplayer';
  const minRequiredShells = mode === 'multiplayer' ? 3 : 2;
  const minPos = mode === 'multiplayer' ? 3 : 2;

  if (totalRemaining < minRequiredShells) {
    return {
      allowed: false,
      error: `Burner Phone cannot be used with fewer than ${minRequiredShells} shells remaining ("How unfortunate...").`,
    };
  }

  const pos = params.positionFromCurrent;
  if (!Number.isInteger(pos) || pos < minPos) {
    return {
      allowed: false,
      error:
        mode === 'multiplayer'
          ? 'Earliest position is 3rd shell in multiplayer.'
          : `Position must be at least ${minPos} (Burner Phone cannot reveal the currently chambered shell).`,
    };
  }

  if (pos > totalRemaining) {
    return {
      allowed: false,
      error: `Position ${pos} exceeds total remaining shells (${totalRemaining}).`,
    };
  }

  if (params.shellType !== 'live' && params.shellType !== 'blank') {
    return { allowed: false, error: 'Shell type must be live or blank.' };
  }

  // Check for duplicates or conflicts at this position
  const intelList = session.shellIntel || [];
  const existing = intelList.find((i) => i.positionFromCurrent === pos);
  if (existing) {
    if (existing.shellType === params.shellType) {
      return {
        allowed: false,
        error: `Position ${pos} is already recorded as a ${params.shellType.toUpperCase()} shell.`,
      };
    } else {
      return {
        allowed: false,
        error: `Conflict: Position ${pos} is already recorded as ${existing.shellType.toUpperCase()}.`,
      };
    }
  }

  // Aggregate capacity check: ensure we don't know more live/blank shells than remain in chamber
  const knownLiveCount = intelList.filter((i) => i.shellType === 'live').length;
  const knownBlankCount = intelList.filter((i) => i.shellType === 'blank').length;

  if (params.shellType === 'live') {
    if (knownLiveCount + 1 > session.liveRemaining) {
      return {
        allowed: false,
        error: `Cannot record Live shell: all ${session.liveRemaining} remaining live shell(s) are already known.`,
      };
    }
  } else if (params.shellType === 'blank') {
    if (knownBlankCount + 1 > session.blankRemaining) {
      return {
        allowed: false,
        error: `Cannot record Blank shell: all ${session.blankRemaining} remaining blank shell(s) are already known.`,
      };
    }
  }

  return { allowed: true };
}

export function canUndo(session: TrackerSession): boolean {
  if (!session.events || session.events.length === 0) {
    return false;
  }
  const lastEvent = session.events[session.events.length - 1];
  return lastEvent.type === 'shot' || (lastEvent.type === 'eject' && lastEvent.shell !== 'unknown');
}

export function validateSessionInvariants(session: TrackerSession): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  if (!isValidCount(session.initialLive)) violations.push('initialLive must be a non-negative integer');
  if (!isValidCount(session.initialBlank)) violations.push('initialBlank must be a non-negative integer');
  if (!isValidCount(session.liveRemaining)) violations.push('liveRemaining must be a non-negative integer');
  if (!isValidCount(session.blankRemaining)) violations.push('blankRemaining must be a non-negative integer');

  if (session.liveRemaining > session.initialLive) {
    violations.push('liveRemaining exceeds initialLive');
  }
  if (session.blankRemaining > session.initialBlank) {
    violations.push('blankRemaining exceeds initialBlank');
  }

  const totalRemaining = session.liveRemaining + session.blankRemaining;
  const isCompleted = totalRemaining === 0;
  if (isCompleted && session.status !== 'completed') {
    violations.push('status must be completed when 0 shells remain');
  }
  if (!isCompleted && session.status === 'completed') {
    violations.push('status cannot be completed when shells remain');
  }

  // Validate shellIntel invariants
  const intelList = session.shellIntel || [];
  const seenPositions = new Set<number>();
  let knownLive = 0;
  let knownBlank = 0;

  for (const intel of intelList) {
    if (!Number.isInteger(intel.positionFromCurrent) || intel.positionFromCurrent < 1) {
      violations.push(`Invalid intel position: ${intel.positionFromCurrent}`);
    }
    if (intel.positionFromCurrent > totalRemaining) {
      violations.push(`Intel position ${intel.positionFromCurrent} exceeds remaining shells (${totalRemaining})`);
    }
    if (seenPositions.has(intel.positionFromCurrent)) {
      violations.push(`Duplicate intel position: ${intel.positionFromCurrent}`);
    }
    seenPositions.add(intel.positionFromCurrent);

    if (intel.shellType === 'live') knownLive += 1;
    else if (intel.shellType === 'blank') knownBlank += 1;
    else violations.push(`Invalid intel shellType: ${intel.shellType}`);
  }

  if (knownLive > session.liveRemaining) {
    violations.push(`Known live shells (${knownLive}) exceed remaining live shells (${session.liveRemaining})`);
  }
  if (knownBlank > session.blankRemaining) {
    violations.push(`Known blank shells (${knownBlank}) exceed remaining blank shells (${session.blankRemaining})`);
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
