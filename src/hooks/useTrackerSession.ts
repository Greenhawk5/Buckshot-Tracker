import { useState, useEffect, useCallback, useRef } from 'react';
import { TrackerSession, ShellType, AddIntelParams, SyncState } from '../features/tracker/tracker.types';
import {
  createNewSession,
  recordShot,
  ejectShell,
  addShellIntel,
  removeShellIntel,
  undoLastAction,
  generateOperationId,
} from '../features/tracker/tracker.logic';
import {
  saveLocalSession,
  loadLocalSession,
  loadPendingOperations,
  savePendingOperations,
  appendPendingOperation,
  clearPendingOperations,
  PendingOperation,
} from '../services/local.persistence';
import {
  fetchActiveSession,
  createRemoteSession,
  recordRemoteShot,
  ejectRemoteShell,
  addRemoteShellIntel,
  removeRemoteShellIntel,
  undoRemoteAction,
  abandonRemoteSession,
} from '../services/session.api';
import { ServerlessError } from '../services/serverless.client';

export function useTrackerSession(telegramUserId: string = 'anonymous') {
  // Initialize with local cache for instant render
  const [session, setSession] = useState<TrackerSession | null>(() => loadLocalSession());
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    pendingOperations: loadPendingOperations().length,
  });

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const isSyncingRef = useRef(false);

  // Helper to persist local session
  const updateSessionLocally = useCallback((newSession: TrackerSession | null) => {
    setSession(newSession);
    saveLocalSession(newSession);
  }, []);

  // Flush pending operations in queue
  const flushPendingQueue = useCallback(async (currentSession: TrackerSession | null) => {
    if (isSyncingRef.current) return;
    const queue = loadPendingOperations();
    if (queue.length === 0) {
      setSyncState((s) => ({ ...s, status: 'synced', pendingOperations: 0 }));
      return;
    }

    isSyncingRef.current = true;
    setSyncState((s) => ({ ...s, status: 'syncing', pendingOperations: queue.length }));

    let activeSession = currentSession;
    const remainingQueue: PendingOperation[] = [];

    for (let i = 0; i < queue.length; i++) {
      const op = queue[i];
      try {
        if (op.type === 'create' && op.initialLive !== undefined && op.initialBlank !== undefined) {
          activeSession = await createRemoteSession(op.initialLive, op.initialBlank, op.id);
          updateSessionLocally(activeSession);
        } else if (op.type === 'shot' && op.shell && activeSession && op.shell !== 'unknown') {
          activeSession = await recordRemoteShot(activeSession.id, op.shell as ShellType, op.expectedVersion ?? activeSession.version, op.id);
          updateSessionLocally(activeSession);
        } else if (op.type === 'eject' && op.shell && activeSession) {
          activeSession = await ejectRemoteShell(activeSession.id, op.shell, op.expectedVersion ?? activeSession.version, op.id);
          updateSessionLocally(activeSession);
        } else if (op.type === 'intel_add' && activeSession && op.intelPosition && op.intelShellType) {
          activeSession = await addRemoteShellIntel(
            activeSession.id,
            {
              positionFromCurrent: op.intelPosition,
              shellType: op.intelShellType,
              source: op.intelSource || 'burner_phone',
            },
            op.expectedVersion ?? activeSession.version,
            op.id
          );
          updateSessionLocally(activeSession);
        } else if (op.type === 'intel_remove' && activeSession && op.intelId) {
          activeSession = await removeRemoteShellIntel(
            activeSession.id,
            op.intelId,
            op.expectedVersion ?? activeSession.version,
            op.id
          );
          updateSessionLocally(activeSession);
        } else if (op.type === 'undo' && activeSession) {
          activeSession = await undoRemoteAction(activeSession.id, op.expectedVersion ?? activeSession.version, op.id);
          updateSessionLocally(activeSession);
        } else if (op.type === 'abandon' && op.sessionId) {
          await abandonRemoteSession(op.sessionId, op.expectedVersion ?? 1);
          updateSessionLocally(null);
          activeSession = null;
        }
      } catch (err) {
        // If version conflict, adopt the latest server state returned in error
        if (err instanceof ServerlessError && err.code === 'VERSION_CONFLICT' && err.parameters?.latestSession) {
          activeSession = err.parameters.latestSession as TrackerSession;
          updateSessionLocally(activeSession);
        } else {
          // Keep un-synced operations in queue
          remainingQueue.push(...queue.slice(i));
          break;
        }
      }
    }

    savePendingOperations(remainingQueue);
    isSyncingRef.current = false;

    if (remainingQueue.length === 0) {
      setSyncState({
        status: 'synced',
        pendingOperations: 0,
        lastSyncedAt: Date.now(),
      });
    } else {
      setSyncState({
        status: 'offline',
        pendingOperations: remainingQueue.length,
      });
    }
  }, [updateSessionLocally]);

  // Initial load: synchronize with server
  useEffect(() => {
    let cancelled = false;

    async function initSync() {
      setSyncState((s) => ({ ...s, status: 'syncing' }));
      try {
        const remoteSession = await fetchActiveSession();
        if (cancelled) return;

        const local = loadLocalSession();
        const pending = loadPendingOperations();

        if (pending.length > 0) {
          // If we have pending local operations, flush them
          await flushPendingQueue(local);
        } else if (remoteSession) {
          // If server has active session and no pending local changes, adopt server state
          updateSessionLocally(remoteSession);
          setSyncState({ status: 'synced', pendingOperations: 0, lastSyncedAt: Date.now() });
        } else if (local && local.status === 'completed') {
          // Keep completed local session until user starts new load
          setSyncState({ status: 'synced', pendingOperations: 0 });
        } else {
          // No active session on server or locally
          updateSessionLocally(null);
          setSyncState({ status: 'synced', pendingOperations: 0 });
        }
      } catch {
        if (!cancelled) {
          setSyncState((s) => ({
            ...s,
            status: 'offline',
            errorMessage: 'Running in offline cache mode',
          }));
        }
      }
    }

    initSync();
    return () => {
      cancelled = true;
    };
  }, [flushPendingQueue, updateSessionLocally]);

  // User Actions
  const startLoad = useCallback(async (live: number, blank: number) => {
    const opId = generateOperationId();
    const newSession = createNewSession({
      initialLive: live,
      initialBlank: blank,
      telegramUserId,
      operationId: opId,
    });

    updateSessionLocally(newSession);

    // Sync with remote
    setSyncState((s) => ({ ...s, status: 'syncing' }));
    try {
      const remote = await createRemoteSession(live, blank, opId);
      updateSessionLocally(remote);
      setSyncState({ status: 'synced', pendingOperations: 0, lastSyncedAt: Date.now() });
    } catch {
      appendPendingOperation({
        id: opId,
        type: 'create',
        initialLive: live,
        initialBlank: blank,
        timestamp: Date.now(),
      });
      setSyncState((s) => ({ ...s, status: 'offline', pendingOperations: s.pendingOperations + 1 }));
    }
  }, [telegramUserId, updateSessionLocally]);

  const shoot = useCallback(async (shell: ShellType) => {
    const current = sessionRef.current;
    if (!current) return;

    const opId = generateOperationId();
    const expectedVer = current.version;
    const updated = recordShot(current, shell, opId);

    updateSessionLocally(updated);

    // Sync with remote
    setSyncState((s) => ({ ...s, status: 'syncing' }));
    try {
      const remote = await recordRemoteShot(current.id, shell, expectedVer, opId);
      updateSessionLocally(remote);
      setSyncState({ status: 'synced', pendingOperations: 0, lastSyncedAt: Date.now() });
    } catch (err) {
      if (err instanceof ServerlessError && err.code === 'VERSION_CONFLICT' && err.parameters?.latestSession) {
        updateSessionLocally(err.parameters.latestSession as TrackerSession);
        setSyncState({ status: 'synced', pendingOperations: 0 });
      } else {
        appendPendingOperation({
          id: opId,
          type: 'shot',
          sessionId: current.id,
          shell,
          expectedVersion: expectedVer,
          timestamp: Date.now(),
        });
        setSyncState((s) => ({ ...s, status: 'offline', pendingOperations: s.pendingOperations + 1 }));
      }
    }
  }, [updateSessionLocally]);

  const eject = useCallback(async (shell: ShellType | 'unknown') => {
    const current = sessionRef.current;
    if (!current) return;

    const opId = generateOperationId();
    const expectedVer = current.version;
    const updated = ejectShell(current, shell, opId);

    updateSessionLocally(updated);

    // Sync with remote
    setSyncState((s) => ({ ...s, status: 'syncing' }));
    try {
      const remote = await ejectRemoteShell(current.id, shell, expectedVer, opId);
      updateSessionLocally(remote);
      setSyncState({ status: 'synced', pendingOperations: 0, lastSyncedAt: Date.now() });
    } catch (err) {
      if (err instanceof ServerlessError && err.code === 'VERSION_CONFLICT' && err.parameters?.latestSession) {
        updateSessionLocally(err.parameters.latestSession as TrackerSession);
        setSyncState({ status: 'synced', pendingOperations: 0 });
      } else {
        appendPendingOperation({
          id: opId,
          type: 'eject',
          sessionId: current.id,
          shell,
          expectedVersion: expectedVer,
          timestamp: Date.now(),
        });
        setSyncState((s) => ({ ...s, status: 'offline', pendingOperations: s.pendingOperations + 1 }));
      }
    }
  }, [updateSessionLocally]);

  const addIntel = useCallback(async (params: AddIntelParams) => {
    const current = sessionRef.current;
    if (!current) return;

    const opId = generateOperationId();
    const expectedVer = current.version;
    const updated = addShellIntel(current, params, opId);

    updateSessionLocally(updated);

    // Sync with remote
    setSyncState((s) => ({ ...s, status: 'syncing' }));
    try {
      const remote = await addRemoteShellIntel(current.id, params, expectedVer, opId);
      updateSessionLocally(remote);
      setSyncState({ status: 'synced', pendingOperations: 0, lastSyncedAt: Date.now() });
    } catch (err) {
      if (err instanceof ServerlessError && err.code === 'VERSION_CONFLICT' && err.parameters?.latestSession) {
        updateSessionLocally(err.parameters.latestSession as TrackerSession);
        setSyncState({ status: 'synced', pendingOperations: 0 });
      } else {
        appendPendingOperation({
          id: opId,
          type: 'intel_add',
          sessionId: current.id,
          intelPosition: params.positionFromCurrent,
          intelShellType: params.shellType,
          intelSource: params.source || 'burner_phone',
          expectedVersion: expectedVer,
          timestamp: Date.now(),
        });
        setSyncState((s) => ({ ...s, status: 'offline', pendingOperations: s.pendingOperations + 1 }));
      }
    }
  }, [updateSessionLocally]);

  const removeIntel = useCallback(async (intelId: string) => {
    const current = sessionRef.current;
    if (!current) return;

    const opId = generateOperationId();
    const expectedVer = current.version;
    const updated = removeShellIntel(current, intelId);

    updateSessionLocally(updated);

    // Sync with remote
    setSyncState((s) => ({ ...s, status: 'syncing' }));
    try {
      const remote = await removeRemoteShellIntel(current.id, intelId, expectedVer, opId);
      updateSessionLocally(remote);
      setSyncState({ status: 'synced', pendingOperations: 0, lastSyncedAt: Date.now() });
    } catch (err) {
      if (err instanceof ServerlessError && err.code === 'VERSION_CONFLICT' && err.parameters?.latestSession) {
        updateSessionLocally(err.parameters.latestSession as TrackerSession);
        setSyncState({ status: 'synced', pendingOperations: 0 });
      } else {
        appendPendingOperation({
          id: opId,
          type: 'intel_remove',
          sessionId: current.id,
          intelId,
          expectedVersion: expectedVer,
          timestamp: Date.now(),
        });
        setSyncState((s) => ({ ...s, status: 'offline', pendingOperations: s.pendingOperations + 1 }));
      }
    }
  }, [updateSessionLocally]);

  const undo = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;

    const opId = generateOperationId();
    const expectedVer = current.version;
    const updated = undoLastAction(current);

    updateSessionLocally(updated);

    // Sync with remote
    setSyncState((s) => ({ ...s, status: 'syncing' }));
    try {
      const remote = await undoRemoteAction(current.id, expectedVer, opId);
      updateSessionLocally(remote);
      setSyncState({ status: 'synced', pendingOperations: 0, lastSyncedAt: Date.now() });
    } catch (err) {
      if (err instanceof ServerlessError && err.code === 'VERSION_CONFLICT' && err.parameters?.latestSession) {
        updateSessionLocally(err.parameters.latestSession as TrackerSession);
        setSyncState({ status: 'synced', pendingOperations: 0 });
      } else {
        appendPendingOperation({
          id: opId,
          type: 'undo',
          sessionId: current.id,
          expectedVersion: expectedVer,
          timestamp: Date.now(),
        });
        setSyncState((s) => ({ ...s, status: 'offline', pendingOperations: s.pendingOperations + 1 }));
      }
    }
  }, [updateSessionLocally]);

  const reset = useCallback(async () => {
    const current = sessionRef.current;
    updateSessionLocally(null);
    clearPendingOperations();

    if (current && current.status === 'active') {
      try {
        await abandonRemoteSession(current.id, current.version);
        setSyncState({ status: 'synced', pendingOperations: 0 });
      } catch {
        // best effort
      }
    }
  }, [updateSessionLocally]);

  const retrySync = useCallback(() => {
    flushPendingQueue(sessionRef.current);
  }, [flushPendingQueue]);

  return {
    session,
    syncState,
    startLoad,
    shoot,
    eject,
    addIntel,
    removeIntel,
    undo,
    reset,
    retrySync,
  };
}
