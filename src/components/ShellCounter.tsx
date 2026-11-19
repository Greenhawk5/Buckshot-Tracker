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
  const colorVar = isLive ? 'var(--color-live)' : 'var(--color-blank)';
  const bgSoft = isLive ? 'var(--color-live-soft)' : 'var(--color-blank-soft)';
  const borderVar = isLive ? 'var(--color-live-border)' : 'var(--color-blank-border)';

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
      style={{
        background: bgSoft,
        border: `1px solid ${borderVar}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: colorVar,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: colorVar,
              boxShadow: isLive ? '0 0 8px var(--color-live)' : '0 0 8px var(--color-blank)',
            }}
          />
          {label}
        </span>
        <span
          style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
          }}
        >
          MAX {max}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={count <= min}
          aria-label={`Decrease ${label}`}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: count <= min ? 'var(--color-text-muted)' : 'var(--color-text)',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: count <= min ? 'not-allowed' : 'pointer',
            opacity: count <= min ? 0.4 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          −
        </button>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '2.5rem',
            fontWeight: 700,
            color: colorVar,
            minWidth: '60px',
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          {count}
        </span>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={count >= max}
          aria-label={`Increase ${label}`}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: count >= max ? 'var(--color-text-muted)' : 'var(--color-text)',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: count >= max ? 'not-allowed' : 'pointer',
            opacity: count >= max ? 0.4 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};
