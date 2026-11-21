import React, { useEffect, useState } from 'react';
import { fetchOwnerSystemHealth } from '../../../services/owner.api';
import { CompactMetricCard } from '../components/CompactMetricCard';

export const HealthView: React.FC = () => {
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pingSpinning, setPingSpinning] = useState(false);

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

  const handleManualPing = () => {
    if (loading || pingSpinning) return;
    setPingSpinning(true);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    loadHealth().finally(() => {
      setTimeout(() => setPingSpinning(false), 600);
    });
  };

  return (
    <div className="owner-view health-view">
      <div className="view-toolbar">
        <div>
          <h3 className="view-title">System Diagnostics & Storage Health</h3>
          <p className="view-desc">Real-time isolate latency, SQLite storage metrics, and durable entity volume.</p>
        </div>
        <button
          type="button"
          className={`refresh-btn ${pingSpinning || loading ? 'is-spinning' : ''}`}
          onClick={handleManualPing}
          disabled={loading || pingSpinning}
          title="Ping Health Telemetry"
          aria-label="Ping Health Telemetry"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="owner-loading" role="status">
          <span className="loading-pulse-dot" /> Testing database latency and isolate health...
        </div>
      )}
      {error && <div className="owner-error" role="alert">{error}</div>}

      {health && !loading && (
        <>
          <div className="metrics-grid">
            <CompactMetricCard
              label="System Status"
              value={health.status === 'healthy' ? 'OPERATIONAL' : 'DEGRADED'}
              sub={`Checked at ${new Date(health.timestamp).toLocaleTimeString()}`}
              variant={health.status === 'healthy' ? 'success' : 'warning'}
              icon={
                <span
                  className={`status-pulse-dot ${
                    health.status === 'healthy' ? 'status-pulse-dot--green' : 'status-pulse-dot--amber'
                  }`}
                />
              }
            />

            <CompactMetricCard
              label="Database Round-Trip"
              value={`${health.database.latencyMs} ms`}
              sub="SQLite WAL Zero-Contention"
              variant="primary"
            />
          </div>

          <div className="section-card">
            <div className="section-card-header">
              <h4 className="card-heading">Durable Entities Volume</h4>
              <span className="section-card-tag font-mono">SQLite Tables</span>
            </div>
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
            <div className="section-card-header">
              <h4 className="card-heading">Queue Telemetry & Ingestion</h4>
              <span className="section-card-tag font-mono">Workers</span>
            </div>
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
        </>
      )}
    </div>
  );
};
