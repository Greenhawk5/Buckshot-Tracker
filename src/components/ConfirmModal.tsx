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
        backgroundColor: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        className="inst-panel inst-panel--raised"
        style={{
          maxWidth: '380px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          border: '1px solid var(--border-highlight)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className={`inst-led ${isDestructive ? 'inst-led--error' : 'inst-led--warning'}`} />
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-md)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isDestructive ? 'var(--primitive-crimson-400)' : 'var(--text-primary)',
            }}
          >
            {title}
          </h3>
        </div>

        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={onCancel}
            className="inst-button"
            style={{ flex: 1, minHeight: '44px' }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`inst-button ${isDestructive ? 'inst-button--danger' : 'inst-button--primary'}`}
            style={{ flex: 1, minHeight: '44px' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
