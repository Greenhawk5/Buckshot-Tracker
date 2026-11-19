import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          maxWidth: '360px',
          width: '100%',
          boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.15rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: isDestructive ? 'var(--color-live)' : 'var(--color-text)',
            margin: 0,
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--color-text-dim)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-dim)',
              fontWeight: 600,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: isDestructive
                ? 'linear-gradient(135deg, var(--color-live) 0%, #a81c25 100%)'
                : 'linear-gradient(135deg, var(--color-blank) 0%, #1d72a8 100%)',
              border: `1px solid ${isDestructive ? 'var(--color-live)' : 'var(--color-blank)'}`,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: isDestructive ? '0 4px 16px var(--color-live-glow)' : '0 4px 16px var(--color-blank-glow)',
              transition: 'all 0.15s ease',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
