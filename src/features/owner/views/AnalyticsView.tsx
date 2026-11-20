import React, { useEffect, useState } from 'react';
import { fetchOwnerAnalytics, OwnerOverviewData } from '../../../services/owner.api';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<OwnerOverviewData | null>(null);
  const [preset, setPreset] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (selectedPreset: string, start?: number, end?: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOwnerAnalytics(selectedPreset, start, end);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preset !== 'custom') {
      loadData(preset);
    }
  }, [preset]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    const startMs = new Date(customStart).getTime();
    const endMs = new Date(customEnd).getTime();
    loadData('custom', startMs, endMs);
  };

  return (
    <div className="owner-view analytics-view">
      <div className="view-toolbar">
        <div className="period-chips">
          {['24h', '7d', '30d', '90d', '180d', '365d', 'custom'].map((p) => (
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
      </div>

      {preset === 'custom' && (
        <form onSubmit={handleApplyCustom} className="custom-range-form">
          <div className="range-inputs">
            <input
              type="date"
              className="range-date-input"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              required
            />
            <span className="range-sep">to</span>
            <input
              type="date"
              className="range-date-input"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="range-apply-btn">
            Apply Range
          </button>
        </form>
      )}

      {loading && <div className="owner-loading">Computing analytics aggregates...</div>}
      {error && <div className="owner-error">{error}</div>}

      {data && !loading && (
        <>
          {/* Comparison Card */}
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">New Users in Window</span>
              <span className="metric-value font-mono">{data.totals.newUsers}</span>
              <span className="metric-sub">
                vs {data.comparison.priorNewUsers} in prior equivalent period
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Active Users in Window</span>
              <span className="metric-value font-mono">{data.totals.activeUsers}</span>
              <span className="metric-sub">
                vs {data.comparison.priorActiveUsers} in prior equivalent period
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Total Events</span>
              <span className="metric-value font-mono">{data.totals.totalEvents}</span>
              <span className="metric-sub">
                vs {data.comparison.priorEvents} in prior period
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">App Launches (Opens)</span>
              <span className="metric-value font-mono">{data.totals.appOpens}</span>
              <span className="metric-sub">
                vs {data.comparison.priorAppOpens} in prior period
              </span>
            </div>
          </div>

          {/* Event Breakdown */}
          <div className="section-card">
            <h4 className="card-heading">Event Taxonomy Breakdown</h4>
            <div className="event-breakdown-list">
              {Object.entries(data.eventBreakdown).length === 0 && (
                <div className="empty-sub">No events recorded in this interval.</div>
              )}
              {Object.entries(data.eventBreakdown).map(([type, count]) => {
                const total = Math.max(1, data.totals.totalEvents);
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={type} className="event-row">
                    <div className="event-meta">
                      <span className="event-type-name font-mono">{type}</span>
                      <span className="event-type-count font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="event-bar-bg">
                      <div className="event-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
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

