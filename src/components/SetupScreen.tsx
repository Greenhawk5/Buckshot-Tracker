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

  const setPreset = (live: number, blank: number) => {
    setLiveCount(live);
    setBlankCount(blank);
  };

  const presets = [
    { label: '1L • 1B', live: 1, blank: 1 },
    { label: '2L • 2B', live: 2, blank: 2 },
    { label: '3L • 2B', live: 3, blank: 2 },
    { label: '3L • 3B', live: 3, blank: 3 },
    { label: '4L • 4B', live: 4, blank: 4 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
            marginBottom: '6px',
          }}
        >
          LOAD THE SHOTGUN
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Specify the shell count announced for this load.
        </p>
      </div>

      {/* Preset Quick Select */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          width: '100%',
        }}
      >
        {presets.map((p) => {
          const isActive = liveCount === p.live && blankCount === p.blank;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => setPreset(p.live, p.blank)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                border: `1px solid ${isActive ? 'var(--color-border-highlight)' : 'var(--color-border)'}`,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-dim)',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: isActive ? 700 : 500,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 0 10px rgba(255, 255, 255, 0.08)' : 'none',
              }}
            >
              {p.label}
            </button>
          );
        })}
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

      {/* Total & Action Card */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.88rem',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            TOTAL ROUNDS IN CHAMBER
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text)',
            }}
          >
            {total}
          </span>
        </div>

        {!validation.valid && (
          <div
            style={{
              color: 'var(--color-danger)',
              fontSize: '0.8rem',
              textAlign: 'center',
              background: 'var(--color-danger-soft)',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
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
            background: validation.valid
              ? 'linear-gradient(135deg, var(--color-live) 0%, #a81c25 100%)'
              : 'var(--color-surface-raised)',
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
