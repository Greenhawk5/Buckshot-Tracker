import React, { useState } from 'react';
import './preset-selector.css';
import './setup-summary.css';
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

  // Derived relative percentages and proportions for composition visualization
  const livePercent = total > 0 ? Math.round((liveCount / total) * 100) : 0;
  const blankPercent = total > 0 ? 100 - livePercent : 0;
  const liveRatio = total > 0 ? (liveCount / total) * 100 : 0;
  const blankRatio = total > 0 ? (blankCount / total) * 100 : 0;

  const handleStart = () => {
    if (validation.valid) {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
      } catch {
        // safe fallback outside Telegram
      }
      onStartLoad(liveCount, blankCount);
    }
  };

  const setPreset = (live: number, blank: number) => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    } catch {
      // safe fallback outside Telegram
    }
    setLiveCount(live);
    setBlankCount(blank);
  };

  const presets = [
    { label: '1L · 1B', live: 1, blank: 1 },
    { label: '2L · 2B', live: 2, blank: 2 },
    { label: '3L · 2B', live: 3, blank: 2 },
    { label: '3L · 3B', live: 3, blank: 3 },
    { label: '4L · 4B', live: 4, blank: 4 },
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
      <div className="preset-container">
        <div className="preset-header">
          <span className="preset-title">QUICK LOAD PRESETS</span>
          <span className="preset-hint">Tap to configure</span>
        </div>

        <div className="preset-dock" role="radiogroup" aria-label="Quick load presets">
          {presets.map((p) => {
            const isActive = liveCount === p.live && blankCount === p.blank;
            return (
              <button
                key={p.label}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={`${p.live} live, ${p.blank} blank preset`}
                onClick={() => setPreset(p.live, p.blank)}
                className={`preset-item ${isActive ? 'preset-item--active' : ''}`}
              >
                {/* Visual ammunition composition pips */}
                <div className="preset-pips" aria-hidden="true">
                  {Array.from({ length: p.live }).map((_, i) => (
                    <span key={`l-${i}`} className="preset-pip preset-pip--live" />
                  ))}
                  <span className="preset-pips-divider" />
                  {Array.from({ length: p.blank }).map((_, i) => (
                    <span key={`b-${i}`} className="preset-pip preset-pip--blank" />
                  ))}
                </div>

                {/* Live & Blank quantities with distinct semantic identities */}
                <div className="preset-label">
                  <span className="preset-qty preset-qty--live">{p.live}L</span>
                  <span className="preset-sep">·</span>
                  <span className="preset-qty preset-qty--blank">{p.blank}B</span>
                </div>

                {/* Active selection accent line */}
                {isActive && <span className="preset-active-indicator" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
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

      {/* Total Ammunition Summary & Primary Action */}
      <div className="setup-action-card">
        {/* Ammunition Summary Panel */}
        <div className="setup-summary" aria-label="Ammunition summary">
          <div className="setup-summary-header">
            <span className="setup-summary-title">
              <span className="setup-summary-icon" aria-hidden="true" />
              TOTAL ROUNDS IN CHAMBER
            </span>
            <span className="setup-summary-count" aria-label={`Total rounds: ${total}`}>
              {total}
            </span>
          </div>

          {/* Proportional Ammunition Ratio Bar */}
          <div
            className="setup-ratio-bar"
            role="progressbar"
            aria-label="Ammunition composition"
            aria-valuenow={liveCount}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            {total === 0 ? (
              <div className="setup-ratio-empty" />
            ) : (
              <>
                {liveCount > 0 && (
                  <div
                    className="setup-ratio-segment setup-ratio-segment--live"
                    style={{ width: `${liveRatio}%` }}
                  />
                )}
                {liveCount > 0 && blankCount > 0 && (
                  <div className="setup-ratio-divider" />
                )}
                {blankCount > 0 && (
                  <div
                    className="setup-ratio-segment setup-ratio-segment--blank"
                    style={{ width: `${blankRatio}%` }}
                  />
                )}
              </>
            )}
          </div>

          {/* Composition Breakdown Sub-row */}
          <div className="setup-summary-breakdown" aria-hidden="true">
            <div className="setup-summary-col">
              <span className="setup-summary-dot setup-summary-dot--live" />
              <span className="setup-summary-val--live">{liveCount} LIVE</span>
              {total > 0 && <span className="setup-summary-pct">({livePercent}%)</span>}
            </div>
            <div className="setup-summary-col">
              <span className="setup-summary-dot setup-summary-dot--blank" />
              <span className="setup-summary-val--blank">{blankCount} BLANK</span>
              {total > 0 && <span className="setup-summary-pct">({blankPercent}%)</span>}
            </div>
          </div>
        </div>

        {/* Validation Error Message */}
        {!validation.valid && (
          <div className="setup-validation-alert" role="alert">
            {validation.error}
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handleStart}
          disabled={!validation.valid}
          className="btn-start-tracking"
          aria-label="Start tracking session"
        >
          START TRACKING
        </button>
      </div>
    </div>
  );
};
