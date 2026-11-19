export type SessionStatus = 'active' | 'completed';

export type ShellType = 'live' | 'blank';

export type IntelSource = 'burner_phone';

export interface ShellIntel {
  id: string;
  source: IntelSource;
  positionFromCurrent: number; // 1 = currently chambered shell, 2 = one shell after, etc.
  shellType: ShellType;
  createdAt: number;
}

export interface ShotEvent {
  id: string;
  type: 'shot';
  shell: ShellType;
  createdAt: number;
  previousIntel?: ShellIntel[];
}

export interface EjectEvent {
  id: string;
  type: 'eject';
  shell: ShellType | 'unknown';
  createdAt: number;
  previousIntel?: ShellIntel[];
}

export type SessionEvent = ShotEvent | EjectEvent;

export interface TrackerSession {
  id: string;
  telegramUserId: string;
  initialLive: number;
  initialBlank: number;
  liveRemaining: number;
  blankRemaining: number;
  status: SessionStatus;
  events: SessionEvent[];
  shellIntel: ShellIntel[];
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProbabilityResult {
  livePercentage: number;
  blankPercentage: number;
  totalRemaining: number;
}

export interface CreateSessionParams {
  initialLive: number;
  initialBlank: number;
  telegramUserId?: string;
  operationId?: string;
}

export interface RecordShotParams {
  shell: ShellType;
  operationId?: string;
}

export interface AddIntelParams {
  positionFromCurrent: number;
  shellType: ShellType;
  source?: IntelSource;
  mode?: 'singleplayer' | 'multiplayer';
}

export interface EjectShellParams {
  shell: ShellType | 'unknown';
  operationId?: string;
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  pendingOperations: number;
  lastSyncedAt?: number;
  errorMessage?: string;
}
