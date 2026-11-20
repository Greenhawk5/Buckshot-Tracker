import React, { useState } from 'react';
import './OwnerLayout.css';
import { OverviewView } from './views/OverviewView';
import { AnalyticsView } from './views/AnalyticsView';
import { UsersView } from './views/UsersView';
import { BroadcastsView } from './views/BroadcastsView';
import { HealthView } from './views/HealthView';
import { SettingsView } from './views/SettingsView';
import { AuditView } from './views/AuditView';
import { FeedbackView } from './views/FeedbackView';
import { ExportsView } from './views/ExportsView';

interface OwnerLayoutProps {
  onClose: () => void;
}

export type OwnerTab =
  | 'overview'
  | 'analytics'
  | 'users'
  | 'broadcasts'
  | 'health'
  | 'settings'
  | 'audit'
  | 'feedback'
  | 'exports';

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');

  const tabs: Array<{ id: OwnerTab; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'broadcasts', label: 'Broadcasts', icon: '📢' },
    { id: 'health', label: 'System Health', icon: '🩺' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'audit', label: 'Audit Logs', icon: '🛡️' },
    { id: 'feedback', label: 'Feedback', icon: '💬' },
    { id: 'exports', label: 'Reports Export', icon: '📁' },
  ];

  return (
    <div className="owner-layout">
      {/* Top Header */}
      <header className="owner-header">
        <div className="owner-header-left">
          <button type="button" className="owner-back-btn" onClick={onClose} aria-label="Exit Command Center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Tracker</span>
          </button>
          <div className="owner-brand">
            <span className="owner-title">COMMAND CENTER</span>
            <span className="owner-badge">OWNER ID: 184202422</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <nav className="owner-nav-tabs">
        <div className="nav-tabs-scroll">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-tab-icon">{tab.icon}</span>
              <span className="nav-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main View Area */}
      <main className="owner-main-body">
        {activeTab === 'overview' && <OverviewView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'users' && <UsersView />}
        {activeTab === 'broadcasts' && <BroadcastsView />}
        {activeTab === 'health' && <HealthView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'audit' && <AuditView />}
        {activeTab === 'feedback' && <FeedbackView />}
        {activeTab === 'exports' && <ExportsView />}
      </main>
    </div>
  );
};

