import React, { useEffect, useState } from 'react';
import { fetchOwnerSettings, updateOwnerSettings } from '../../../services/owner.api';
import { TacticalSwitch } from '../components/TacticalSwitch';

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
      setStatusMsg('Settings successfully updated and logged to audit trail.');
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      alert(err?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-loading" role="status">
        <span className="loading-pulse-dot" /> Loading settings...
      </div>
    );
  }

  return (
    <div className="owner-view settings-view">
      <div className="view-toolbar">
        <div>
          <h3 className="view-title">System Settings & Controls</h3>
          <p className="view-desc">
            Server-authoritative configurations. Every modification is logged to administrative audit trail.
          </p>
        </div>
      </div>

      {statusMsg && <div className="status-success-banner">{statusMsg}</div>}

      <form onSubmit={handleSave} className="settings-form">
        {/* Maintenance Mode */}
        <div className="setting-card">
          <div className="setting-header">
            <div>
              <span className="setting-title">Maintenance Mode</span>
              <p className="setting-desc">
                When active, regular users see a maintenance lock notice upon opening the application.
              </p>
            </div>
            <TacticalSwitch
              checked={Boolean(settings.maintenanceMode)}
              onChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              id="switch-maintenance-mode"
            />
          </div>
          <div className="setting-sub-control">
            <label className="form-label">Maintenance Announcement Notice</label>
            <input
              type="text"
              className="form-input"
              value={settings.maintenanceMessage || ''}
              onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
              placeholder="e.g. System maintenance in progress. Expected return: 20 mins."
            />
          </div>
        </div>

        {/* Global Broadcast Pause */}
        <div className="setting-card">
          <div className="setting-header">
            <div>
              <span className="setting-title">Global Broadcast Pause</span>
              <p className="setting-desc">
                Emergency breaker to immediately freeze all outgoing broadcast batches across all active campaigns.
              </p>
            </div>
            <TacticalSwitch
              checked={Boolean(settings.globalBroadcastPaused)}
              onChange={(checked) => setSettings({ ...settings, globalBroadcastPaused: checked })}
              id="switch-broadcast-pause"
            />
          </div>
        </div>

        {/* In-App Announcement Banner */}
        <div className="setting-card">
          <div className="setting-header">
            <div>
              <span className="setting-title">In-App Announcement Banner</span>
              <p className="setting-desc">Display an informational banner across the main tracker interface.</p>
            </div>
            <TacticalSwitch
              checked={Boolean(settings.announcementActive)}
              onChange={(checked) => setSettings({ ...settings, announcementActive: checked })}
              id="switch-announcement-banner"
            />
          </div>
          <div className="setting-sub-control">
            <label className="form-label">Announcement Banner Content</label>
            <input
              type="text"
              className="form-input"
              value={settings.announcementBanner || ''}
              onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
              placeholder="e.g. Tournament event starting this weekend!"
            />
          </div>
        </div>

        {/* Pacing Delay */}
        <div className="setting-card">
          <div className="setting-header">
            <div>
              <span className="setting-title">Broadcast Inter-Send Pacing (ms)</span>
              <p className="setting-desc">
                Delay between outgoing messages to respect Telegram rate limits (default: 100ms).
              </p>
            </div>
          </div>
          <div className="setting-sub-control">
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
        </div>

        <button type="submit" className="btn-primary btn-save-settings" disabled={saving}>
          {saving ? 'Saving...' : 'Save System Settings'}
        </button>
      </form>
    </div>
  );
};
