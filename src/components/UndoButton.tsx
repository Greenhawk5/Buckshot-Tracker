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
      aria-label="Undo last shot"
      style={{
        flex: 1,
        padding: '12px 16px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        color: disabled ? 'var(--color-text-muted)' : 'var(--color-text)',
        fontFamily: 'var(--font-display)',
        fontSize: '0.85rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ fontSize: '1rem' }}>↩</span>
      <span>UNDO SHOT</span>
      {eventCount > 0 && !disabled && (
        <span
          style={{
            background: 'var(--color-surface-raised)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-dim)',
          }}
        >
          {eventCount}
        </span>
      )}
    </button>
  );
};
