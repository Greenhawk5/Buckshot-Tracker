import React, { useState } from 'react';
import { ShellType } from '../features/tracker/tracker.types';

interface ShotButtonProps {
  shell: ShellType;
  remaining: number;
  onShot: (shell: ShellType) => void;
  disabled?: boolean;
}

export const ShotButton: React.FC<ShotButtonProps> = ({
  shell,
  remaining,
  onShot,
  disabled = false,
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const isLive = shell === 'live';

  const isDisabled = disabled || remaining <= 0;

  const bgNormal = isLive ? 'linear-gradient(180deg, #2b1115 0%, #1c0b0e 100%)' : 'linear-gradient(180deg, #0e1e30 0%, #081320 100%)';
  const bgActive = isLive ? 'linear-gradient(180deg, #42181e 0%, #290e12 100%)' : 'linear-gradient(180deg, #163252 0%, #0d2138 100%)';
  const borderNormal = isLive ? 'var(--color-live-border)' : 'var(--color-blank-border)';
  const borderHighlight = isLive ? 'var(--color-live)' : 'var(--color-blank)';
  const textColor = isLive ? 'var(--color-live)' : 'var(--color-blank)';
  const glow = isLive ? 'var(--color-live-glow)' : 'var(--color-blank-glow)';

  const handleClick = () => {
    if (isDisabled) return;
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 150);
    onShot(shell);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={`Shoot ${isLive ? 'Live' : 'Blank'} shell. ${remaining} remaining.`}
      style={{
        flex: 1,
        minHeight: '130px',
        background: isPressing ? bgActive : bgNormal,
        border: `2px solid ${isPressing ? borderHighlight : borderNormal}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.35 : 1,
        transform: isPressing ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.12s ease, border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
        boxShadow: !isDisabled ? `0 4px 18px ${glow}` : 'none',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: textColor,
            boxShadow: `0 0 10px ${textColor}`,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: textColor,
          }}
        >
          {isLive ? 'LIVE SHOT' : 'BLANK SHOT'}
        </span>
      </div>

      <div style={{ margin: '4px 0' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '2.8rem',
            fontWeight: 800,
            lineHeight: 1,
            color: '#ffffff',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {remaining}
        </span>
      </div>

      <span
        style={{
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {remaining === 1 ? '1 SHELL LEFT' : `${remaining} SHELLS LEFT`}
      </span>
    </button>
  );
};
