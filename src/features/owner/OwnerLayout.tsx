import React, { useState } from 'react';
import './OwnerLayout.css';
import { OwnerNav } from './components/OwnerNav';
import { OverviewView } from './views/OverviewView';
import { AnalyticsView } from './views/AnalyticsView';
import { UsersView } from './views/UsersView';
import { BroadcastsView } from './views/BroadcastsView';
import { HealthView } from './views/HealthView';
import { SettingsView } from './views/SettingsView';
import { AuditView } from './views/AuditView';
import { FeedbackView } from './views/FeedbackView';
import { ExportsView } from './views/ExportsView';
import { APP_CONFIG } from '../../config/app.config';

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

  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const ownerId = user?.id ? String(user.id) : APP_CONFIG.ownerTelegramId;

  const handleBack = () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    onClose();
  };

  return (
    <div className="owner-layout">
      {/* Top Header */}
      <header className="owner-header">
        <div className="owner-header-left">
          <button
            type="button"
            className="owner-back-btn"
            onClick={handleBack}
            aria-label="Exit Command Center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Tracker</span>
          </button>
          <div className="owner-brand">
            <span className="owner-title">COMMAND CENTER</span>
            <span className="owner-badge font-mono">OWNER ID: {ownerId}</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar with Circular Infinite Scroll */}
      <OwnerNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main View Area */}
      <main className="owner-main-body" role="region" aria-label="Command Center Content">
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
