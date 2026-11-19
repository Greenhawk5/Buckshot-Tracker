import React from 'react';

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
      aria-label="Undo last recorded discharge"
      className="inst-button"
      style={{
        flex: 1,
        minHeight: '44px',
        padding: 'var(--space-2) var(--space-4)',
        gap: 'var(--space-2)',
      }}
    >
      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>↩</span>
      <span>UNDO DISCHARGE</span>
      {eventCount > 0 && !disabled && (
        <span
          className="inst-readout"
          style={{
            backgroundColor: 'var(--surface-recessed)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-xs)',
            fontSize: 'var(--text-2xs)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {eventCount}
        </span>
      )}
    </button>
  );
};
