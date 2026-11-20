import React from 'react';
import { APP_CONFIG } from '../../../config/app.config';

export const BuildInformation: React.FC = () => {
  return (
    <div className="about-section build-info-section">
      <h3 className="section-title">Build & Release Information</h3>
      <div className="build-info-card">
        <div className="info-row">
          <span className="info-label">Application Version</span>
          <span className="info-value font-mono">v{APP_CONFIG.version}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Release Channel</span>
          <span className="info-value channel-badge">{APP_CONFIG.releaseChannel}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Execution Environment</span>
          <span className="info-value">{APP_CONFIG.platform}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Backend Platform</span>
          <span className="info-value">Telegram Serverless (V8 Isolate)</span>
        </div>
      </div>
    </div>
  );
};

