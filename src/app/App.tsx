import React, { useState, useEffect } from 'react';
import './app.css';
import botLogo from '../assets/logo.png';
import { useTelegram } from '../hooks/useTelegram';
import { useTrackerSession } from '../hooks/useTrackerSession';
import { ShellType, AddIntelParams } from '../features/tracker/tracker.types';
import { SetupScreen } from '../components/SetupScreen';
import { TrackerScreen } from '../components/TrackerScreen';
import { CompletedScreen } from '../components/CompletedScreen';
import { ConfirmModal } from '../components/ConfirmModal';
import { SyncStatus } from '../components/SyncStatus';
import { recordRemoteAppOpen } from '../services/session.api';
import { AboutPage } from '../features/about/AboutPage';
import { OwnerLayout } from '../features/owner/OwnerLayout';
import { APP_CONFIG } from '../config/app.config';

export const App: React.FC = () => {
  const { user, isTelegram, haptics, setClosingConfirmation } = useTelegram();
  const userId = user ? String(user.id) : 'anonymous';

  const [activePage, setActivePage] = useState<'tracker' | 'about' | 'owner'>('tracker');
  const [isOwner, setIsOwner] = useState(false);

  const {
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
  } = useTrackerSession(userId);

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Record application open and detect owner privileges
  useEffect(() => {
    let mounted = true;
    if (user && String(user.id) === APP_CONFIG.ownerTelegramId) {
      setIsOwner(true);
    }
    recordRemoteAppOpen()
      .then((res) => {
        if (mounted && res.isOwner) {
          setIsOwner(true);
        }
      })
      .catch(() => {
        // ignore in offline/standalone
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  // Enable swipe-away confirmation when an active round is in progress
  useEffect(() => {
    setClosingConfirmation(session?.status === 'active' && activePage === 'tracker');
  }, [session?.status, activePage, setClosingConfirmation]);

  // Trigger haptic when session completes
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

  const handleEject = (shell: ShellType) => {
    haptics.medium();
    eject(shell);
  };

  const handleAddIntel = (params: AddIntelParams) => {
    haptics.medium();
    addIntel(params);
  };

  const handleRemoveIntel = (id: string) => {
    haptics.light();
    removeIntel(id);
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

  const rawDisplayName = user?.first_name || user?.username || '';
  const displayName = rawDisplayName.trim() || 'TELEGRAM';

  // Sub-pages: About Page or Owner Command Center
  if (activePage === 'about') {
    return <AboutPage onClose={() => setActivePage('tracker')} />;
  }

  if (activePage === 'owner' && isOwner) {
    return <OwnerLayout onClose={() => setActivePage('tracker')} />;
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <img src={botLogo} alt="Buckshot Tracker Logo" className="brand-logo" />
          <div className="brand-text">
            <h1 className="brand-title">Buckshot Tracker</h1>
            <span className="brand-subtitle">Shotgun Shell Tracker</span>
          </div>
        </div>

        <div className="header-actions">
          {/* About Button */}
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => setActivePage('about')}
            title="About Buckshot Tracker"
            aria-label="About Buckshot Tracker"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>

          {/* Owner Command Center Gated Button */}
          {isOwner && (
            <button
              type="button"
              className="header-icon-btn header-icon-btn--owner"
              onClick={() => setActivePage('owner')}
              title="Owner Command Center"
              aria-label="Owner Command Center"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </button>
          )}

          <div className="header-status">
            <div className="operator-badge" title={displayName}>
              <span className={`status-dot ${isTelegram ? 'status-dot--active' : ''}`} />
              <span className="operator-name" dir="auto">{displayName}</span>
            </div>
            <SyncStatus syncState={syncState} onRetry={retrySync} />
          </div>
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
            onEject={handleEject}
            onAddIntel={handleAddIntel}
            onRemoveIntel={handleRemoveIntel}
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
