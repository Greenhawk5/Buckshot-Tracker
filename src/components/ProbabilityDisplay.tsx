import React from 'react';
import { ProbabilityResult } from '../features/tracker/tracker.types';

interface ProbabilityDisplayProps {
  probability: ProbabilityResult | null;
}

export const ProbabilityDisplay: React.FC<ProbabilityDisplayProps> = ({ probability }) => {
  if (!probability || probability.totalRemaining <= 0) {
    return null;
  }

  const { livePercentage, blankPercentage } = probability;

  return (
    <div
      className="inst-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="inst-label" style={{ color: 'var(--text-secondary)' }}>
          DISCHARGE PROBABILITY
        </span>
        <span className="inst-label" style={{ fontSize: '9px', opacity: 0.6 }}>
          ODDS PER CYCLE
        </span>
      </div>

      {/* Probability Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        {/* Live Probability */}
        <div
          className="inst-panel inst-panel--recessed"
          style={{
            borderColor: 'var(--primitive-crimson-800)',
            padding: 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-2xs)',
                fontWeight: 700,
                color: 'var(--primitive-crimson-400)',
                letterSpacing: '0.08em',
              }}
            >
              LIVE
            </span>
            <span className="inst-led inst-led--error" style={{ width: '5px', height: '5px' }} />
          </div>
          <span
            className="inst-readout"
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--primitive-crimson-300)',
              lineHeight: 1.1,
            }}
          >
            {livePercentage}%
          </span>
        </div>

        {/* Blank Probability */}
        <div
          className="inst-panel inst-panel--recessed"
          style={{
            borderColor: 'var(--primitive-cobalt-800)',
            padding: 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-2xs)',
                fontWeight: 700,
                color: 'var(--primitive-cobalt-400)',
                letterSpacing: '0.08em',
              }}
            >
              BLANK
            </span>
            <span className="inst-led inst-led--active" style={{ width: '5px', height: '5px' }} />
          </div>
          <span
            className="inst-readout"
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--primitive-cobalt-300)',
              lineHeight: 1.1,
            }}
          >
            {blankPercentage}%
          </span>
        </div>
      </div>

      {/* Proportional Split Indicator Bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          borderRadius: 'var(--radius-pill)',
          display: 'flex',
          overflow: 'hidden',
          backgroundColor: 'var(--primitive-neutral-800)',
        }}
      >
        <div
          style={{
            width: `${livePercentage}%`,
            backgroundColor: 'var(--primitive-crimson-500)',
            transition: 'width var(--duration-fast) var(--ease-tactile)',
          }}
        />
        <div
          style={{
            width: `${blankPercentage}%`,
            backgroundColor: 'var(--primitive-cobalt-500)',
            transition: 'width var(--duration-fast) var(--ease-tactile)',
          }}
        />
      </div>
    </div>
  );
};
