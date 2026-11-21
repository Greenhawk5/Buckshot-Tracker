import React, { useEffect, useState, useRef } from 'react';
import { fetchOwnerAnalytics, OwnerOverviewData } from '../../../services/owner.api';
import { CompactMetricCard } from '../components/CompactMetricCard';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { CustomDateRangePicker } from '../components/CustomDateRangePicker';
import { TacticalAreaChart } from '../components/charts/TacticalAreaChart';
import { TaxonomyDonutChart } from '../components/charts/TaxonomyDonutChart';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<OwnerOverviewData | null>(null);
  const [preset, setPreset] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request race condition protection
  const activeRequestIdRef = useRef(0);

  const loadData = async (selectedPreset: string, start?: number, end?: number) => {
    const currentRequestId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOwnerAnalytics(selectedPreset, start, end);
      if (currentRequestId === activeRequestIdRef.current) {
        setData(res);
      }
    } catch (err: any) {
      if (currentRequestId === activeRequestIdRef.current) {
        setError(err?.message || 'Failed to fetch analytics');
      }
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (preset !== 'custom') {
      loadData(preset);
    }
  }, [preset]);

  const handleApplyCustom = (startMs: number, endMs: number) => {
    loadData('custom', startMs, endMs);
  };

  const formatDelta = (current: number, prior: number) => {
    const diff = current - prior;
    if (diff === 0) return { text: '• 0', positive: false, neutral: true };
    if (diff > 0) return { text: `+${diff.toLocaleString()}`, positive: true, neutral: false };
    return { text: `${diff.toLocaleString()}`, positive: false, neutral: false };
  };

  return (
    <div className="owner-view analytics-view">
      {/* Time-Range Selector with Custom Option & Refresh */}
      <TimeRangeSelector
        preset={preset}
        onChangePreset={setPreset}
        onRefresh={() => {
          if (preset !== 'custom') {
            loadData(preset);
          }
        }}
        includeCustom={true}
        loading={loading}
      />

      {/* Custom Date Range Picker */}
      {preset === 'custom' && (
        <CustomDateRangePicker onApply={handleApplyCustom} loading={loading} />
      )}

      {loading && (
        <div className="owner-loading" role="status">
          <span className="loading-pulse-dot" /> Computing analytics aggregates...
        </div>
      )}

      {error && <div className="owner-error" role="alert">{error}</div>}

      {data && !loading && (
        <>
          {/* High-Density 2-Column KPI Comparison Grid */}
          <div className="metrics-grid">
            {(() => {
              const delta = formatDelta(data.totals.newUsers, data.comparison.priorNewUsers);
              return (
                <CompactMetricCard
                  label="New Users in Window"
                  value={data.totals.newUsers}
                  sub={`vs ${data.comparison.priorNewUsers} prior`}
                  trend={{
                    value: delta.text,
                    positive: delta.positive,
                    neutral: delta.neutral,
                  }}
                />
              );
            })()}

            {(() => {
              const delta = formatDelta(data.totals.activeUsers, data.comparison.priorActiveUsers);
              return (
                <CompactMetricCard
                  label="Active Users in Window"
                  value={data.totals.activeUsers}
                  sub={`vs ${data.comparison.priorActiveUsers} prior`}
                  trend={{
                    value: delta.text,
                    positive: delta.positive,
                    neutral: delta.neutral,
                  }}
                />
              );
            })()}

            {(() => {
              const delta = formatDelta(data.totals.totalEvents, data.comparison.priorEvents);
              return (
                <CompactMetricCard
                  label="Total Events"
                  value={data.totals.totalEvents.toLocaleString()}
                  sub={`vs ${data.comparison.priorEvents.toLocaleString()} prior`}
                  trend={{
                    value: delta.text,
                    positive: delta.positive,
                    neutral: delta.neutral,
                  }}
                />
              );
            })()}

            {(() => {
              const delta = formatDelta(data.totals.appOpens, data.comparison.priorAppOpens);
              return (
                <CompactMetricCard
                  label="App Launches (Opens)"
                  value={data.totals.appOpens.toLocaleString()}
                  sub={`vs ${data.comparison.priorAppOpens.toLocaleString()} prior`}
                  trend={{
                    value: delta.text,
                    positive: delta.positive,
                    neutral: delta.neutral,
                  }}
                />
              );
            })()}
          </div>

          {/* Tactical Area Progression Curve */}
          <TacticalAreaChart
            title={`Progression Trend (${data.window.periodLabel})`}
            data={data.timeSeries.map((t) => ({
              label: t.label,
              value: t.eventsCount,
            }))}
            metricLabel="Actions"
          />

          {/* Event Taxonomy Donut Chart */}
          <TaxonomyDonutChart
            title="Event Taxonomy Breakdown"
            breakdown={data.eventBreakdown}
            totalEvents={data.totals.totalEvents}
          />
        </>
      )}
    </div>
  );
};
