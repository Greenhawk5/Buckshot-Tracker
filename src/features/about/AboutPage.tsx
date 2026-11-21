import React, { useState } from 'react';
import './AboutPage.css';
import botLogo from '../../assets/logo.png';
import { APP_CONFIG } from '../../config/app.config';
import { CoreCapabilitiesCarousel } from './components/CoreCapabilitiesCarousel';
import { TechnologyStack } from './components/TechnologyStack';
import { ProjectLinks } from './components/ProjectLinks';
import { BuildInformation } from './components/BuildInformation';
import { FeedbackModal } from './components/FeedbackModal';

interface AboutPageProps {
  onClose: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onClose }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleBack = () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    onClose();
  };

  return (
    <div className="about-page">
      {/* Redesigned Sticky Non-Overlapping Header */}
      <header className="about-header">
        <button
          type="button"
          className="about-back-btn"
          onClick={handleBack}
          aria-label="Back to Ammunition Tracker"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back</span>
        </button>

        <div className="about-header-title-box">
          <h2 className="about-header-title">About Buckshot Tracker</h2>
        </div>

        <div className="about-header-badge" aria-label={`Version ${APP_CONFIG.version}`}>
          v{APP_CONFIG.version}
        </div>
      </header>

      <main className="about-content">
        {/* Hero Section: Application Identity */}
        <section className="about-hero">
          <img src={botLogo} alt="Buckshot Tracker Logo" className="hero-logo" />
          <h1 className="hero-title">{APP_CONFIG.name}</h1>
          <p className="hero-subtitle">{APP_CONFIG.subtitle}</p>
          <div className="hero-badge-row">
            <span className="hero-badge hero-badge--multi">Solo & Multiplayer</span>
            <span className="hero-badge hero-badge--intel">Real-Time Shell Intel</span>
            <span className="hero-badge hero-badge--version">v{APP_CONFIG.version} Stable</span>
          </div>
        </section>

        {/* Tactical Purpose: Natural Single-Player & Multiplayer Communication */}
        <section className="about-section purpose-section">
          <div className="section-header-row">
            <h3 className="section-title">Tactical Purpose</h3>
            <span className="section-tag-badge">Mission</span>
          </div>
          <div className="purpose-card">
            <p className="purpose-text">
              Buckshot Tracker is an industrial-grade tactical companion engineered for Buckshot
              Roulette matches across both single-player and multiplayer modes. Designed to
              eliminate guesswork during critical rounds, the system tracks live and blank chamber
              inventory in real time, computes instant firing probabilities, records Burner Phone
              positional intelligence, and automatically advances upcoming shell sequences upon
              discharge or Beer Can ejection.
            </p>
          </div>
        </section>

        {/* Core Intelligence Capabilities: Infinite Carousel */}
        <CoreCapabilitiesCarousel />

        {/* Technology Stack: Infinite Carousel with Recognized Logos */}
        <TechnologyStack />

        {/* Developer & Project Links */}
        <ProjectLinks />

        {/* Build & Release Metadata */}
        <BuildInformation />

        {/* Feedback CTA */}
        <section className="about-section feedback-cta-section">
          <div className="feedback-cta-card">
            <div className="feedback-cta-text">
              <h4 className="feedback-cta-title">Encountered an issue or have a feature idea?</h4>
              <p className="feedback-cta-desc">
                Submit an encrypted report directly to the creator. Your feedback helps maintain zero-defect tactical stability.
              </p>
            </div>
            <button
              type="button"
              className="feedback-cta-btn"
              onClick={() => {
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
                setShowFeedback(true);
              }}
            >
              Send Direct Feedback
            </button>
          </div>
        </section>
      </main>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
};
