import React, { useState, useMemo } from 'react';

export interface GridBarItem {
  label: string;
  eventsCount: number;
  sessionsCount?: number;
  activeUsersCount?: number;
  timestamp?: number;
}

export interface GridBarChartProps {
  title?: string;
  data: GridBarItem[];
  maxBlocksPerCol?: number;
}

export const GridBarChart: React.FC<GridBarChartProps> = ({
  title = 'Activity Velocity',
  data,
  maxBlocksPerCol = 7,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Intelligently aggregate if data points exceed 14 to preserve mobile readability
  const displayData = useMemo(() => {
    if (!data || data.length <= 14) return data || [];

    const binSize = Math.ceil(data.length / 12);
    const aggregated: GridBarItem[] = [];

    for (let i = 0; i < data.length; i += binSize) {
      const slice = data.slice(i, i + binSize);
      const eventsCount = slice.reduce((sum, item) => sum + item.eventsCount, 0);
      const sessionsCount = slice.reduce((sum, item) => sum + (item.sessionsCount || 0), 0);
      const maxUsers = Math.max(...slice.map((item) => item.activeUsersCount || 0), 0);
      const label =
        slice.length > 1
          ? `${slice[0].label.slice(0, 5)}`
          : slice[0].label;

      aggregated.push({
        label,
        eventsCount,
        sessionsCount,
        activeUsersCount: maxUsers,
        timestamp: slice[0].timestamp,
      });
    }

    return aggregated;
  }, [data]);

  const totalEvents = useMemo(
    () => displayData.reduce((sum, d) => sum + (d.eventsCount || 0), 0),
    [displayData]
  );

  const peakEvent = useMemo(
    () =>
      displayData.reduce(
        (max, d) => (d.eventsCount > max.eventsCount ? d : max),
        displayData[0] || { eventsCount: 0, label: 'N/A' }
      ),
    [displayData]
  );

  const maxCount = Math.max(1, peakEvent?.eventsCount || 1);

  if (!displayData || displayData.length === 0 || totalEvents === 0) {
    return (
      <div className="section-card grid-bar-card">
        <div className="grid-bar-header">
          <h4 className="card-heading">{title}</h4>
          <span className="grid-bar-total font-mono">0 actions</span>
        </div>
        <div className="chart-empty-state">
          <span className="empty-sub">No activity recorded for this period.</span>
        </div>
      </div>
    );
  }

  // Calculate SVG dimensions
  const colWidth = Math.max(18, Math.min(28, Math.floor(360 / displayData.length) - 6));
  const colGap = 6;
  const blockHeight = 8;
  const blockGap = 3;
  const chartHeight = maxBlocksPerCol * (blockHeight + blockGap);
  const chartWidth = displayData.length * (colWidth + colGap) + colGap;

  return (
    <div className="section-card grid-bar-card">
      <div className="grid-bar-header">
        <div>
          <h4 className="card-heading">{title}</h4>
          <span className="grid-bar-peak font-mono">
            Peak: {peakEvent.eventsCount} ({peakEvent.label})
          </span>
        </div>
        <div className="grid-bar-total-wrap">
          <span className="grid-bar-total-label">TOTAL ACTIONS</span>
          <span className="grid-bar-total-val font-mono">{totalEvents.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid-bar-svg-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 24}`}
          className="grid-bar-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="cellFillGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="cellPeakGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>

          {displayData.map((item, colIdx) => {
            const isHovered = hoveredIdx === colIdx;
            const isPeak = item.eventsCount === peakEvent.eventsCount && peakEvent.eventsCount > 0;
            const fillRatio = item.eventsCount / maxCount;
            const activeBlocks = Math.round(fillRatio * maxBlocksPerCol);
            const x = colGap + colIdx * (colWidth + colGap);

            return (
              <g
                key={colIdx}
                className={`grid-col ${isHovered ? 'grid-col--hover' : ''}`}
                onMouseEnter={() => setHoveredIdx(colIdx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onTouchStart={() => setHoveredIdx(colIdx)}
              >
                {/* Column background hover highlight */}
                {isHovered && (
                  <rect
                    x={x - 2}
                    y={0}
                    width={colWidth + 4}
                    height={chartHeight + 20}
                    fill="rgba(56, 189, 248, 0.08)"
                    rx="3"
                  />
                )}

                {/* Stack of square matrix blocks (bottom to top) */}
                {Array.from({ length: maxBlocksPerCol }, (_, rowIdx) => {
                  const blockFromBottom = rowIdx;
                  const isActive = blockFromBottom < activeBlocks;
                  const y = chartHeight - (rowIdx + 1) * (blockHeight + blockGap);

                  return (
                    <rect
                      key={rowIdx}
                      x={x}
                      y={y}
                      width={colWidth}
                      height={blockHeight}
                      rx="2"
                      fill={
                        isActive
                          ? isPeak
                            ? 'url(#cellPeakGrad)'
                            : 'url(#cellFillGrad)'
                          : 'rgba(255, 255, 255, 0.05)'
                      }
                      className={isActive ? 'cell-active' : 'cell-empty'}
                    />
                  );
                })}

                {/* X-axis label */}
                <text
                  x={x + colWidth / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  className="grid-bar-label font-mono"
                  fill={isHovered ? '#f8fafc' : '#8b949e'}
                  fontSize="8.5"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dynamic Hover Tooltip Bar */}
      <div className="grid-bar-tooltip-bar font-mono">
        {hoveredIdx !== null && displayData[hoveredIdx] ? (
          <div className="tooltip-active">
            <span className="tooltip-point-label">{displayData[hoveredIdx].label}:</span>
            <span className="tooltip-point-events">
              <strong>{displayData[hoveredIdx].eventsCount}</strong> actions
            </span>
            {displayData[hoveredIdx].sessionsCount !== undefined && (
              <span className="tooltip-point-sub">
                • {displayData[hoveredIdx].sessionsCount} sessions
              </span>
            )}
            {displayData[hoveredIdx].activeUsersCount !== undefined && (
              <span className="tooltip-point-sub">
                • {displayData[hoveredIdx].activeUsersCount} active users
              </span>
            )}
          </div>
        ) : (
          <span className="tooltip-idle">Hover or tap any column to inspect interval breakdown</span>
        )}
      </div>
    </div>
  );
};
