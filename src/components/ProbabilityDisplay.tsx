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
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-dim)',
          }}
        >
          COMPOSITION ODDS
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          Statistical distribution, not next shell
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Live Probability */}
        <div
          style={{
            flex: 1,
            background: 'var(--color-live-soft)',
            border: '1px solid var(--color-live-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--color-live)', fontWeight: 600 }}>LIVE</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-live)' }}>
            {livePercentage}%
          </span>
        </div>

        {/* Blank Probability */}
        <div
          style={{
            flex: 1,
            background: 'var(--color-blank-soft)',
            border: '1px solid var(--color-blank-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--color-blank)', fontWeight: 600 }}>BLANK</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-blank)' }}>
            {blankPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
};
