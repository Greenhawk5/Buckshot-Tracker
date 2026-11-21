/**
 * Canonical Application Configuration & Release Metadata
 * Single source of truth for build, versioning, links, and identity.
 */

export const APP_CONFIG = {
  name: 'BUCKSHOT TRACKER',
  subtitle: 'Tactical Ammunition & Shell Intelligence Companion',
  version: '1.2.0',
  releaseChannel: 'Stable',
  platform: 'Telegram Mini App',
  portfolioUrl: 'https://alifaniani.ir',
  githubUrl: 'https://github.com/Greenhawk5/Buckshot-Tracker',
  ownerTelegramId: '184202422',
  description:
    'Tactical companion for Buckshot Roulette matches across single-player and multiplayer modes. Real-time chamber probability calculations, Burner Phone positional intelligence, Beer Can ejections, and persistent cloud recovery.',
  techStack: [
    { name: 'React 19', role: 'Reactive UI Framework' },
    { name: 'TypeScript', role: 'Type Safety & API Contracts' },
    { name: 'Vite', role: 'Bundler & Asset Pipeline' },
    { name: 'Telegram Mini Apps', role: 'Client Platform & Haptics' },
    { name: 'Telegram Serverless', role: 'V8 Isolated Cloud Backend' },
    { name: 'SQLite (WAL)', role: 'Durable Zero-Latency Storage' },
  ],
  coreFeatures: [
    'Chamber inventory with live/blank ammunition counters',
    'Real-time composition probability intelligence',
    'Quick-load presets and custom chamber setup (up to 16 shells)',
    'Burner Phone positional intelligence tracking',
    'Dynamic position advancement on firing and beer ejection',
    'Beer Can shell ejection with intelligence validation',
    'Full undo and historical action rollback',
    'Optimistic revision control and cloud session persistence',
  ],
};
