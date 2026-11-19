import React from 'react';

interface AmmoIndicatorProps {
  liveRemaining: number;
  blankRemaining: number;
  initialLive: number;
  initialBlank: number;
}

export const AmmoIndicator: React.FC<AmmoIndicatorProps> = ({
  liveRemaining,
  blankRemaining,
  initialLive,
  initialBlank,
}) => {
  const totalRemaining = liveRemaining + blankRemaining;
  const initialTotal = initialLive + initialBlank;
  const spentCount = Math.max(0, initialTotal - totalRemaining);

  return (
    <div className="inst-bay">
      {/* Bay Header */}
      <div className="inst-bay__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="inst-label" style={{ color: 'var(--text-secondary)' }}>
            CHAMBER POOL
          </span>
          <span className="inst-label" style={{ fontSize: '9px', opacity: 0.6 }}>
            (UNORDERED)
          </span>
        </div>
        <span className="inst-readout" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {totalRemaining} / {initialTotal} REMAINING
        </span>
      </div>

      {/* Visual Slot Matrix */}
      <div className="inst-bay__slots">
        {/* Remaining Live Shells */}
        {Array.from({ length: liveRemaining }).map((_, i) => (
          <div
            key={`live-${i}`}
            title="Live Round"
            className="inst-slot inst-slot--live"
          >
            <div className="inst-slot__primer" />
          </div>
        ))}

        {/* Remaining Blank Shells */}
        {Array.from({ length: blankRemaining }).map((_, i) => (
          <div
            key={`blank-${i}`}
            title="Blank Round"
            className="inst-slot inst-slot--blank"
          >
            <div className="inst-slot__primer" />
          </div>
        ))}

        {/* Expended Shell Slots */}
        {Array.from({ length: spentCount }).map((_, i) => (
          <div
            key={`spent-${i}`}
            title="Discharged Round"
            className="inst-slot inst-slot--spent"
          />
        ))}

        {totalRemaining === 0 && (
          <div
            className="inst-label"
            style={{
              width: '100%',
              textAlign: 'center',
              padding: 'var(--space-2) 0',
              color: 'var(--primitive-amber-500)',
            }}
          >
            CHAMBER EXHAUSTED — RELOAD REQUIRED
          </div>
        )}
      </div>
    </div>
  );
};
