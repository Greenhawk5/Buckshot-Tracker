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
    { label: '1:1', live: 1, blank: 1 },
    { label: '2:2', live: 2, blank: 2 },
    { label: '3:2', live: 3, blank: 2 },
    { label: '3:3', live: 3, blank: 3 },
    { label: '4:4', live: 4, blank: 4 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* Screen Title & Instructions */}
      <div style={{ textAlign: 'center' }}>
        <h2 className="inst-title">INITIALIZE CHAMBER</h2>
        <p className="inst-subtitle" style={{ marginTop: 'var(--space-1)' }}>
          Configure initial live and blank ammunition composition
        </p>
      </div>

      {/* Segmented Quick Preset Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <span className="inst-label" style={{ textAlign: 'center', opacity: 0.7 }}>
          QUICK LOAD PRESETS
        </span>
        <div className="inst-segmented">
          {presets.map((p) => {
            const isActive = liveCount === p.live && blankCount === p.blank;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => setPreset(p.live, p.blank)}
                className={`inst-segmented__item ${isActive ? 'inst-segmented__item--active' : ''}`}
                aria-pressed={isActive}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Shell Steppers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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

      {/* Load Summary & Arm Action */}
      <div
        className="inst-panel inst-panel--recessed"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="inst-label" style={{ color: 'var(--text-secondary)' }}>
            TOTAL CHAMBER CAPACITY
          </span>
          <span
            className="inst-readout"
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {total} ROUNDS
          </span>
        </div>

        {!validation.valid && (
          <div
            className="inst-label"
            style={{
              color: 'var(--primitive-ruby-500)',
              textAlign: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-xs)',
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
          className="inst-button inst-button--primary"
          style={{
            width: '100%',
            minHeight: '52px',
            fontSize: 'var(--text-md)',
            letterSpacing: '0.08em',
          }}
        >
          ARM & BEGIN TRACKING
        </button>
      </div>
    </div>
  );
};
