import React from 'react';
import { TrackerSession, ShellType } from '../features/tracker/tracker.types';
import { ShotButton } from './ShotButton';
import { AmmoIndicator } from './AmmoIndicator';
import { ProbabilityDisplay } from './ProbabilityDisplay';
import { UndoButton } from './UndoButton';
import { calculateProbability } from '../features/tracker/tracker.logic';
import { canUndo } from '../features/tracker/tracker.validation';

interface TrackerScreenProps {
  session: TrackerSession;
  onShot: (shell: ShellType) => void;
  onUndo: () => void;
  onNewLoad: () => void;
}

export const TrackerScreen: React.FC<TrackerScreenProps> = ({
  session,
  onShot,
  onUndo,
  onNewLoad,
}) => {
  const probability = calculateProbability(session);
  const undoAllowed = canUndo(session);

  // Recent shots preview (last 6 events)
  const recentEvents = [...session.events].slice(-6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
      {/* Tactical Session Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div className="inst-telemetry-badge" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <span className="inst-led inst-led--active" />
            <span style={{ color: 'var(--primitive-emerald-500)' }}>CHAMBER ARMED</span>
          </div>
          <span className="inst-label">
            REV {session.version}
          </span>
        </div>

        {/* Discharge history sequence preview */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {recentEvents.length === 0 ? (
            <span className="inst-label" style={{ opacity: 0.5 }}>
              STANDBY
            </span>
          ) : (
            recentEvents.map((ev, idx) => {
              const isLive = 'shell' in ev && ev.shell === 'live';
              return (
                <span
                  key={ev.id || idx}
                  title={`${ev.type}: ${'shell' in ev ? ev.shell : 'unknown'}`}
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: isLive ? 'var(--primitive-crimson-500)' : 'var(--primitive-cobalt-400)',
                    boxShadow: isLive ? '0 0 6px rgba(230, 57, 70, 0.6)' : '0 0 6px rgba(56, 189, 248, 0.6)',
                    display: 'inline-block',
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Recessed Chamber Inventory Bay */}
      <AmmoIndicator
        liveRemaining={session.liveRemaining}
        blankRemaining={session.blankRemaining}
        initialLive={session.initialLive}
        initialBlank={session.initialBlank}
      />

      {/* Primary Tactical Shot Triggers */}
      <div className="inst-trigger-grid">
        <ShotButton
          shell="live"
          remaining={session.liveRemaining}
          onShot={onShot}
        />
        <ShotButton
          shell="blank"
          remaining={session.blankRemaining}
          onShot={onShot}
        />
      </div>

      {/* Composition & Odds Telemetry */}
      <ProbabilityDisplay probability={probability} />

      {/* Auxiliary Controls */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
        <UndoButton
          onUndo={onUndo}
          disabled={!undoAllowed}
          eventCount={session.events.length}
        />

        <button
          type="button"
          onClick={onNewLoad}
          className="inst-button"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            minHeight: '44px',
            color: 'var(--text-secondary)',
          }}
        >
          RELOAD / RESET
        </button>
      </div>
    </div>
  );
};
