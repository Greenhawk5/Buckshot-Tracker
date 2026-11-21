import React, { useState } from 'react';

export interface CustomDateRangePickerProps {
  onApply: (startMs: number, endMs: number) => void;
  loading?: boolean;
}

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  onApply,
  loading = false,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isFutureDate = endDate && endDate > todayStr;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!startDate || !endDate) {
      setValidationError('Please select both start and end dates.');
      return;
    }

    if (startDate > endDate) {
      setValidationError('Start date must be before or equal to end date.');
      return;
    }

    // Convert to start of day in local/UTC and end of day in UTC
    const startMs = new Date(`${startDate}T00:00:00.000Z`).getTime();
    const endMs = new Date(`${endDate}T23:59:59.999Z`).getTime();

    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    onApply(startMs, endMs);
  };

  return (
    <form onSubmit={handleSubmit} className="custom-range-card">
      <div className="custom-range-header">
        <span className="custom-range-title">Custom Telemetry Window</span>
        {isFutureDate && (
          <span className="future-notice-badge">
            Future interval: telemetry will be zero for upcoming dates
          </span>
        )}
      </div>

      <div className="custom-range-inputs">
        <div className="date-input-group">
          <label className="date-input-label">FROM (UTC)</label>
          <input
            type="date"
            className="form-input date-picker-input"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setValidationError(null);
            }}
            max={todayStr}
            required
          />
        </div>

        <span className="date-range-divider">→</span>

        <div className="date-input-group">
          <label className="date-input-label">TO (UTC)</label>
          <input
            type="date"
            className="form-input date-picker-input"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setValidationError(null);
            }}
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary custom-range-apply-btn"
          disabled={loading || !startDate || !endDate}
        >
          {loading ? 'Querying...' : 'Apply Range'}
        </button>
      </div>

      {validationError && (
        <div className="custom-range-error font-mono">{validationError}</div>
      )}
    </form>
  );
};

