import React from 'react';

export interface CompactMetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: 'default' | 'primary' | 'active' | 'warning' | 'success';
  trend?: {
    value: string | number;
    positive?: boolean;
    neutral?: boolean;
  };
  icon?: React.ReactNode;
}

export const CompactMetricCard: React.FC<CompactMetricCardProps> = ({
  label,
  value,
  sub,
  variant = 'default',
  trend,
  icon,
}) => {
  const variantClass = variant !== 'default' ? `metric-card--${variant}` : '';

  return (
    <div className={`metric-card compact-metric-card ${variantClass}`}>
      <div className="compact-metric-header">
        <span className="metric-label">{label}</span>
        {icon && <span className="compact-metric-icon">{icon}</span>}
      </div>
      <div className="compact-metric-body">
        <span className="metric-value font-mono">{value}</span>
        {trend && (
          <span
            className={`metric-trend ${
              trend.neutral
                ? 'trend--neutral'
                : trend.positive
                ? 'trend--positive'
                : 'trend--negative'
            }`}
          >
            {trend.positive ? '↑' : trend.neutral ? '•' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {sub && <span className="metric-sub">{sub}</span>}
    </div>
  );
};

