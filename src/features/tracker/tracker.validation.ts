import { TrackerSession, ShellType } from './tracker.types';

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

  const isCompleted = session.liveRemaining === 0 && session.blankRemaining === 0;
  if (isCompleted && session.status !== 'completed') {
    violations.push('status must be completed when 0 shells remain');
  }
  if (!isCompleted && session.status === 'completed') {
    violations.push('status cannot be completed when shells remain');
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
