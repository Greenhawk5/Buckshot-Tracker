import React, { useState, useMemo } from 'react';
import { TrackerSession, ShellType, AddIntelParams } from '../features/tracker/tracker.types';
import { validateAddIntel } from '../features/tracker/tracker.validation';
import './burner-phone-modal.css';

interface BurnerPhoneModalProps {
  isOpen: boolean;
  session: TrackerSession;
  onConfirm: (params: AddIntelParams) => void;
  onCancel: () => void;
}

export const BurnerPhoneModal: React.FC<BurnerPhoneModalProps> = ({
  isOpen,
  session,
  onConfirm,
  onCancel,
}) => {
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<ShellType | null>(null);

  const totalRemaining = session.liveRemaining + session.blankRemaining;
  const minPos = 2; // Single-player standard: earliest revealed is 2nd shell

  // Generate available positions (2 through totalRemaining)
  const availablePositions = useMemo(() => {
    const list: number[] = [];
    for (let p = minPos; p <= totalRemaining; p++) {
      list.push(p);
    }
    return list;
  }, [minPos, totalRemaining]);

  // Existing recorded positions for quick indicator
  const existingIntelMap = useMemo(() => {
    const map = new Map<number, ShellType>();
    for (const intel of session.shellIntel || []) {
      map.set(intel.positionFromCurrent, intel.shellType);
    }
    return map;
  }, [session.shellIntel]);

  // Validation check on current selection
  const validationResult = useMemo(() => {
    if (selectedPos === null || selectedType === null) {
      return { allowed: false };
    }
    return validateAddIntel(session, {
      positionFromCurrent: selectedPos,
      shellType: selectedType,
    });
  }, [session, selectedPos, selectedType]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedPos !== null && selectedType !== null && validationResult.allowed) {
      onConfirm({
        positionFromCurrent: selectedPos,
        shellType: selectedType,
      });
      // Reset state for next opening
      setSelectedPos(null);
      setSelectedType(null);
    }
  };

  const isEligible = totalRemaining >= 2;

  return (
    <div className="burner-modal-backdrop" role="dialog" aria-modal="true">
      <div className="burner-modal-card">
        {/* Header */}
        <div className="burner-modal-header">
          <h3 className="burner-modal-title">
            <span aria-hidden="true">📞</span> BURNER PHONE INTEL
          </h3>
          <p className="burner-modal-subtitle">
            Record an upcoming shell announced by the Burner Phone.
          </p>
        </div>

        {!isEligible ? (
          <div className="burner-validation-alert">
            Burner Phone cannot be used with fewer than 2 shells remaining (&quot;How unfortunate...&quot;).
          </div>
        ) : (
          <>
            {/* Position Selection */}
            <div className="burner-modal-section">
              <div className="burner-modal-section-label">
                <span>1. Select Announced Position</span>
                <span className="burner-modal-note">2nd shell onwards</span>
              </div>
              <div className="burner-pos-grid">
                {availablePositions.map((pos) => {
                  const existingType = existingIntelMap.get(pos);
                  const isSelected = selectedPos === pos;
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setSelectedPos(pos)}
                      className={`btn-pos-chip ${
                        isSelected ? 'btn-pos-chip--selected' : ''
                      } ${existingType ? 'btn-pos-chip--has-intel' : ''}`}
                      title={existingType ? `Already known as ${existingType}` : undefined}
                    >
                      <span>{pos}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shell Type Selection */}
            <div className="burner-modal-section">
              <div className="burner-modal-section-label">
                <span>2. Select Revealed Type</span>
              </div>
              <div className="burner-type-grid">
                <button
                  type="button"
                  onClick={() => setSelectedType('live')}
                  className={`btn-type-choice btn-type-choice--live ${
                    selectedType === 'live' ? 'btn-type-choice--selected' : ''
                  }`}
                >
                  <span aria-hidden="true">●</span> LIVE
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('blank')}
                  className={`btn-type-choice btn-type-choice--blank ${
                    selectedType === 'blank' ? 'btn-type-choice--selected' : ''
                  }`}
                >
                  <span aria-hidden="true">●</span> BLANK
                </button>
              </div>
            </div>

            {/* Validation Feedback */}
            {selectedPos !== null && selectedType !== null && !validationResult.allowed && (
              <div className="burner-validation-alert" role="alert">
                {validationResult.error}
              </div>
            )}
          </>
        )}

        {/* Modal Actions */}
        <div className="burner-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-modal-cancel"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!validationResult.allowed}
            className="btn-modal-confirm"
          >
            CONFIRM INTEL
          </button>
        </div>
      </div>
    </div>
  );
};
