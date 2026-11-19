import { TrackerSession, ShellType, IntelSource } from '../features/tracker/tracker.types';

const SESSION_STORAGE_KEY = 'buckshot_tracker_session_v1';
const PENDING_OPS_KEY = 'buckshot_tracker_pending_ops_v1';

export interface PendingOperation {
  id: string;
  type: 'create' | 'shot' | 'undo' | 'abandon' | 'intel_add' | 'intel_remove' | 'eject';
  sessionId?: string;
  shell?: ShellType | 'unknown';
  intelId?: string;
  intelPosition?: number;
  intelShellType?: ShellType;
  intelSource?: IntelSource;
  initialLive?: number;
  initialBlank?: number;
  expectedVersion?: number;
  timestamp: number;
}

export function saveLocalSession(session: TrackerSession | null): void {
  try {
    if (session === null) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // local storage quota or private browsing restriction
  }
}

export function loadLocalSession(): TrackerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrackerSession;
    if (parsed) {
      parsed.shellIntel = Array.isArray(parsed.shellIntel) ? parsed.shellIntel : [];
      parsed.events = Array.isArray(parsed.events) ? parsed.events : [];
    }
    return parsed;
  } catch {
    return null;
  }
}

export function savePendingOperations(ops: PendingOperation[]): void {
  try {
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(ops));
  } catch {
    // ignore
  }
}

export function loadPendingOperations(): PendingOperation[] {
  try {
    const raw = localStorage.getItem(PENDING_OPS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingOperation[];
  } catch {
    return [];
  }
}

export function appendPendingOperation(op: PendingOperation): void {
  const existing = loadPendingOperations();
  existing.push(op);
  savePendingOperations(existing);
}

export function clearPendingOperations(): void {
  try {
    localStorage.removeItem(PENDING_OPS_KEY);
  } catch {
    // ignore
  }
}
