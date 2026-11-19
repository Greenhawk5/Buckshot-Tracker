import { describe, it, expect, beforeEach } from 'vitest';

if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  } as Storage;
}

import {
  saveLocalSession,
  loadLocalSession,
  appendPendingOperation,
  loadPendingOperations,
  clearPendingOperations,
} from '../src/services/local.persistence';
import { TrackerSession } from '../src/features/tracker/tracker.types';

describe('Local Persistence & Offline Recovery Tests — Phase 5', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly persists and restores TrackerSession from localStorage', () => {
    const mockSession: TrackerSession = {
      id: 'sess_101',
      telegramUserId: 'user_42',
      initialLive: 3,
      initialBlank: 3,
      liveRemaining: 2,
      blankRemaining: 3,
      status: 'active',
      events: [{ id: 'shot_1', type: 'shot', shell: 'live', createdAt: Date.now() }],
      version: 2,
      createdAt: 1000,
      updatedAt: 1050,
    };

    saveLocalSession(mockSession);
    const restored = loadLocalSession();

    expect(restored).not.toBeNull();
    expect(restored?.id).toBe('sess_101');
    expect(restored?.liveRemaining).toBe(2);
    expect(restored?.events).toHaveLength(1);
    expect(restored?.version).toBe(2);
  });

  it('removes local session when saveLocalSession is called with null', () => {
    const mockSession: TrackerSession = {
      id: 'sess_102',
      telegramUserId: 'user_42',
      initialLive: 1,
      initialBlank: 1,
      liveRemaining: 1,
      blankRemaining: 1,
      status: 'active',
      events: [],
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
    };

    saveLocalSession(mockSession);
    expect(loadLocalSession()).not.toBeNull();

    saveLocalSession(null);
    expect(loadLocalSession()).toBeNull();
  });

  it('manages pending operations queue for offline actions', () => {
    expect(loadPendingOperations()).toEqual([]);

    appendPendingOperation({
      id: 'op_1',
      type: 'shot',
      sessionId: 'sess_1',
      shell: 'live',
      expectedVersion: 1,
      timestamp: 1000,
    });

    appendPendingOperation({
      id: 'op_2',
      type: 'shot',
      sessionId: 'sess_1',
      shell: 'blank',
      expectedVersion: 2,
      timestamp: 2000,
    });

    const pending = loadPendingOperations();
    expect(pending).toHaveLength(2);
    expect(pending[0].shell).toBe('live');
    expect(pending[1].shell).toBe('blank');

    clearPendingOperations();
    expect(loadPendingOperations()).toHaveLength(0);
  });
});
