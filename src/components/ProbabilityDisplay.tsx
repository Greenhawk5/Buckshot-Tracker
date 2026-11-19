import React from 'react';
import { ProbabilityResult } from '../features/tracker/tracker.types';
import './probability-display.css';

interface ProbabilityDisplayProps {
  probability: ProbabilityResult | null;
}

export const ProbabilityDisplay: React.FC<ProbabilityDisplayProps> = ({ probability }) => {
  if (!probability || probability.totalRemaining <= 0) {
    return null;
  }

  const { livePercentage, blankPercentage } = probability;

  return (
    <div className="odds-card">
      <div className="odds-header">
        <h3 className="odds-title">COMPOSITION ODDS</h3>
        <p className="odds-subtitle">Overall mix · Not the next shell</p>
      </div>

      <div className="odds-tiles">
        {/* Live Probability Card */}
        <div className="odds-tile-live">
          <span className="odds-tile-live-label">LIVE</span>
          <span className="odds-tile-live-value">{livePercentage}%</span>
        </div>

        {/* Blank Probability Card */}
        <div className="odds-tile-blank">
          <span className="odds-tile-blank-label">BLANK</span>
          <span className="odds-tile-blank-value">{blankPercentage}%</span>
        </div>
      </div>

      {/* Proportional Split Bar */}
      <div className="odds-bar-track">
        <div
          className="odds-bar-live"
          style={{ width: `${livePercentage}%` }}
        />
        <div
          className="odds-bar-blank"
          style={{ width: `${blankPercentage}%` }}
        />
      </div>
    </div>
  );
};
