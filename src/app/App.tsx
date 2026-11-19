import React, { useState, useEffect } from 'react';
import './app.css';
import { useTelegram } from '../hooks/useTelegram';
import { useTrackerSession } from '../hooks/useTrackerSession';
import { ShellType } from '../features/tracker/tracker.types';
import { SetupScreen } from '../components/SetupScreen';
import { TrackerScreen } from '../components/TrackerScreen';
import { CompletedScreen } from '../components/CompletedScreen';
import { ConfirmModal } from '../components/ConfirmModal';
import { SyncStatus } from '../components/SyncStatus';

export const App: React.FC = () => {
  const { user, isTelegram, haptics } = useTelegram();
  const userId = user ? String(user.id) : 'anonymous';

  const {
    session,
    syncState,
    startLoad,
    shoot,
    undo,
    reset,
    retrySync,
  } = useTrackerSession(userId);

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Trigger haptic when status transitions to completed
  useEffect(() => {
    if (session?.status === 'completed') {
      haptics.success();
    }
  }, [session?.status, haptics]);

  const handleStartLoad = (live: number, blank: number) => {
    haptics.medium();
    startLoad(live, blank);
  };

  const handleShot = (shell: ShellType) => {
    if (shell === 'live') {
      haptics.heavy();
    } else {
      haptics.medium();
    }
    shoot(shell);
  };

  const handleUndo = () => {
    haptics.light();
    undo();
  };

  const handleRequestNewLoad = () => {
    if (session && session.status === 'active' && (session.liveRemaining > 0 || session.blankRemaining > 0)) {
      setShowConfirmReset(true);
    } else {
      reset();
    }
  };

  const handleConfirmReset = () => {
    setShowConfirmReset(false);
    haptics.warning();
    reset();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <div>
            <h1 className="brand-title">Buckshot Counter</h1>
            <span className="brand-subtitle">Shotgun Shell Tracker</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-surface)',
                color: isTelegram ? 'var(--color-success)' : 'var(--color-text-dim)',
                border: '1px solid var(--color-border)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {user?.first_name ? user.first_name.toUpperCase() : 'TELEGRAM'}
            </span>
          </div>
          <SyncStatus syncState={syncState} onRetry={retrySync} />
        </div>
      </header>

      {/* Main Screens */}
      <main className="app-main">
        {!session && (
          <SetupScreen onStartLoad={handleStartLoad} />
        )}

        {session && session.status === 'active' && (
          <TrackerScreen
            session={session}
            onShot={handleShot}
            onUndo={handleUndo}
            onNewLoad={handleRequestNewLoad}
          />
        )}

        {session && session.status === 'completed' && (
          <CompletedScreen
            session={session}
            onNewLoad={handleRequestNewLoad}
            onUndo={handleUndo}
          />
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmReset}
        title="Discard Current Load?"
        message="A shotgun load is currently in progress. Starting a new load will discard the active session."
        confirmLabel="DISCARD & RESET"
        cancelLabel="KEEP PLAYING"
        isDestructive={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowConfirmReset(false)}
      />
    </div>
  );
};
