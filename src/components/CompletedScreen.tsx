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
        gap: '20px',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          color: 'var(--color-text-muted)',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}
      >
        🔒
      </div>

      <div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
            marginBottom: '4px',
          }}
        >
          CHAMBER EMPTY
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          All shells in this load have been recorded.
        </p>
      </div>

      {/* Summary Box */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 24px',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-around',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-live)', display: 'block', fontWeight: 600 }}>
            LIVE FIRED
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
            {liveFired}
          </span>
        </div>

        <div style={{ width: '1px', background: 'var(--color-border)' }} />

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-blank)', display: 'block', fontWeight: 600 }}>
            BLANK FIRED
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
            {blankFired}
          </span>
        </div>

        <div style={{ width: '1px', background: 'var(--color-border)' }} />

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600 }}>
            TOTAL
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
            {totalFired}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        <button
          type="button"
          onClick={onNewLoad}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-live) 0%, #a81c25 100%)',
            border: '1px solid var(--color-live)',
            color: '#ffffff',
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 4px 16px var(--color-live-glow)',
          }}
        >
          START NEW LOAD
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
