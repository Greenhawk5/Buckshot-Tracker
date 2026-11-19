import React from 'react';
import { ShellIntel } from '../features/tracker/tracker.types';
import './known-shell-positions.css';

interface KnownShellPositionsProps {
  intelList: ShellIntel[];
  onRemoveIntel: (id: string) => void;
}

function getOrdinalLabel(pos: number): string {
  if (pos === 1) return '1ST SHELL (NEXT)';
  if (pos === 2) return '2ND SHELL';
  if (pos === 3) return '3RD SHELL';
  return `${pos}TH SHELL`;
}

export const KnownShellPositions: React.FC<KnownShellPositionsProps> = ({
  intelList,
  onRemoveIntel,
}) => {
  const sortedIntel = [...(intelList || [])].sort(
    (a, b) => a.positionFromCurrent - b.positionFromCurrent
  );

  return (
    <div className="known-shells-card" aria-label="Known shell positions">
      <div className="known-shells-header">
        <div className="known-shells-title-group">
          <h3 className="known-shells-title">KNOWN SHELL POSITIONS</h3>
          <p className="known-shells-subtitle">Verified shell intelligence</p>
        </div>
        {sortedIntel.length > 0 && (
          <span className="known-shells-count-badge">
            {sortedIntel.length} {sortedIntel.length === 1 ? 'KNOWN' : 'KNOWN'}
          </span>
        )}
      </div>

      {sortedIntel.length === 0 ? (
        <div className="known-shells-empty">
          <span className="known-shells-empty-icon" aria-hidden="true">📞</span>
          <span>No revealed shells · Use Burner Phone to log upcoming positions</span>
        </div>
      ) : (
        <div className="known-shells-list">
          {sortedIntel.map((intel) => {
            const isCurrent = intel.positionFromCurrent === 1;
            const isLive = intel.shellType === 'live';

            return (
              <div
                key={intel.id}
                className={`known-shell-item ${
                  isCurrent ? 'known-shell-item--current' : 'known-shell-item--upcoming'
                }`}
              >
                <div className="known-shell-left">
                  {/* Position Badge */}
                  <div
                    className="known-shell-pos-badge"
                    aria-label={`Position ${intel.positionFromCurrent}`}
                  >
                    {intel.positionFromCurrent}
                  </div>

                  {/* Details */}
                  <div className="known-shell-details">
                    <div className="known-shell-header-row">
                      <span className="known-shell-ordinal">
                        {getOrdinalLabel(intel.positionFromCurrent)}
                      </span>
                      <span
                        className={`known-shell-state-pill ${
                          isCurrent
                            ? 'known-shell-state-pill--current'
                            : 'known-shell-state-pill--upcoming'
                        }`}
                      >
                        {isCurrent ? 'CURRENT SHELL' : 'UPCOMING'}
                      </span>
                    </div>

                    <div className="known-shell-meta-row">
                      <span
                        className={
                          isLive ? 'known-shell-type--live' : 'known-shell-type--blank'
                        }
                      >
                        {isLive ? 'LIVE ROUND' : 'BLANK ROUND'}
                      </span>
                      <span className="known-shell-source">· BURNER PHONE</span>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => onRemoveIntel(intel.id)}
                  className="btn-remove-intel"
                  title={`Remove intelligence for position ${intel.positionFromCurrent}`}
                  aria-label={`Remove intelligence for position ${intel.positionFromCurrent}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
