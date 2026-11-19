import React from 'react';
import { ShellType } from '../features/tracker/tracker.types';

interface ShellCounterProps {
  type: ShellType;
  label: string;
  count: number;
  min?: number;
  max?: number;
  onChange: (count: number) => void;
  onIncrementFeedback?: () => void;
}

export const ShellCounter: React.FC<ShellCounterProps> = ({
  type,
  label,
  count,
  min = 0,
  max = 8,
  onChange,
  onIncrementFeedback,
}) => {
  const isLive = type === 'live';
  const accentColor = isLive ? 'var(--primitive-crimson-400)' : 'var(--primitive-cobalt-400)';
  const borderColor = isLive ? 'var(--primitive-crimson-800)' : 'var(--primitive-cobalt-800)';
  const ledClass = isLive ? 'inst-led--error' : 'inst-led--active';

  const handleDecrement = () => {
    if (count > min) {
      onChange(count - 1);
      onIncrementFeedback?.();
    }
  };

  const handleIncrement = () => {
    if (count < max) {
      onChange(count + 1);
      onIncrementFeedback?.();
    }
  };

  return (
    <div
      className="inst-panel inst-panel--recessed"
      style={{
        borderColor: borderColor,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className={`inst-led ${ledClass}`} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: accentColor,
            }}
          >
            {label}
          </span>
        </div>
        <span className="inst-label">
          MAX {max}
        </span>
      </div>

      {/* Stepper controls and large readout */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={count <= min}
          aria-label={`Decrease ${label}`}
          className="inst-button"
          style={{
            width: '48px',
            minHeight: '48px',
            padding: 0,
            fontSize: '1.4rem',
            lineHeight: 1,
          }}
        >
          −
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            className="inst-readout"
            style={{
              fontSize: '2.6rem',
              fontWeight: 800,
              color: accentColor,
              lineHeight: 1,
            }}
          >
            {count}
          </span>
          <span
            className="inst-label"
            style={{ marginTop: '2px', fontSize: '9px', opacity: 0.7 }}
          >
            ROUNDS
          </span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={count >= max}
          aria-label={`Increase ${label}`}
          className="inst-button"
          style={{
            width: '48px',
            minHeight: '48px',
            padding: 0,
            fontSize: '1.4rem',
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};
