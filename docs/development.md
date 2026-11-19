# Local Development & Deployment Operations

This document covers local setup, test execution, coding standards, and deployment procedures for **Buckshot Tracker**.

---

## 1. Prerequisites

- **Node.js:** `20.x` or later
- **npm:** `10.x` or later
- **Telegram Bot Token:** Required only for live deployment via `@tgcloud/cli` (not required for local UI development).

---

## 2. Getting Started

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Greenhawk5/Buckshot-Tracker.git
cd Buckshot-Tracker
npm install
```

### Local Dev Server
Launch Vite development server with hot-module replacement:
```bash
npm run dev
```
Navigate to `http://localhost:5173`. In standard browser environments, Telegram WebApp APIs operate using internal preview stubs.

---

## 3. Testing & Verification

The project includes unit, persistence, and backend test suites executed via Vitest:

```bash
# Run all automated tests
npm test

# Run TypeScript type check
npm run typecheck

# Build production bundle
npm run build
```

### End-to-End Responsive Verification
To verify responsive layouts and UI rendering under simulated Telegram WebApp viewports:
```bash
node tests/test-intel-verification.mjs
```

---

## 4. Telegram Serverless CLI Operations (`tgcloud`)

The backend and Mini App hosting are deployed using the `@tgcloud/cli` toolchain:

### Authentication
Link the local project to your Telegram Bot environment:
```bash
npx tgcloud login
```

### Status & Drift Detection
Inspect local module differences compared to cloud-deployed modules:
```bash
npm run status
# or: npx tgcloud status
```

### Schema Migration
Apply schema updates declared in `tgcloud/schema.js`:
```bash
npm run migrate
# or: npx tgcloud migrate
```

### Production Deployment
Build the frontend and push backend code and static assets:
```bash
npm run deploy
# or: npm run build && npx tgcloud push
```

### Cloud Handler Execution
Test endpoints server-side with simulated contexts:
```bash
npx tgcloud run endpoints/ping '{}'
npx tgcloud run endpoints/getActiveSession '{}' --ctx '{ "initData": { "user": { "id": 12345 } } }'
```

---

## 5. Module Rules & Best Practices

When modifying code in `tgcloud/`:
1. **Module Extensions:** All relative imports within `tgcloud/` must explicitly end with `.js` (e.g., `import { users } from '../schema.js'`).
2. **Platform SDK:** Import platform capabilities directly by name: `import { db, api, fetch, EndpointError } from 'sdk'`.
3. **No npm Dependencies at Runtime:** Runtime dependencies in `tgcloud/` are restricted to the serverless SDK and local project files.
4. **Foreign Keys:** SQLite runs with foreign keys disabled in the isolate; enforce referential integrity within application logic.

