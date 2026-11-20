import React, { useState } from 'react';
import './AboutPage.css';
import botLogo from '../../assets/logo.png';
import { APP_CONFIG } from '../../config/app.config';
import { ProjectLinks } from './components/ProjectLinks';
import { TechnologyStack } from './components/TechnologyStack';
import { BuildInformation } from './components/BuildInformation';
import { FeedbackModal } from './components/FeedbackModal';

interface AboutPageProps {
  onClose: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onClose }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="about-page">
      <header className="about-header">
        <button
          type="button"
          className="about-back-btn"
          onClick={onClose}
          aria-label="Back to Ammunition Tracker"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back</span>
        </button>
        <h2 className="about-header-title">About Buckshot Tracker</h2>
        <div className="header-spacer" />
      </header>

      <main className="about-content">
        {/* Product Identity */}
        <section className="about-hero">
          <img src={botLogo} alt="Buckshot Tracker Logo" className="hero-logo" />
          <h1 className="hero-title">{APP_CONFIG.name}</h1>
          <p className="hero-subtitle">{APP_CONFIG.subtitle}</p>
          <div className="hero-badge-row">
            <span className="hero-badge">Single-Player Companion</span>
            <span className="hero-badge">v{APP_CONFIG.version}</span>
            <span className="hero-badge hero-badge--live">Tactical Intelligence</span>
          </div>
        </section>

        {/* Project Overview */}
        <section className="about-section">
          <h3 className="section-title">Tactical Purpose</h3>
          <p className="section-prose">
            Buckshot Tracker is an advanced tactical companion engineered for single-player
            Buckshot Roulette matches. Designed to eliminate guesswork, it computes live and blank
            shot probabilities in real time, maintains positional intelligence derived from Burner
            Phone calls, dynamically advances upcoming shells upon firing or Beer Can ejections, and
            persists match state across sessions.
          </p>
        </section>

        {/* Core Capabilities */}
        <section className="about-section">
          <h3 className="section-title">Core Intelligence Capabilities</h3>
          <ul className="features-list">
            {APP_CONFIG.coreFeatures.map((feat, idx) => (
              <li key={idx} className="feature-item">
                <span className="feature-check">✓</span>
                <span className="feature-text">{feat}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Technology Stack */}
        <TechnologyStack />

        {/* Developer & Project Links */}
        <ProjectLinks />

        {/* Build & Release Info */}
        <BuildInformation />

        {/* Feedback Action Section */}
        <section className="about-section feedback-cta-section">
          <div className="feedback-cta-card">
            <div className="feedback-cta-text">
              <h4 className="feedback-cta-title">Have feedback or encountered a bug?</h4>
              <p className="feedback-cta-desc">
                Help improve Buckshot Tracker by submitting a report directly to the creator.
              </p>
            </div>
            <button
              type="button"
              className="feedback-cta-btn"
              onClick={() => setShowFeedback(true)}
            >
              Send Feedback
            </button>
          </div>
        </section>
      </main>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
};
