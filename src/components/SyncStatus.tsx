import React from 'react';
import { SyncState } from '../features/tracker/tracker.types';

interface SyncStatusProps {
  syncState: SyncState;
  onRetry?: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ syncState, onRetry }) => {
  const { status, pendingOperations, errorMessage } = syncState;

  let color = 'var(--color-success)';
  let text = 'CLOUD SYNCED';

  if (status === 'syncing') {
    color = 'var(--color-blank)';
    text = pendingOperations > 0 ? `SYNCING (${pendingOperations})...` : 'SYNCING...';
  } else if (status === 'offline') {
    color = 'var(--color-warning)';
    text = 'OFFLINE (SAVED LOCALLY)';
  } else if (status === 'error') {
    color = 'var(--color-danger)';
    text = errorMessage || 'SYNC ERROR';
  }

  return (
    <div
      onClick={status === 'error' ? onRetry : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        fontSize: '0.68rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-text-dim)',
        cursor: status === 'error' ? 'pointer' : 'default',
      }}
      title={errorMessage || text}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
          display: 'inline-block',
        }}
      />
      <span>{text}</span>
    </div>
  );
};
