import React, { useEffect, useState } from 'react';
import { fetchOwnerSystemHealth } from '../../../services/owner.api';

export const HealthView: React.FC = () => {
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOwnerSystemHealth();
      setHealth(res.health);
    } catch (err: any) {
      setError(err?.message || 'Failed to ping health endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="owner-view health-view">
      <div className="view-toolbar">
        <h3 className="view-title">System Diagnostics & Storage Health</h3>
        <button type="button" className="refresh-btn" onClick={loadHealth}>
          ↻ Ping
        </button>
      </div>

      {loading && <div className="owner-loading">Testing database latency and isolate health...</div>}
      {error && <div className="owner-error">{error}</div>}

      {health && !loading && (
        <div className="health-grid">
          <div className="metric-card metric-card--primary">
            <span className="metric-label">System Status</span>
            <span className="metric-value font-mono">
              {health.status === 'healthy' ? '🟢 OPERATIONAL' : '🟡 DEGRADED'}
            </span>
            <span className="metric-sub">Checked at {new Date(health.timestamp).toLocaleTimeString()}</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Database Round-Trip</span>
            <span className="metric-value font-mono">{health.database.latencyMs} ms</span>
            <span className="metric-sub">SQLite WAL Zero-Contention Mode</span>
          </div>

          <div className="section-card">
            <h4 className="card-heading">Durable Entities Volume</h4>
            <div className="anchors-row">
              <div className="anchor-item">
                <span className="anchor-num font-mono">{health.counts.totalUsers}</span>
                <span className="anchor-tag">Users</span>
              </div>
              <div className="anchor-item">
                <span className="anchor-num font-mono">{health.counts.totalSessions}</span>
                <span className="anchor-tag">Sessions</span>
              </div>
              <div className="anchor-item">
                <span className="anchor-num font-mono">{health.counts.totalEvents}</span>
                <span className="anchor-tag">Events</span>
              </div>
              <div className="anchor-item">
                <span className="anchor-num font-mono">{health.counts.totalCampaigns}</span>
                <span className="anchor-tag">Campaigns</span>
              </div>
            </div>
          </div>

          <div className="section-card">
            <h4 className="card-heading">Queue Telemetry</h4>
            <div className="anchors-row">
              <div className="anchor-item">
                <span className="anchor-num font-mono">{health.counts.runningCampaigns}</span>
                <span className="anchor-tag">Active Campaigns</span>
              </div>
              <div className="anchor-item">
                <span className="anchor-num font-mono">{health.counts.pendingRecipients}</span>
                <span className="anchor-tag">Pending Dispatch</span>
              </div>
              <div className="anchor-item">
                <span className="anchor-num font-mono">{health.counts.failedRecipients}</span>
                <span className="anchor-tag">Failed Recip.</span>
              </div>
              <div className="anchor-item">
                <span className="anchor-num font-mono">{health.counts.feedbackCount}</span>
                <span className="anchor-tag">Feedback Logs</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

