export type SessionStatus = 'active' | 'completed';

export type ShellType = 'live' | 'blank';

export interface ShotEvent {
  id: string;
  type: 'shot';
  shell: ShellType;
  createdAt: number;
}

export interface EjectEvent {
  id: string;
  type: 'eject';
  shell: ShellType | 'unknown';
  createdAt: number;
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

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  pendingOperations: number;
  lastSyncedAt?: number;
  errorMessage?: string;
}
