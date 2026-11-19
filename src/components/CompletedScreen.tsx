import React from 'react';
import { TrackerSession } from '../features/tracker/tracker.types';
import { UndoButton } from './UndoButton';
import { canUndo } from '../features/tracker/tracker.validation';

interface CompletedScreenProps {
  session: TrackerSession;
  onNewLoad: () => void;
  onUndo: () => void;
}

export const CompletedScreen: React.FC<CompletedScreenProps> = ({
  session,
  onNewLoad,
  onUndo,
}) => {
  const undoAllowed = canUndo(session);
  const totalFired = session.events.length;
  const liveFired = session.events.filter((e) => 'shell' in e && e.shell === 'live').length;
  const blankFired = session.events.filter((e) => 'shell' in e && e.shell === 'blank').length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        width: '100%',
        textAlign: 'center',
      }}
    >
      {/* Status Badge */}
      <div className="inst-telemetry-badge" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <span className="inst-led inst-led--warning" />
        <span style={{ color: 'var(--primitive-amber-500)' }}>CYCLE COMPLETED</span>
      </div>

      <div>
        <h2 className="inst-title">CHAMBER EXHAUSTED</h2>
        <p className="inst-subtitle" style={{ marginTop: 'var(--space-1)' }}>
          All chamber rounds have been recorded and expended
        </p>
      </div>

      {/* Summary Debrief Box */}
      <div
        className="inst-panel inst-panel--recessed"
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--space-2)',
          padding: 'var(--space-4)',
        }}
      >
        <div>
          <span
            className="inst-label"
            style={{ color: 'var(--primitive-crimson-400)', display: 'block' }}
          >
            LIVE FIRED
          </span>
          <span
            className="inst-readout"
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--primitive-crimson-300)',
            }}
          >
            {liveFired}
          </span>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
          <span
            className="inst-label"
            style={{ color: 'var(--primitive-cobalt-400)', display: 'block' }}
          >
            BLANK FIRED
          </span>
          <span
            className="inst-readout"
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--primitive-cobalt-300)',
            }}
          >
            {blankFired}
          </span>
        </div>

        <div>
          <span
            className="inst-label"
            style={{ color: 'var(--text-muted)', display: 'block' }}
          >
            TOTAL FIRED
          </span>
          <span
            className="inst-readout"
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {totalFired}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
        <button
          type="button"
          onClick={onNewLoad}
          className="inst-button inst-button--primary"
          style={{
            width: '100%',
            minHeight: '52px',
            fontSize: 'var(--text-md)',
            letterSpacing: '0.08em',
          }}
        >
          INITIALIZE NEW LOAD
        </button>

        {undoAllowed && (
          <UndoButton
            onUndo={onUndo}
            disabled={!undoAllowed}
            eventCount={session.events.length}
          />
        )}
      </div>
    </div>
  );
};
