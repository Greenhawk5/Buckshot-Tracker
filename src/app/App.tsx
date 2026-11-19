import React, { useState, useReducer, useEffect } from 'react';
import './app.css';
import { useTelegram } from '../hooks/useTelegram';
import { trackerReducer, initialTrackerState } from '../features/tracker/tracker.reducer';
import { ShellType } from '../features/tracker/tracker.types';
import { SetupScreen } from '../components/SetupScreen';
import { TrackerScreen } from '../components/TrackerScreen';
import { CompletedScreen } from '../components/CompletedScreen';
import { ConfirmModal } from '../components/ConfirmModal';

export const App: React.FC = () => {
  const { user, isTelegram, haptics } = useTelegram();
  const [state, dispatch] = useReducer(trackerReducer, initialTrackerState);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Trigger haptic when status transitions to completed
  useEffect(() => {
    if (state.session?.status === 'completed') {
      haptics.success();
    }
  }, [state.session?.status, haptics]);

  const handleStartLoad = (live: number, blank: number) => {
    haptics.medium();
    dispatch({
      type: 'CREATE_SESSION',
      payload: {
        initialLive: live,
        initialBlank: blank,
        telegramUserId: user ? String(user.id) : 'anonymous',
      },
    });
  };

  const handleShot = (shell: ShellType) => {
    if (shell === 'live') {
      haptics.heavy();
    } else {
      haptics.medium();
    }
    dispatch({
      type: 'RECORD_SHOT',
      payload: { shell },
    });
  };

  const handleUndo = () => {
    haptics.light();
    dispatch({ type: 'UNDO_ACTION' });
  };

  const handleRequestNewLoad = () => {
    if (state.session && state.session.status === 'active' && (state.session.liveRemaining > 0 || state.session.blankRemaining > 0)) {
      setShowConfirmReset(true);
    } else {
      dispatch({ type: 'RESET_SESSION' });
    }
  };

  const handleConfirmReset = () => {
    setShowConfirmReset(false);
    haptics.warning();
    dispatch({ type: 'RESET_SESSION' });
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
      </header>

      {/* Main Screens */}
      <main className="app-main">
        {!state.session && (
          <SetupScreen onStartLoad={handleStartLoad} />
        )}

        {state.session && state.session.status === 'active' && (
          <TrackerScreen
            session={state.session}
            onShot={handleShot}
            onUndo={handleUndo}
            onNewLoad={handleRequestNewLoad}
          />
        )}

        {state.session && state.session.status === 'completed' && (
          <CompletedScreen
            session={state.session}
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
