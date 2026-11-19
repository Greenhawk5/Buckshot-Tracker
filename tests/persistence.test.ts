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

  it('correctly persists and restores ShellIntel records in TrackerSession', () => {
    const mockSession: TrackerSession = {
      id: 'sess_103',
      telegramUserId: 'user_42',
      initialLive: 4,
      initialBlank: 4,
      liveRemaining: 3,
      blankRemaining: 4,
      status: 'active',
      events: [{ id: 'shot_1', type: 'shot', shell: 'live', createdAt: Date.now() }],
      shellIntel: [
        { id: 'intel_1', source: 'burner_phone', positionFromCurrent: 2, shellType: 'blank', createdAt: 1000 },
        { id: 'intel_2', source: 'burner_phone', positionFromCurrent: 4, shellType: 'live', createdAt: 1001 },
      ],
      version: 3,
      createdAt: 1000,
      updatedAt: 1060,
    };

    saveLocalSession(mockSession);
    const restored = loadLocalSession();

    expect(restored).not.toBeNull();
    expect(restored?.shellIntel).toHaveLength(2);
    expect(restored?.shellIntel[0].positionFromCurrent).toBe(2);
    expect(restored?.shellIntel[0].shellType).toBe('blank');
    expect(restored?.shellIntel[1].positionFromCurrent).toBe(4);
    expect(restored?.shellIntel[1].shellType).toBe('live');
  });

  it('manages pending intel_add, intel_remove, and eject operations', () => {
    appendPendingOperation({
      id: 'op_intel_1',
      type: 'intel_add',
      sessionId: 'sess_1',
      intelPosition: 3,
      intelShellType: 'live',
      intelSource: 'burner_phone',
      expectedVersion: 1,
      timestamp: 1000,
    });

    appendPendingOperation({
      id: 'op_eject_1',
      type: 'eject',
      sessionId: 'sess_1',
      shell: 'blank',
      expectedVersion: 2,
      timestamp: 2000,
    });

    const pending = loadPendingOperations();
    expect(pending).toHaveLength(2);
    expect(pending[0].type).toBe('intel_add');
    expect(pending[0].intelPosition).toBe(3);
    expect(pending[1].type).toBe('eject');
    expect(pending[1].shell).toBe('blank');
  });
});
