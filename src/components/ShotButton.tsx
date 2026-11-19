import React from 'react';
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
  const isLive = shell === 'live';
  const isDisabled = disabled || remaining <= 0;
  const triggerClass = isLive ? 'inst-trigger--live' : 'inst-trigger--blank';

  const handleClick = () => {
    if (isDisabled) return;
    onShot(shell);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={`Shoot ${isLive ? 'Live' : 'Blank'} round. ${remaining} remaining.`}
      className={`inst-trigger ${triggerClass}`}
    >
      {/* Top Header Badge */}
      <div className="inst-trigger__badge" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span
          className={`inst-led ${isLive ? 'inst-led--error' : 'inst-led--active'}`}
          style={{ width: '6px', height: '6px' }}
        />
        <span>{isLive ? 'LIVE DISCHARGE' : 'BLANK DISCHARGE'}</span>
      </div>

      {/* Primary Readout */}
      <span className="inst-trigger__count inst-readout">
        {remaining}
      </span>

      {/* Subtitle / Status */}
      <span
        className="inst-label"
        style={{
          marginTop: 'var(--space-1)',
          color: isDisabled ? 'var(--text-dim)' : 'var(--text-secondary)',
        }}
      >
        {remaining === 0
          ? 'EXHAUSTED'
          : remaining === 1
          ? '1 ROUND IN CHAMBER'
          : `${remaining} ROUNDS IN CHAMBER`}
      </span>
    </button>
  );
};
