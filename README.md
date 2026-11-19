<p align="center">
  <img src="docs/photo/GitHub%20Banner.png" alt="Buckshot Counter Banner" width="100%">
</p>

# Buckshot Counter

A fast, tactile, mobile-first utility application built as a Telegram Mini App. Designed for precision tracking of binary two-state inventory counts, real-time statistical composition ratios, and reversible event histories.

Powered natively by the **Telegram Serverless** platform (`@tgcloud/cli`), with built-in SQLite persistence, offline recovery, and native cloud hosting.

---

## Features

- **Precision Binary Counter:** Ergonomic, high-contrast controls for primary (Type A) and secondary (Type B) counts.
- **Statistical Composition Ratios:** Real-time percentage breakdowns of remaining inventory.
- **Visual Inventory Readout:** Segmented inventory status bar displaying remaining item composition.
- **Deterministic Event Reversal:** Fully reversible event log supporting reliable single-step undo.
- **Serverless SQLite Persistence:** Authoritative cross-device persistence using Telegram Serverless SQLite database tables (`tracker_sessions`).
- **Resilient Offline Cache & Queue:** Immediate local storage hydration; queues and replays mutations upon network reconnection.
- **Optimistic Concurrency Protection:** Version-checked updates prevent state collision and race conditions.
- **Telegram Mini App Integration:** Native support for viewport expansion, theme adaptation, haptic feedback, and closing confirmations.

---

## Architecture

```text
Telegram Client
      │
      │ Launches Mini App
      ▼
Mini App Frontend (React 19 + TypeScript + Vite)
      │
      │ Telegram.WebApp.Serverless.call
      ▼
Serverless Endpoints (Isolated V8 runtime on Telegram Cloud)
      │
      │ Verified ctx.initData.user & parameterized SQL
      ▼
SQLite Database (tracker_sessions & processed_operations tables)
```

### Directory Structure

```text
Buckshot Counter/
├── dist/                     # Production static build hosted as Mini App
├── src/
│   ├── app/                  # Application root and layout
│   ├── components/           # UI components (ShellCounter, ShotButton, AmmoIndicator, etc.)
│   ├── features/tracker/     # Pure deterministic counting engine, types, and logic
│   ├── hooks/                # React hooks (useTelegram, useTrackerSession)
│   ├── services/             # Telegram Serverless client & local persistence
│   └── styles/               # CSS design tokens and theme styling
├── tgcloud/                  # Telegram Serverless backend modules (deployed to cloud)
│   ├── endpoints/            # Mini App endpoints (createSession, recordShot, etc.)
│   ├── handlers/             # Telegram bot update handlers (message.js)
│   ├── lib/                  # Shared backend utilities
│   └── schema.js             # SQLite schema declared with sdk/db
├── tests/                    # Vitest unit, backend, and persistence tests
├── tgcloud.jsonc             # Platform configuration
├── vite.config.ts            # Vite bundler configuration
├── LICENSE                   # MIT License
└── package.json
```

---

## Local Development & Testing

### Prerequisites
- Node.js 20+
- npm 10+

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Automated Tests & Type Checking
```bash
# Run unit and integration tests
npm test

# Run TypeScript type check
npm run typecheck
```

### Production Build
```bash
npm run build
```

---

## Deployment to Telegram Serverless

```bash
# Link project to Telegram Serverless bot token (interactive terminal)
npx tgcloud login

# Deploy backend modules and Mini App build
npm run deploy

# Apply SQLite database migrations
npm run migrate

# Inspect deployment and webhook status
npm run status
```

---

## Security & Privacy

- **No Stored Secrets:** No bot tokens or private credentials are included in the repository or client bundles.
- **Cryptographic Launch Validation:** Endpoints are invoked only after platform validation of Telegram Mini App `initData`.
- **Strict Data Isolation:** All database records and queries are strictly scoped to the authenticated caller's user identifier.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
Copyright (c) 2026 Greenhawk5.
