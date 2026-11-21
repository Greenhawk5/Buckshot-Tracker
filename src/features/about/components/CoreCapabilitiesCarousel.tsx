import React from 'react';
import { InfiniteCarousel } from './InfiniteCarousel';

export interface CapabilityItem {
  id: string;
  tag: string;
  title: string;
  desc: string;
  accent: 'live' | 'blank' | 'warning' | 'success';
  icon: React.ReactNode;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    id: 'chamber-inventory',
    tag: 'AMMUNITION',
    title: 'Chamber Inventory Tracking',
    desc: 'Real-time counters tracking remaining live and blank rounds with visual ammunition gauges and dynamic reload alerts.',
    accent: 'live',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="4" width="6" height="16" rx="2" fill="currentColor" fillOpacity="0.2" />
        <rect x="13" y="4" width="6" height="16" rx="2" fill="currentColor" fillOpacity="0.2" />
        <line x1="5" y1="9" x2="11" y2="9" />
        <line x1="13" y1="9" x2="19" y2="9" />
      </svg>
    ),
  },
  {
    id: 'probability-intel',
    tag: 'PROBABILITY',
    title: 'Real-Time Odds Computation',
    desc: 'Dynamic percentage computation calculating exact mathematical odds for upcoming live discharges vs blank safe shots on every turn.',
    accent: 'blank',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="3" x2="12" y2="7" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <line x1="3" y1="12" x2="7" y2="12" />
        <line x1="17" y1="12" x2="21" y2="12" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'quick-load',
    tag: 'LOADOUT',
    title: 'Quick-Load & Custom Chambers',
    desc: 'Rapid preset docks for common loadouts (1L/1B, 2L/2B, 3L/2B, 4L/4B) alongside a tactile custom dial supporting up to 16 shells.',
    accent: 'warning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
  },
  {
    id: 'burner-phone',
    tag: 'INTEL',
    title: 'Burner Phone Positional Intel',
    desc: 'Log and track verified shell positions (1st through 8th) revealed through in-game Burner Phone calls with exact type designation.',
    accent: 'blank',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
        <path d="M9 6h6" />
      </svg>
    ),
  },
  {
    id: 'dynamic-advancement',
    tag: 'SEQUENCING',
    title: 'Dynamic Position Advancement',
    desc: 'Automatic sequence shift engine: whenever a shell is fired or racked, all verified future positions advance forward automatically.',
    accent: 'live',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 19 22 12 13 5 13 19" fill="currentColor" fillOpacity="0.2" />
        <polygon points="2 19 11 12 2 5 2 19" fill="currentColor" fillOpacity="0.2" />
      </svg>
    ),
  },
  {
    id: 'beer-ejection',
    tag: 'EJECTION',
    title: 'Beer Can Shell Ejection',
    desc: 'Dedicated tactile action for discarding unspent shells via the in-game Beer Can item, preserving subsequent positional certainty.',
    accent: 'warning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v6" />
        <path d="M9 5l3-3 3 3" />
        <rect x="6" y="9" width="12" height="13" rx="2" />
        <line x1="6" y1="14" x2="18" y2="14" />
      </svg>
    ),
  },
  {
    id: 'undo-history',
    tag: 'ROLLBACK',
    title: 'Full Action History Rollback',
    desc: 'Non-destructive step-by-step undo engine allowing operators to reverse misclicks or mistaken inputs without resetting the session.',
    accent: 'success',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
  },
  {
    id: 'cloud-persistence',
    tag: 'PERSISTENCE',
    title: 'Cloud Session Persistence',
    desc: 'Local-first offline state engine backed by optimistic cloud synchronization to recover active matches across tab reloads or crashes.',
    accent: 'blank',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        <polyline points="12 12 12 16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
];

export const CoreCapabilitiesCarousel: React.FC = () => {
  return (
    <div className="about-section capabilities-section">
      <div className="section-header-row">
        <h3 className="section-title">Core Intelligence Capabilities</h3>
        <span className="section-tag-badge">8 Systems</span>
      </div>
      <p className="section-desc">
        Interactive tactical tools designed for real-time certainty during high-stakes rounds.
      </p>

      <InfiniteCarousel
        items={CAPABILITIES}
        sectionId="core-caps"
        ariaLabel="Core Intelligence Capabilities Carousel"
        autoplayInterval={4200}
        renderItem={(item) => (
          <div className={`capability-card capability-card--${item.accent}`}>
            <div className="capability-card-header">
              <span className={`capability-tag capability-tag--${item.accent}`}>
                {item.tag}
              </span>
              <div className={`capability-icon capability-icon--${item.accent}`}>
                {item.icon}
              </div>
            </div>

            <h4 className="capability-title">{item.title}</h4>
            <p className="capability-desc">{item.desc}</p>

            <div className="capability-footer">
              <span className="capability-status-dot" />
              <span className="capability-status-text">Active Tactical Capability</span>
            </div>
          </div>
        )}
      />
    </div>
  );
};

