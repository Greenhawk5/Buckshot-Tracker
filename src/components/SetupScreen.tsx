import React, { useState } from 'react';
import { ShellCounter } from './ShellCounter';
import { validateInitialCounts } from '../features/tracker/tracker.validation';

interface SetupScreenProps {
  onStartLoad: (live: number, blank: number) => void;
  hasActiveSession?: boolean;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartLoad }) => {
  const [liveCount, setLiveCount] = useState<number>(2);
  const [blankCount, setBlankCount] = useState<number>(2);

  const total = liveCount + blankCount;
  const validation = validateInitialCounts(liveCount, blankCount);

  const handleStart = () => {
    if (validation.valid) {
      onStartLoad(liveCount, blankCount);
    }
  };

  // Quick preset buttons for common Buckshot Roulette loads
  const setPreset = (live: number, blank: number) => {
    setLiveCount(live);
    setBlankCount(blank);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.35rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
            marginBottom: '4px',
          }}
        >
          LOAD THE SHOTGUN
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          Specify the shell count announced by the Dealer.
        </p>
      </div>

      {/* Preset Quick Select */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
        }}
      >
        {[
          { label: '1L • 1B', live: 1, blank: 1 },
          { label: '2L • 2B', live: 2, blank: 2 },
          { label: '3L • 2B', live: 3, blank: 2 },
          { label: '3L • 3B', live: 3, blank: 3 },
          { label: '4L • 4B', live: 4, blank: 4 },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPreset(p.live, p.blank)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: liveCount === p.live && blankCount === p.blank ? 'var(--color-surface-hover)' : 'var(--color-surface)',
              border: `1px solid ${liveCount === p.live && blankCount === p.blank ? 'var(--color-border-highlight)' : 'var(--color-border)'}`,
              color: 'var(--color-text-dim)',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Shell Counters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <ShellCounter
          type="live"
          label="Live Rounds"
          count={liveCount}
          onChange={setLiveCount}
        />
        <ShellCounter
          type="blank"
          label="Blank Rounds"
          count={blankCount}
          onChange={setBlankCount}
        />
      </div>

      {/* Total & Action */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}>
            TOTAL ROUNDS IN CHAMBER
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--color-text)',
            }}
          >
            {total}
          </span>
        </div>

        {!validation.valid && (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.78rem', textAlign: 'center' }}>
            {validation.error}
          </div>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={!validation.valid}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: validation.valid ? 'linear-gradient(135deg, var(--color-live) 0%, #a81c25 100%)' : 'var(--color-surface-raised)',
            border: validation.valid ? '1px solid var(--color-live)' : '1px solid var(--color-border)',
            color: validation.valid ? '#ffffff' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: validation.valid ? 'pointer' : 'not-allowed',
            boxShadow: validation.valid ? '0 4px 16px var(--color-live-glow)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          START TRACKING
        </button>
      </div>
    </div>
  );
};
