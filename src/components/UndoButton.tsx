import React from 'react';
import './tracker-actions.css';

interface UndoButtonProps {
  onUndo: () => void;
  disabled: boolean;
  eventCount: number;
}

export const UndoButton: React.FC<UndoButtonProps> = ({ onUndo, disabled, eventCount }) => {
  return (
    <button
      type="button"
      onClick={onUndo}
      disabled={disabled}
      aria-label={`Undo last shot${eventCount > 0 ? ` (${eventCount} available)` : ''}`}
      className={`btn-tracker-action btn-undo ${disabled ? 'btn-undo--disabled' : 'btn-undo--enabled'}`}
    >
      <span className="undo-icon" aria-hidden="true">↩</span>
      <span className="undo-label">UNDO SHOT</span>
      {eventCount > 0 && !disabled && (
        <span className="undo-badge" aria-hidden="true">
          {eventCount}
        </span>
      )}
    </button>
  );
};
