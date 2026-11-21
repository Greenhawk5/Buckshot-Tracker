import React from 'react';
import { InfiniteCarousel } from './InfiniteCarousel';

export interface TechItem {
  id: string;
  name: string;
  role: string;
  desc: string;
  brandColor: string;
  icon: React.ReactNode;
}

const TECH_ITEMS: TechItem[] = [
  {
    id: 'react',
    name: 'React 19',
    role: 'Reactive UI Framework',
    desc: 'High-performance component architecture powering zero-latency real-time state updates, haptic triggers, and immediate tactical screen transitions.',
    brandColor: '#61dafb',
    icon: (
      <svg viewBox="-11.5 -10.23174 23 20.46348" width="40" height="40" fill="none">
        <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
        <g stroke="#61dafb" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    ),
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    role: 'Type Safety & API Contracts',
    desc: 'Strict end-to-end type safety spanning match simulation state, session persistence schemas, and Telegram Serverless endpoint contracts.',
    brandColor: '#3178c6',
    icon: (
      <svg viewBox="0 0 32 32" width="40" height="40">
        <rect width="32" height="32" rx="6" fill="#3178c6" />
        <path
          d="M12.2 13.5v11.5h-2.5V13.5H5.8v-2.3h10.3v2.3h-3.9zm6.1 5.4c1.1-.7 2.2-1.2 3.4-1.2 1.4 0 2.2.7 2.2 1.7 0 1-.9 1.6-2.5 2.2-2.3.9-3.7 2-3.7 4 0 2.4 1.9 4 4.7 4 1.6 0 3-.5 3.9-1.2l-.7-2.1c-.8.6-1.9 1-3.1 1-1.4 0-2.3-.7-2.3-1.8 0-1.1 1-1.7 2.7-2.3 2.3-.8 3.5-2.1 3.5-3.9 0-2.3-1.8-3.9-4.5-3.9-1.5 0-2.9.4-3.9 1l.3 2.5z"
          fill="#ffffff"
        />
      </svg>
    ),
  },
  {
    id: 'vite',
    name: 'Vite',
    role: 'Bundler & Asset Engine',
    desc: 'Modern build pipeline generating ultra-compact, tree-shaken static assets optimized for lightning-fast loads inside mobile webviews.',
    brandColor: '#bd34fe',
    icon: (
      <svg viewBox="0 0 32 32" width="40" height="40">
        <defs>
          <linearGradient id="vite-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#41d1ff" />
            <stop offset="100%" stopColor="#bd34fe" />
          </linearGradient>
          <linearGradient id="vite-grad-b" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffea83" />
            <stop offset="100%" stopColor="#ffdd35" />
          </linearGradient>
        </defs>
        <path d="M29.6 5.8l-13 23.3a.8.8 0 01-1.4 0L2.2 5.8a.8.8 0 01.7-1.2l12.4 2.2L28.9 4.6a.8.8 0 01.7 1.2z" fill="url(#vite-grad-a)" />
        <path d="M20.9 4.8L11.5 6.6l-1.3 6.9 3.8-.7-2.3 8.3 9.4-11.2-4.1.7 3.9-5.8z" fill="url(#vite-grad-b)" />
      </svg>
    ),
  },
  {
    id: 'telegram-miniapps',
    name: 'Telegram Mini Apps',
    role: 'Native Client Platform & Haptics',
    desc: 'Deep platform integration utilizing official Telegram WebApp SDK for native mobile haptic feedback, safe-area adaptation, and theme syncing.',
    brandColor: '#24A1DE',
    icon: (
      <svg viewBox="0 0 32 32" width="40" height="40">
        <circle cx="16" cy="16" r="16" fill="#24A1DE" />
        <path
          d="M7.4 15.5l14-5.4c.6-.2 1.2.2 1 .8l-2.4 11.3c-.2.8-.7 1-1.3.6l-3.7-2.7-1.8 1.7c-.2.2-.4.4-.8.4l.3-3.8 6.9-6.2c.3-.3 0-.4-.3-.2l-8.6 5.4-3.7-1.2c-.8-.2-.8-.8.1-1.1z"
          fill="#ffffff"
        />
      </svg>
    ),
  },
  {
    id: 'telegram-serverless',
    name: 'Telegram Serverless',
    role: 'V8 Isolated Cloud Backend',
    desc: 'Serverless runtime executing JavaScript in isolated V8 environments with cryptographically verified initData authentication and zero infrastructure overhead.',
    brandColor: '#f59e0b',
    icon: (
      <svg viewBox="0 0 32 32" width="40" height="40">
        <rect width="32" height="32" rx="6" fill="#1b1e25" stroke="#f59e0b" strokeWidth="1.5" />
        <path
          d="M9 13.5c0-2.5 2-4.5 4.5-4.5 1.8 0 3.3 1 4 2.5 1-.6 2.3-.5 3.2.3.8.7 1.3 1.8 1.3 2.9 1.2.3 2 1.4 2 2.6 0 1.5-1.2 2.7-2.7 2.7H10.5C8.6 20 7 18.4 7 16.5c0-1.7 1.2-3 2-3z"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
        <path d="M15 13l-2 5h3l-1 4 4-6h-3l1-3z" fill="#f59e0b" />
      </svg>
    ),
  },
  {
    id: 'sqlite-wal',
    name: 'SQLite (WAL)',
    role: 'Durable Zero-Latency Storage',
    desc: 'Embedded relational database configured with Write-Ahead Logging for high-concurrency match state persistence and atomic transaction safety.',
    brandColor: '#003b57',
    icon: (
      <svg viewBox="0 0 32 32" width="40" height="40">
        <defs>
          <linearGradient id="sql-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#003b57" />
            <stop offset="100%" stopColor="#0f5a82" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="6" fill="url(#sql-grad)" stroke="#38bdf8" strokeWidth="1" />
        <ellipse cx="16" cy="10" rx="9" ry="3.5" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M7 10v6c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5v-6" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M7 16v6c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5v-6" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export const TechnologyStack: React.FC = () => {
  return (
    <div className="about-section tech-section">
      <div className="section-header-row">
        <h3 className="section-title">Technology Stack</h3>
        <span className="section-tag-badge">Architecture</span>
      </div>
      <p className="section-desc">
        Industrial-grade software engineering designed for zero-latency mobile execution and offline resilience.
      </p>

      <InfiniteCarousel
        items={TECH_ITEMS}
        sectionId="tech-stack"
        ariaLabel="Technology Stack Carousel"
        autoplayInterval={4600}
        renderItem={(item) => (
          <div
            className="tech-slide-card"
            style={{
              borderColor: `${item.brandColor}33`,
            }}
          >
            <div className="tech-slide-header">
              <div
                className="tech-slide-icon"
                style={{
                  boxShadow: `0 0 20px ${item.brandColor}26`,
                }}
              >
                {item.icon}
              </div>
              <div className="tech-slide-meta">
                <span className="tech-slide-name">{item.name}</span>
                <span
                  className="tech-slide-role"
                  style={{ color: item.brandColor }}
                >
                  {item.role}
                </span>
              </div>
            </div>

            <p className="tech-slide-desc">{item.desc}</p>

            <div className="tech-slide-footer">
              <span
                className="tech-engine-badge"
                style={{
                  background: `${item.brandColor}18`,
                  color: item.brandColor,
                  borderColor: `${item.brandColor}40`,
                }}
              >
                Verified Stack Component
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
};
