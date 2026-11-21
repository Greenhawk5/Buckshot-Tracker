import React, { useEffect, useState, useRef } from 'react';
import { fetchOwnerOverview, OwnerOverviewData } from '../../../services/owner.api';
import { CompactMetricCard } from '../components/CompactMetricCard';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { GridBarChart } from '../components/charts/GridBarChart';

export const OverviewView: React.FC = () => {
  const [data, setData] = useState<OwnerOverviewData | null>(null);
  const [preset, setPreset] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request race condition protection
  const activeRequestIdRef = useRef(0);

  const loadData = async (selectedPreset: string) => {
    const currentRequestId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOwnerOverview(selectedPreset);
      if (currentRequestId === activeRequestIdRef.current) {
        setData(res);
      }
    } catch (err: any) {
      if (currentRequestId === activeRequestIdRef.current) {
        setError(err?.message || 'Failed to load overview data');
      }
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(preset);
  }, [preset]);

  return (
    <div className="owner-view overview-view">
      {/* Time-Range Selector with Debounced Refresh */}
      <TimeRangeSelector
        preset={preset}
        onChangePreset={setPreset}
        onRefresh={() => loadData(preset)}
        loading={loading}
      />

      {loading && (
        <div className="owner-loading" role="status">
          <span className="loading-pulse-dot" /> Loading telemetry and overview metrics...
        </div>
      )}

      {error && <div className="owner-error" role="alert">{error}</div>}

      {data && !loading && (
        <>
          {/* High-Density 2-Column KPI Grid */}
          <div className="metrics-grid">
            <CompactMetricCard
              label="Total Users (All Time)"
              value={data.totals.totalUsers}
              sub="Observed Telegram profiles"
              variant="primary"
            />

            <CompactMetricCard
              label={`Active Users (${preset.toUpperCase()})`}
              value={data.totals.activeUsers}
              sub={`${data.totals.returningUsers} return • ${data.totals.newUsers} new`}
              variant="active"
              trend={{
                value: `${data.totals.newUsers} new`,
                positive: data.totals.newUsers > 0,
                neutral: data.totals.newUsers === 0,
              }}
            />

            <CompactMetricCard
              label="Sessions Created"
              value={data.totals.sessionsCreated}
              sub={`${data.totals.sessionsCompleted} completed rounds`}
            />

            <CompactMetricCard
              label="Actions Recorded"
              value={data.totals.actionsRecorded.toLocaleString()}
              sub="Shots, ejections, intel"
            />
          </div>

          {/* Compact Telemetry Anchors Strip */}
          <div className="anchors-strip" aria-label="Active user anchors">
            <div className="anchors-strip-item">
              <span className="anchor-label">DAU (24H)</span>
              <span className="anchor-val font-mono">{data.activityTrends.dau}</span>
            </div>
            <div className="anchors-strip-item">
              <span className="anchor-label">WAU (7D)</span>
              <span className="anchor-val font-mono">{data.activityTrends.wau}</span>
            </div>
            <div className="anchors-strip-item">
              <span className="anchor-label">MAU (30D)</span>
              <span className="anchor-val font-mono">{data.activityTrends.mau}</span>
            </div>
            <div className="anchors-strip-item">
              <span className="anchor-label">AVG SESS/USER</span>
              <span className="anchor-val font-mono">{data.totals.avgSessionsPerActiveUser}</span>
            </div>
          </div>

          {/* Activity Velocity Grid Matrix */}
          <GridBarChart
            title={`Activity Velocity (${data.window.periodLabel})`}
            data={data.timeSeries}
            maxBlocksPerCol={7}
          />
        </>
      )}
    </div>
  );
};
