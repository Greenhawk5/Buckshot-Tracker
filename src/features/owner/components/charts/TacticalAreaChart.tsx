import React, { useState, useMemo } from 'react';

export interface TacticalAreaPoint {
  label: string;
  value: number;
}

export interface TacticalAreaChartProps {
  title?: string;
  data: TacticalAreaPoint[];
  metricLabel?: string;
}

export const TacticalAreaChart: React.FC<TacticalAreaChartProps> = ({
  title = 'Progression Trend',
  data,
  metricLabel = 'Actions',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Intelligently aggregate if data points exceed 14
  const displayData = useMemo(() => {
    if (!data || data.length <= 14) return data || [];

    const binSize = Math.ceil(data.length / 12);
    const aggregated: TacticalAreaPoint[] = [];

    for (let i = 0; i < data.length; i += binSize) {
      const slice = data.slice(i, i + binSize);
      const totalVal = slice.reduce((sum, item) => sum + item.value, 0);
      aggregated.push({
        label: slice[0].label,
        value: totalVal,
      });
    }

    return aggregated;
  }, [data]);

  const values = useMemo(() => displayData.map((d) => d.value), [displayData]);
  const maxValue = useMemo(() => Math.max(1, ...values), [values]);
  const totalValue = useMemo(() => values.reduce((sum, v) => sum + v, 0), [values]);

  if (!displayData || displayData.length === 0 || totalValue === 0) {
    return (
      <div className="section-card tactical-area-card">
        <h4 className="card-heading">{title}</h4>
        <div className="chart-empty-state">
          <span className="empty-sub">No progression data recorded for this window.</span>
        </div>
      </div>
    );
  }

  // SVG coordinate system
  const width = 460;
  const height = 120;
  const padLeft = 24;
  const padRight = 16;
  const padTop = 14;
  const padBottom = 22;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const points = displayData.map((d, i) => {
    const x =
      padLeft + (displayData.length > 1 ? (i / (displayData.length - 1)) * chartW : chartW / 2);
    const y = padTop + chartH - (d.value / maxValue) * chartH;
    return { x, y, ...d };
  });

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    linePath += ` L ${points[i].x} ${points[i].y}`;
  }

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    padTop + chartH
  } L ${points[0].x} ${padTop + chartH} Z`;

  return (
    <div className="section-card tactical-area-card">
      <div className="area-chart-header">
        <div>
          <h4 className="card-heading">{title}</h4>
          <span className="area-chart-metric-tag font-mono">
            Peak: {maxValue.toLocaleString()} {metricLabel.toLowerCase()}
          </span>
        </div>
        <span className="area-chart-total font-mono">
          {totalValue.toLocaleString()} {metricLabel.toLowerCase()}
        </span>
      </div>

      <div className="area-chart-svg-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="tactical-area-svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="tacticalAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (33%, 66%, 100%) */}
          {[0.33, 0.66, 1].map((pct) => {
            const y = padTop + chartH - pct * chartH;
            return (
              <line
                key={pct}
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#tacticalAreaGrad)" />

          {/* Stroke line */}
          <path
            d={linePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point circles & hover targets */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onTouchStart={() => setHoveredIdx(i)}
                className="area-point-group"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="12"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 4.5 : 2.5}
                  fill={isHovered ? '#38bdf8' : '#0f172a'}
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  className="area-point-dot"
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          {points.length > 0 && (
            <>
              <text
                x={points[0].x}
                y={height - 4}
                textAnchor="start"
                className="axis-label font-mono"
                fill="#8b949e"
                fontSize="8.5"
              >
                {points[0].label}
              </text>
              {points.length > 2 && (
                <text
                  x={points[Math.floor(points.length / 2)].x}
                  y={height - 4}
                  textAnchor="middle"
                  className="axis-label font-mono"
                  fill="#8b949e"
                  fontSize="8.5"
                >
                  {points[Math.floor(points.length / 2)].label}
                </text>
              )}
              {points.length > 1 && (
                <text
                  x={points[points.length - 1].x}
                  y={height - 4}
                  textAnchor="end"
                  className="axis-label font-mono"
                  fill="#8b949e"
                  fontSize="8.5"
                >
                  {points[points.length - 1].label}
                </text>
              )}
            </>
          )}
        </svg>
      </div>

      {/* Tooltip bar */}
      <div className="area-chart-tooltip font-mono">
        {hoveredIdx !== null && displayData[hoveredIdx] ? (
          <span className="tooltip-active">
            {displayData[hoveredIdx].label}:{' '}
            <strong>{displayData[hoveredIdx].value.toLocaleString()}</strong>{' '}
            {metricLabel.toLowerCase()}
          </span>
        ) : (
          <span className="tooltip-idle">
            Hover or tap curve nodes for exact interval values
          </span>
        )}
      </div>
    </div>
  );
};
