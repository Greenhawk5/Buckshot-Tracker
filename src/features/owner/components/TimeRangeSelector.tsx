import React, { useState } from 'react';

export interface TimeRangeSelectorProps {
  preset: string;
  onChangePreset: (preset: string) => void;
  onRefresh?: () => void;
  includeCustom?: boolean;
  loading?: boolean;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  preset,
  onChangePreset,
  onRefresh,
  includeCustom = false,
  loading = false,
}) => {
  const [refreshSpinning, setRefreshSpinning] = useState(false);

  const presets = ['24h', '7d', '30d', '90d', '180d', '365d'];
  if (includeCustom) {
    presets.push('custom');
  }

  const handlePresetClick = (p: string) => {
    if (p === preset) return;
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    onChangePreset(p);
  };

  const handleRefreshClick = () => {
    if (loading || refreshSpinning) return;
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    setRefreshSpinning(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      setRefreshSpinning(false);
    }, 600);
  };

  return (
    <div className="view-toolbar time-range-selector">
      <div className="period-chips" role="radiogroup" aria-label="Time period preset">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={preset === p}
            className={`period-chip ${preset === p ? 'active' : ''}`}
            onClick={() => handlePresetClick(p)}
          >
            {p === 'custom' ? 'Custom' : p.toUpperCase()}
          </button>
        ))}
      </div>
      {onRefresh && (
        <button
          type="button"
          className={`refresh-btn ${refreshSpinning || loading ? 'is-spinning' : ''}`}
          onClick={handleRefreshClick}
          disabled={loading || refreshSpinning}
          title="Refresh telemetry"
          aria-label="Refresh telemetry"
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
      )}
    </div>
  );
};

