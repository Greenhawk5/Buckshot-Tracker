import React from 'react';
import './ammo-indicator.css';

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
    <div className="chamber-inventory-card" aria-label="Chamber inventory">
      {/* Redesigned 2-Column Header */}
      <div className="chamber-header">
        <div className="chamber-header-left">
          <span className="chamber-title">CHAMBER INVENTORY</span>
          <span className="chamber-badge-unordered">UNORDERED</span>
        </div>

        <div className="chamber-header-right">
          <div className="chamber-count-wrap" aria-label={`${totalRemaining} of ${initialTotal} remaining`}>
            <span className="chamber-count-remaining">{totalRemaining}</span>
            <span className="chamber-count-sep">/</span>
            <span className="chamber-count-total">{initialTotal}</span>
          </div>
          <span className="chamber-count-label">REMAINING</span>
        </div>
      </div>

      {/* Visual Ammunition Capsules Track */}
      <div className="chamber-capsules-track" aria-hidden="true">
        {Array.from({ length: liveRemaining }).map((_, i) => (
          <div
            key={`live-${i}`}
            title="Live shell"
            className="chamber-capsule chamber-capsule--live"
          />
        ))}

        {Array.from({ length: blankRemaining }).map((_, i) => (
          <div
            key={`blank-${i}`}
            title="Blank shell"
            className="chamber-capsule chamber-capsule--blank"
          />
        ))}

        {Array.from({ length: spentCount }).map((_, i) => (
          <div
            key={`spent-${i}`}
            title="Discharged shell"
            className="chamber-capsule chamber-capsule--spent"
          />
        ))}

        {totalRemaining === 0 && (
          <div className="chamber-empty-msg">
            CHAMBER EMPTY
          </div>
        )}
      </div>
    </div>
  );
};
