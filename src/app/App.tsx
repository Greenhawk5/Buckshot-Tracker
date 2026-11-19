import React from 'react';
import './app.css';
import { useTelegram } from '../hooks/useTelegram';

export const App: React.FC = () => {
  const { user, isTelegram } = useTelegram();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <div>
            <h1 className="brand-title">Buckshot Counter</h1>
            <span className="brand-subtitle">Shotgun Shell Tracker</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: '999px',
            background: isTelegram ? 'var(--color-surface-raised)' : '#261a1a',
            color: isTelegram ? 'var(--color-success)' : 'var(--color-warning)',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-mono)'
          }}>
            {isTelegram ? (user?.first_name || 'TELEGRAM') : 'STANDALONE'}
          </span>
        </div>
      </header>

      <main className="app-main">
        {/* Placeholder shell: Phase 2 will render Setup, Active, Completed screens */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
            FOUNDATION READY
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            React + TypeScript + Vite initialized.
          </p>
        </div>
      </main>
    </div>
  );
};
