import React, { useEffect, useState } from 'react';
import { fetchOwnerOverview, OwnerOverviewData } from '../../../services/owner.api';

export const OverviewView: React.FC = () => {
  const [data, setData] = useState<OwnerOverviewData | null>(null);
  const [preset, setPreset] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (selectedPreset: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOwnerOverview(selectedPreset);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(preset);
  }, [preset]);

  return (
    <div className="owner-view overview-view">
      {/* Period Filter Bar */}
      <div className="view-toolbar">
        <div className="period-chips">
          {['24h', '7d', '30d', '90d', '180d', '365d'].map((p) => (
            <button
              key={p}
              type="button"
              className={`period-chip ${preset === p ? 'active' : ''}`}
              onClick={() => setPreset(p)}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        <button type="button" className="refresh-btn" onClick={() => loadData(preset)} title="Refresh">
          ↻
        </button>
      </div>

      {loading && <div className="owner-loading">Loading telemetry and overview metrics...</div>}
      {error && <div className="owner-error">{error}</div>}

      {data && !loading && (
        <>
          {/* Key Metric Cards */}
          <div className="metrics-grid">
            <div className="metric-card metric-card--primary">
              <span className="metric-label">Total Users (All Time)</span>
              <span className="metric-value font-mono">{data.totals.totalUsers}</span>
              <span className="metric-sub">Observed Telegram identities</span>
            </div>

            <div className="metric-card metric-card--active">
              <span className="metric-label">Active Users ({preset})</span>
              <span className="metric-value font-mono">{data.totals.activeUsers}</span>
              <span className="metric-sub">
                {data.totals.returningUsers} returning • {data.totals.newUsers} new
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Sessions Created</span>
              <span className="metric-value font-mono">{data.totals.sessionsCreated}</span>
              <span className="metric-sub">{data.totals.sessionsCompleted} completed rounds</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Total Actions Recorded</span>
              <span className="metric-value font-mono">{data.totals.actionsRecorded}</span>
              <span className="metric-sub">Shots, ejections, intel & undo</span>
            </div>
          </div>

          {/* Retention & Trends */}
          <div className="section-card">
            <h4 className="card-heading">Active User Anchors (Rolling UTC)</h4>
            <div className="anchors-row">
              <div className="anchor-item">
                <span className="anchor-num font-mono">{data.activityTrends.dau}</span>
                <span className="anchor-tag">DAU (24h)</span>
              </div>
              <div className="anchor-item">
                <span className="anchor-num font-mono">{data.activityTrends.wau}</span>
                <span className="anchor-tag">WAU (7d)</span>
              </div>
              <div className="anchor-item">
                <span className="anchor-num font-mono">{data.activityTrends.mau}</span>
                <span className="anchor-tag">MAU (30d)</span>
              </div>
              <div className="anchor-item">
                <span className="anchor-num font-mono">{data.totals.avgSessionsPerActiveUser}</span>
                <span className="anchor-tag">Avg Sess/User</span>
              </div>
            </div>
          </div>

          {/* Time Series Histogram */}
          <div className="section-card">
            <h4 className="card-heading">Activity Velocity ({data.window.periodLabel})</h4>
            <div className="histogram-container">
              {data.timeSeries.map((bucket, i) => {
                const maxCount = Math.max(...data.timeSeries.map((b) => b.eventsCount), 1);
                const heightPct = Math.max(8, Math.round((bucket.eventsCount / maxCount) * 100));
                return (
                  <div key={i} className="histogram-bar-wrap" title={`${bucket.label}: ${bucket.eventsCount} events`}>
                    <div className="histogram-bar" style={{ height: `${heightPct}%` }} />
                    <span className="histogram-label">{bucket.label.slice(-5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

