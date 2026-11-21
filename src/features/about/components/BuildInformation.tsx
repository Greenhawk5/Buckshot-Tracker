import React from 'react';
import { APP_CONFIG } from '../../../config/app.config';

export const BuildInformation: React.FC = () => {
  const metadata = [
    { label: 'Application Version', value: `v${APP_CONFIG.version}`, isMono: true },
    { label: 'Release Channel', value: APP_CONFIG.releaseChannel, isBadge: true },
    { label: 'Execution Environment', value: APP_CONFIG.platform },
    { label: 'Backend Platform', value: 'Telegram Serverless (V8 Isolate)' },
    { label: 'Storage Engine', value: 'SQLite WAL (Durable In-Memory Cache)' },
  ];

  return (
    <div className="about-section build-info-section">
      <div className="section-header-row">
        <h3 className="section-title">Build & Release Information</h3>
        <span className="section-tag-badge">Metadata</span>
      </div>
      <div className="build-info-card">
        {metadata.map((item, idx) => (
          <div key={idx} className="info-row">
            <span className="info-label">{item.label}</span>
            <div className="info-value-box">
              {item.isBadge ? (
                <span className="info-value channel-badge">{item.value}</span>
              ) : (
                <span className={`info-value ${item.isMono ? 'font-mono' : ''}`}>{item.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
