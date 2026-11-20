import React, { useEffect, useState } from 'react';
import { fetchOwnerSettings, updateOwnerSettings } from '../../../services/owner.api';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchOwnerSettings();
      setSettings(res.settings);
    } catch (err: any) {
      alert(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await updateOwnerSettings(settings);
      setSettings(res.settings);
      setStatusMsg('Settings successfully updated and audited.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="owner-loading">Loading settings...</div>;

  return (
    <div className="owner-view settings-view">
      <h3 className="view-title">System Settings & Feature Controls</h3>
      <p className="view-desc">
        Server-authoritative configurations. Every modification is logged to administrative audit trail.
      </p>

      {statusMsg && <div className="status-success-banner">{statusMsg}</div>}

      <form onSubmit={handleSave} className="settings-form">
        {/* Maintenance Mode */}
        <div className="setting-card">
          <div className="setting-header">
            <span className="setting-title">Maintenance Mode</span>
            <input
              type="checkbox"
              className="setting-checkbox"
              checked={Boolean(settings.maintenanceMode)}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            />
          </div>
          <p className="setting-desc">
            When enabled, users will see a maintenance notice upon opening the application.
          </p>
          <input
            type="text"
            className="form-input"
            value={settings.maintenanceMessage || ''}
            onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
            placeholder="Maintenance announcement message..."
          />
        </div>

        {/* Global Broadcast Pause */}
        <div className="setting-card">
          <div className="setting-header">
            <span className="setting-title">Global Broadcast Pause</span>
            <input
              type="checkbox"
              className="setting-checkbox"
              checked={Boolean(settings.globalBroadcastPaused)}
              onChange={(e) => setSettings({ ...settings, globalBroadcastPaused: e.target.checked })}
            />
          </div>
          <p className="setting-desc">
            Emergency switch to freeze all outgoing broadcast batches across all active campaigns.
          </p>
        </div>

        {/* In-App Announcement Banner */}
        <div className="setting-card">
          <div className="setting-header">
            <span className="setting-title">Announcement Banner</span>
            <input
              type="checkbox"
              className="setting-checkbox"
              checked={Boolean(settings.announcementActive)}
              onChange={(e) => setSettings({ ...settings, announcementActive: e.target.checked })}
            />
          </div>
          <p className="setting-desc">Display an informational banner across the main tracker header.</p>
          <input
            type="text"
            className="form-input"
            value={settings.announcementBanner || ''}
            onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
            placeholder="e.g. Tournament event starting this weekend!"
          />
        </div>

        {/* Pacing Delay */}
        <div className="setting-card">
          <span className="setting-title">Broadcast Inter-Send Pacing (ms)</span>
          <p className="setting-desc">
            Delay between outgoing messages to respect Telegram limits (default: 100ms).
          </p>
          <input
            type="number"
            min="20"
            max="2000"
            step="10"
            className="form-input font-mono"
            value={settings.defaultBroadcastPacingMs ?? 100}
            onChange={(e) =>
              setSettings({ ...settings, defaultBroadcastPacingMs: Number(e.target.value) })
            }
          />
        </div>

        <button type="submit" className="btn-primary btn-save-settings" disabled={saving}>
          {saving ? 'Saving...' : 'Save System Settings'}
        </button>
      </form>
    </div>
  );
};

