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

  // Recent shots preview (last 5 events)
  const recentEvents = [...session.events].slice(-6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Top Session Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--color-success)',
              letterSpacing: '0.05em',
            }}
          >
            ● ACTIVE LOAD
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
            }}
          >
            REV {session.version}
          </span>
        </div>

        {/* History preview badges */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {recentEvents.length === 0 ? (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              No shots yet
            </span>
          ) : (
            recentEvents.map((ev, idx) => (
              <span
                key={ev.id || idx}
                title={`${ev.type}: ${'shell' in ev ? ev.shell : 'unknown'}`}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'shell' in ev && ev.shell === 'live' ? 'var(--color-live)' : 'var(--color-blank)',
                  boxShadow: 'shell' in ev && ev.shell === 'live' ? '0 0 6px var(--color-live-glow)' : '0 0 6px var(--color-blank-glow)',
                  display: 'inline-block',
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Chamber Visual Bar */}
      <AmmoIndicator
        liveRemaining={session.liveRemaining}
        blankRemaining={session.blankRemaining}
        initialLive={session.initialLive}
        initialBlank={session.initialBlank}
      />

      {/* Shot Buttons — Main Gameplay Interaction */}
      <div style={{ display: 'flex', gap: '12px' }}>
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

      {/* Composition Odds */}
      <ProbabilityDisplay probability={probability} />

      {/* Bottom Actions: Undo and New Load */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <UndoButton
          onUndo={onUndo}
          disabled={!undoAllowed}
          eventCount={session.events.length}
        />

        <button
          type="button"
          onClick={onNewLoad}
          style={{
            padding: '12px 18px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-dim)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          RESET / NEW LOAD
        </button>
      </div>
    </div>
  );
};
