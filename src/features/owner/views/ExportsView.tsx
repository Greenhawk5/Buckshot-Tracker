import React, { useState } from 'react';
import { exportOwnerReport } from '../../../services/owner.api';

export const ExportsView: React.FC = () => {
  const [type, setType] = useState('users');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setDownloadSuccess(null);
    try {
      const res = await exportOwnerReport(type, format);
      // Trigger browser download via Blob
      const mimeType = format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;';
      const blob = new Blob([res.content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(`Exported ${res.rowCount} rows as ${res.filename}`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate report export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="owner-view exports-view">
      <h3 className="view-title">Export Telemetry & Operational Data</h3>
      <p className="view-desc">
        Download sanitized CSV or JSON exports. CSV output includes automated spreadsheet formula
        injection neutralization (=, +, -, @).
      </p>

      {downloadSuccess && <div className="status-success-banner">{downloadSuccess}</div>}

      <div className="section-card export-card">
        <label className="form-label">Select Report Dataset</label>
        <div className="dataset-grid">
          {[
            { id: 'users', label: 'Registered Users', desc: 'Observed Telegram profiles, timestamps, VIP/restriction status' },
            { id: 'events', label: 'Activity Events', desc: 'Raw chronological application events and bounded metadata' },
            { id: 'sessions', label: 'Tracker Sessions', desc: 'Game tracking sessions, initial/remaining counts, outcomes' },
            { id: 'campaigns', label: 'Broadcast Campaigns', desc: 'Historical campaigns, delivery statistics, and timestamps' },
            { id: 'audit', label: 'Administrative Audit Logs', desc: 'Immutable security log of all sensitive owner operations' },
            { id: 'feedback', label: 'Feedback & Bug Reports', desc: 'User submissions, categories, and resolution notes' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dataset-card ${type === item.id ? 'active' : ''}`}
              onClick={() => setType(item.id)}
            >
              <span className="dataset-title">{item.label}</span>
              <span className="dataset-desc">{item.desc}</span>
            </button>
          ))}
        </div>

        <label className="form-label">Export Format</label>
        <div className="category-chips">
          <button
            type="button"
            className={`category-chip ${format === 'csv' ? 'active' : ''}`}
            onClick={() => setFormat('csv')}
          >
            CSV (Spreadsheet Compatible)
          </button>
          <button
            type="button"
            className={`category-chip ${format === 'json' ? 'active' : ''}`}
            onClick={() => setFormat('json')}
          >
            JSON (Machine Readable)
          </button>
        </div>

        <button
          type="button"
          className="btn-primary btn-download"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? 'Generating Export...' : `Download ${type.toUpperCase()} Report (${format.toUpperCase()})`}
        </button>
      </div>
    </div>
  );
};

