import React from 'react';
import { SyncState } from '../features/tracker/tracker.types';

interface SyncStatusProps {
  syncState: SyncState;
  onRetry?: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ syncState, onRetry }) => {
  const { status, pendingOperations, errorMessage } = syncState;

  let color = 'var(--color-success)';
  let label = 'SYNCED';
  let tooltip = 'Cloud synchronized';

  if (status === 'syncing') {
    color = 'var(--color-blank)';
    label = pendingOperations > 0 ? `SYNCING (${pendingOperations})` : 'SYNCING';
    tooltip = pendingOperations > 0
      ? `Synchronizing ${pendingOperations} pending operation(s)`
      : 'Synchronizing with cloud...';
  } else if (status === 'offline') {
    color = 'var(--color-warning)';
    label = 'OFFLINE';
    tooltip = 'Offline mode — changes saved locally';
  } else if (status === 'error') {
    color = 'var(--color-danger)';
    label = 'RETRY';
    tooltip = errorMessage
      ? `${errorMessage} — click to retry`
      : 'Sync error — click to retry';
  }

  return (
    <div
      onClick={status === 'error' ? onRetry : undefined}
      className="sync-status-badge"
      title={tooltip}
      style={{
        cursor: status === 'error' ? 'pointer' : 'default',
      }}
    >
      <span
        className="sync-status-dot"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span className="sync-status-label">{label}</span>
    </div>
  );
};
