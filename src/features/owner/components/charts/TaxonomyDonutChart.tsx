import React, { useState } from 'react';

const CATEGORY_COLORS: Record<string, string> = {
  shot_recorded: '#ef4444', // Action red
  app_opened: '#38bdf8', // Cyan
  session_created: '#10b981', // Emerald
  shell_intel_added: '#f59e0b', // Amber
  shell_ejected: '#818cf8', // Indigo
  undo_executed: '#ec4899', // Pink
};

const DEFAULT_COLORS = ['#6366f1', '#14b8a6', '#f97316', '#a855f7', '#64748b'];

export interface TaxonomyDonutChartProps {
  breakdown: Record<string, number>;
  totalEvents?: number;
  title?: string;
}

export const TaxonomyDonutChart: React.FC<TaxonomyDonutChartProps> = ({
  breakdown,
  totalEvents,
  title = 'Event Taxonomy Breakdown',
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const entries = Object.entries(breakdown || {}).filter(([_, count]) => count > 0);
  const calculatedTotal =
    totalEvents ?? entries.reduce((sum, [_, count]) => sum + count, 0);

  if (entries.length === 0 || calculatedTotal === 0) {
    return (
      <div className="section-card donut-card">
        <h4 className="card-heading">{title}</h4>
        <div className="chart-empty-state">
          <span className="empty-sub">No event taxonomy data in this interval.</span>
        </div>
      </div>
    );
  }

  // SVG parameters
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 62;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  // Compute slice offsets
  let accumulatedOffset = 0;
  const slices = entries.map(([key, count], index) => {
    const fraction = count / calculatedTotal;
    const strokeDash = fraction * circumference;
    const offset = accumulatedOffset;
    accumulatedOffset += strokeDash;

    const color =
      CATEGORY_COLORS[key] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

    return {
      key,
      count,
      fraction,
      percentage: Math.round(fraction * 100),
      strokeDash,
      offset,
      color,
    };
  });

  const activeSlice = hoveredKey
    ? slices.find((s) => s.key === hoveredKey)
    : null;

  return (
    <div className="section-card donut-card">
      <h4 className="card-heading">{title}</h4>

      <div className="donut-content-layout">
        <div className="donut-svg-wrap">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="donut-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background ring */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slices.map((slice) => {
              const isHovered = hoveredKey === slice.key;
              return (
                <circle
                  key={slice.key}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${slice.strokeDash} ${
                    circumference - slice.strokeDash
                  }`}
                  strokeDashoffset={-slice.offset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  className={`donut-segment ${
                    isHovered ? 'donut-segment--hover' : ''
                  }`}
                  onMouseEnter={() => setHoveredKey(slice.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onTouchStart={() => setHoveredKey(slice.key)}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="donut-center-info">
            <span className="donut-center-val font-mono">
              {activeSlice
                ? activeSlice.count.toLocaleString()
                : calculatedTotal.toLocaleString()}
            </span>
            <span className="donut-center-label">
              {activeSlice
                ? `${activeSlice.percentage}%`
                : 'TOTAL ACTIONS'}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="donut-legend-list">
          {slices.map((slice) => {
            const isHovered = hoveredKey === slice.key;
            return (
              <div
                key={slice.key}
                className={`donut-legend-item ${
                  isHovered ? 'donut-legend-item--hover' : ''
                }`}
                onMouseEnter={() => setHoveredKey(slice.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onTouchStart={() => setHoveredKey(slice.key)}
              >
                <span
                  className="legend-color-dot"
                  style={{ backgroundColor: slice.color }}
                />
                <div className="legend-label-wrap">
                  <span className="legend-name font-mono">{slice.key}</span>
                  <span className="legend-stats font-mono">
                    {slice.count} ({slice.percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

