import React from 'react';
import { SyncState } from '../features/tracker/tracker.types';

interface SyncStatusProps {
  syncState: SyncState;
  onRetry?: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ syncState, onRetry }) => {
  const { status, pendingOperations, errorMessage } = syncState;

  let ledClass = 'inst-led--active';
  let label = 'PERSISTENCE: ONLINE';

  if (status === 'syncing') {
    ledClass = 'inst-led--warning';
    label = pendingOperations > 0 ? `SYNCING (${pendingOperations})` : 'SYNCING';
  } else if (status === 'offline') {
    ledClass = 'inst-led--warning';
    label = 'LOCAL CACHE (OFFLINE)';
  } else if (status === 'error') {
    ledClass = 'inst-led--error';
    label = errorMessage || 'SYNC FAULT (RETRY)';
  }

  return (
    <div
      onClick={status === 'error' ? onRetry : undefined}
      className="inst-telemetry-badge"
      style={{
        cursor: status === 'error' ? 'pointer' : 'default',
      }}
      title={errorMessage || label}
    >
      <span className={`inst-led ${ledClass}`} />
      <span>{label}</span>
    </div>
  );
};
