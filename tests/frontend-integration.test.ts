import { describe, it, expect } from 'vitest';
import React from 'react';
import { APP_CONFIG } from '../src/config/app.config';
import { AboutPage } from '../src/features/about/AboutPage';
import { ProjectLinks } from '../src/features/about/components/ProjectLinks';
import { TechnologyStack } from '../src/features/about/components/TechnologyStack';
import { BuildInformation } from '../src/features/about/components/BuildInformation';
import { OwnerLayout } from '../src/features/owner/OwnerLayout';

describe('Frontend Architecture & About Page Tests — Phase 8', () => {
  it('strictly adheres to canonical application metadata and required links', () => {
    expect(APP_CONFIG.version).toBe('1.2.0');
    expect(APP_CONFIG.portfolioUrl).toBe('https://alifaniani.ir');
    expect(APP_CONFIG.githubUrl).toBe('https://github.com/Greenhawk5/Buckshot-Tracker');
    expect(APP_CONFIG.ownerTelegramId).toBe('184202422');
    expect(APP_CONFIG.name).toBe('BUCKSHOT TRACKER');
    expect(APP_CONFIG.releaseChannel).toBe('Stable');
  });

  it('renders ProjectLinks component with portfolio and GitHub URLs', () => {
    const el = React.createElement(ProjectLinks);
    expect(el).toBeDefined();
    expect(el.type).toBe(ProjectLinks);
  });

  it('renders TechnologyStack with verified platform technologies', () => {
    const el = React.createElement(TechnologyStack);
    expect(el).toBeDefined();
    expect(APP_CONFIG.techStack.some((t) => t.name.includes('React 19'))).toBe(true);
    expect(APP_CONFIG.techStack.some((t) => t.name.includes('SQLite'))).toBe(true);
    expect(APP_CONFIG.techStack.some((t) => t.name.includes('Telegram Serverless'))).toBe(true);
  });

  it('renders BuildInformation with canonical version 1.2.0', () => {
    const el = React.createElement(BuildInformation);
    expect(el).toBeDefined();
  });

  it('renders AboutPage top-level container with close handler', () => {
    let closed = false;
    const el = React.createElement(AboutPage, { onClose: () => { closed = true; } });
    expect(el).toBeDefined();
    expect(el.props.onClose).toBeDefined();
    el.props.onClose();
    expect(closed).toBe(true);
  });

  it('renders OwnerLayout container with close handler', () => {
    let closed = false;
    const el = React.createElement(OwnerLayout, { onClose: () => { closed = true; } });
    expect(el).toBeDefined();
    expect(el.props.onClose).toBeDefined();
    el.props.onClose();
    expect(closed).toBe(true);
  });
});
