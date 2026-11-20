import React from 'react';
import { APP_CONFIG } from '../../../config/app.config';

export const TechnologyStack: React.FC = () => {
  return (
    <div className="about-section">
      <h3 className="section-title">Technology Stack</h3>
      <p className="section-desc">Industrial-grade architecture built for zero latency and offline resilience.</p>
      <div className="tech-stack-grid">
        {APP_CONFIG.techStack.map((tech) => (
          <div key={tech.name} className="tech-badge">
            <span className="tech-name">{tech.name}</span>
            <span className="tech-role">{tech.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

