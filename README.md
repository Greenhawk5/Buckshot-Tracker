# Buckshot Roulette Tracker — Telegram Mini App

A lightweight, tactile, industrial-grade Telegram Mini App companion designed for players of **Buckshot Roulette** to track live and blank shotgun shells remaining in the chamber during gameplay.

Powered natively by the **Telegram Serverless** platform (`@tgcloud/cli`), with built-in SQLite persistence and Telegram-native Mini App hosting.

---

## 🎮 Features

- **Accurate Live & Blank Ammunition Tracking:** Large, tactile, color-coded shot controls (Red for Live, Blue for Blank) designed for quick single-tap gameplay.
- **Statistical Composition Odds:** Real-time percentage indicator of remaining chamber composition.
- **Visual Chamber Inventory:** Pill indicator displaying remaining live vs blank rounds.
- **Fast Undo Support:** Reverses accidental taps and restores exact shell counts without corrupting session history.
- **Serverless SQLite Persistence:** Automatically syncs active game loads with Telegram Serverless SQLite database (`tracker_sessions`).
- **Resilient Offline Mode & Local Recovery:** Instant hydration from local storage; caches and queues actions during network drops, with idempotent replay.
- **Optimistic Concurrency Control:** Version-checked mutations prevent race conditions across multiple open clients.
- **Telegram Native Integration:** Full support for Telegram WebApp theme params, viewport expansion, swipe-away closing confirmation, and haptic feedback.

---

## 🏗️ Architecture

```text
Telegram Client
      │
      │ Launches Mini App
      ▼
Telegram Mini App (React + TypeScript + Vite)
      │
      │ Telegram.WebApp.Serverless.call
      ▼
Telegram Serverless Endpoints (V8 Sandboxes at cloud.telegram.org)
      │
      │ Authenticated ctx.initData.user & parameterized queries
      ▼
Telegram Serverless SQLite Database (tracker_sessions & processed_operations)
```

### Directory Layout

```text
Buckshot Counter/
├── dist/                     # Production static build hosted as Mini App
├── note/                     # Original product & technical specification
├── src/
│   ├── app/                  # Application root and layout
│   ├── components/           # UI components (ShellCounter, ShotButton, AmmoIndicator, etc.)
│   ├── features/tracker/     # Pure deterministic counting engine, types, and logic
│   ├── hooks/                # React hooks (useTelegram, useTrackerSession)
│   ├── services/             # Telegram Serverless client & local persistence
│   └── styles/               # CSS tokens and global dark theme styles
├── tgcloud/                  # Telegram Serverless backend modules (deployed to cloud)
│   ├── endpoints/            # Mini App endpoints (createSession, recordShot, etc.)
│   ├── handlers/             # Telegram bot update handlers (message.js)
│   ├── lib/                  # Shared backend utilities
│   └── schema.js             # SQLite schema declared with sdk/db
├── tests/                    # Vitest unit, backend, and persistence tests
├── tgcloud.jsonc             # Platform configuration
├── vite.config.ts            # Vite bundler configuration
└── package.json
```

---

## 🚀 Commands & Development Workflow

### Prerequisites
- Node.js 20+ (Verified on `v22.17.0`)
- npm 10+ (Verified on `11.4.2`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Local Frontend Development
```bash
npm run dev
```

### 3. Run Test Suite
```bash
# Run all unit, backend, and persistence tests
npm test

# Run TypeScript type check
npm run typecheck
```

### 4. Build Production Frontend
```bash
npm run build
```

### 5. Link Bot & Deploy to Telegram Cloud
```bash
# Link CLI to Telegram Serverless Bot Token (interactive)
npx tgcloud login

# Deploy backend modules and Mini App frontend build
npm run deploy

# Apply pending SQLite schema migrations
npm run migrate

# Inspect deployment status
npm run status
```

---

## 📡 Backend Endpoints

Every endpoint verifies the Telegram caller identity via `ctx.initData.user`:

| Endpoint | Method / Input | Description |
| :--- | :--- | :--- |
| `getActiveSession` | `{}` | Retrieves active session for the authenticated user. |
| `createSession` | `{ initialLive, initialBlank, operationId }` | Starts a new shotgun load with idempotency protection. |
| `recordShot` | `{ sessionId, shell, expectedVersion, operationId }` | Records a live/blank shot with version checking. |
| `undoLastAction` | `{ sessionId, expectedVersion, operationId }` | Reverses the last recorded shot event. |
| `abandonSession` | `{ sessionId, expectedVersion }` | Discards the current active load. |
| `ping` | `{}` | Diagnostic endpoint returning server time and verified user context. |

---

## 🔒 Security & Privacy

- **No Exposed Secrets:** No Bot API tokens or signing secrets are packaged in the frontend bundle or Git repository.
- **Server-Side Identity Verification:** The Telegram Serverless platform verifies `initData` cryptographically before endpoint invocation; unauthenticated calls are rejected with HTTP 401.
- **Strict User Isolation:** All database reads, writes, and mutations are strictly scoped to `ctx.initData.user.id`.
