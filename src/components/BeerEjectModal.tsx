import React from 'react';
import { TrackerSession, ShellType } from '../features/tracker/tracker.types';
import './beer-eject-modal.css';

interface BeerEjectModalProps {
  isOpen: boolean;
  session: TrackerSession;
  onConfirmEject: (shell: ShellType) => void;
  onCancel: () => void;
}

export const BeerEjectModal: React.FC<BeerEjectModalProps> = ({
  isOpen,
  session,
  onConfirmEject,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Check if position 1 is already known via intelligence
  const knownPos1 = (session.shellIntel || []).find((i) => i.positionFromCurrent === 1);

  // Check capacity constraints: if all remaining live/blank shells are known to be at positions > 1,
  // then the current chamber cannot be that shell type!
  const knownFutureLive = (session.shellIntel || []).filter(
    (i) => i.positionFromCurrent > 1 && i.shellType === 'live'
  ).length;
  const canEjectLive = session.liveRemaining > knownFutureLive;

  const knownFutureBlank = (session.shellIntel || []).filter(
    (i) => i.positionFromCurrent > 1 && i.shellType === 'blank'
  ).length;
  const canEjectBlank = session.blankRemaining > knownFutureBlank;

  return (
    <div className="eject-modal-backdrop" role="dialog" aria-modal="true">
      <div className="eject-modal-card">
        {/* Header */}
        <div className="eject-modal-header">
          <h3 className="eject-modal-title">
            <span aria-hidden="true">🍺</span> EJECT SHELL (BEER)
          </h3>
          <p className="eject-modal-subtitle">
            Beer cycles the shotgun and ejects the currently chambered shell without firing.
          </p>
        </div>

        {knownPos1 ? (
          // When Position 1 is already known!
          <div className="eject-known-alert">
            <span>
              Chambered shell is known to be <strong>{knownPos1.shellType.toUpperCase()}</strong>.
            </span>
            <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>
              Ejecting will safely discard this {knownPos1.shellType} shell from the chamber.
            </span>
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => onConfirmEject(knownPos1.shellType)}
                className={`btn-eject-known-confirm ${
                  knownPos1.shellType === 'live'
                    ? 'btn-eject-known-confirm--live'
                    : 'btn-eject-known-confirm--blank'
                }`}
              >
                EJECT KNOWN {knownPos1.shellType.toUpperCase()} SHELL
              </button>
            </div>
          </div>
        ) : (
          // Position 1 is not known: User picks what fell out on the table
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
              What shell was ejected onto the table?
            </span>
            <div className="eject-choice-grid">
              <button
                type="button"
                onClick={() => onConfirmEject('live')}
                disabled={!canEjectLive}
                className="btn-eject-choice btn-eject-choice--live"
              >
                <span style={{ fontSize: '1.2rem' }} aria-hidden="true">🔴</span>
                <span>EJECT LIVE</span>
                <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                  ({session.liveRemaining} left{knownFutureLive > 0 ? `, ${knownFutureLive} upcoming` : ''})
                </span>
              </button>

              <button
                type="button"
                onClick={() => onConfirmEject('blank')}
                disabled={!canEjectBlank}
                className="btn-eject-choice btn-eject-choice--blank"
              >
                <span style={{ fontSize: '1.2rem' }} aria-hidden="true">🔵</span>
                <span>EJECT BLANK</span>
                <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                  ({session.blankRemaining} left{knownFutureBlank > 0 ? `, ${knownFutureBlank} upcoming` : ''})
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="eject-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-modal-cancel"
            style={{ width: '100%' }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};
