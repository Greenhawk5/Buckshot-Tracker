<div align="center">

<img src="docs/photo/GitHub%20Banner.png" alt="Buckshot Tracker Banner" width="100%" />

# BUCKSHOT TRACKER

### Tactical Ammunition & Shell Intelligence Companion for Telegram Mini Apps

A precision tactical companion for **Buckshot Roulette** running on the **Telegram Serverless** platform. Tracks live and blank ammunition inventory, computes real-time composition odds, maintains dynamic Burner Phone positional intelligence across shots and beer ejections, and provides resilient SQLite-backed cloud synchronization.

<br />

<p>
  <a href="#-overview">Overview</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-visual-showcase">Visual Showcase</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-key-features">Key Features</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-how-it-works">How It Works</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-architecture">Architecture</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-technology-stack">Technology Stack</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-getting-started">Getting Started</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-testing">Testing</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#-deployment">Deployment</a>
</p>

<p>
  <a href="https://github.com/Greenhawk5/Buckshot-Tracker/actions/workflows/ci.yml">
    <img src="https://github.com/Greenhawk5/Buckshot-Tracker/actions/workflows/ci.yml/badge.svg" alt="CI Workflow" />
  </a>
  <img src="https://img.shields.io/badge/version-v1.0.0-39ff8b?style=for-the-badge&labelColor=05060a" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/Platform-Telegram%20Mini%20App-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Mini App" />
  <img src="https://img.shields.io/badge/Runtime-Telegram%20Serverless-0088cc?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Serverless" />
  <img src="https://img.shields.io/badge/Database-SQLite%20WAL-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite Database" />
  <img src="https://img.shields.io/badge/Tests-53%20Passed-brightgreen?style=for-the-badge" alt="53 Tests Passed" />
  <img src="https://img.shields.io/badge/License-MIT-36d97e?style=for-the-badge" alt="MIT License" />
  ![Visits](https://badges.pufler.dev/visits/Greenhawk5/Buckshot-Tracker)
</p>

</div>

---

## 🎯 Overview

In *Buckshot Roulette*, survival depends on precise probability calculation, tracking spent shells, and leveraging tactical item intelligence. 

**Buckshot Tracker** provides an instant, zero-friction tactical dashboard accessible directly inside Telegram. It replaces mental tracking with an authoritative digital chamber inventory:

- **Eliminates Counting Errors:** Tracks remaining **Live** (crimson) and **Blank** (cyan) shells in the chamber.
- **Calculates Real-Time Odds:** Updates remaining probability distribution and risk profiles after every shot.
- **Maintains Positional Intelligence:** Accurately tracks shells revealed by the **Burner Phone** as the loadout changes.
- **Models Item Interactions:** Handles **Beer Can** shell ejections and decrements positions automatically.
- **Resilient Offline Architecture:** Operates seamlessly even during cellular drops, syncing state to the cloud via Telegram Serverless when connected.

> **Scope Note:** Buckshot Tracker strictly targets **Single-Player** Buckshot Roulette mechanics as designed by Mike Klubnika. Multiplayer modes are not supported.

---

## 📱 Visual Showcase

<div align="center">

| **01. Setup & Presets** | **02. Active Chamber Tracker** | **03. Burner Phone Intel** |
| :---: | :---: | :---: |
| <img src="docs/assets/showcase/01-setup-presets.png" width="240" alt="Setup Screen and Quick Load Presets" /> | <img src="docs/assets/showcase/02-active-tracker.png" width="240" alt="Active Tracker and Composition Odds" /> | <img src="docs/assets/showcase/03-burner-phone-modal.png" width="240" alt="Burner Phone Intelligence Modal" /> |
| *One-tap dealer presets from 1L/1B to 4L/4B and custom steppers.* | *Chamber capsules, odds breakdown, and tactile shot actions.* | *Log revealed shell positions relative to current chamber.* |

<br />

| **04. Known Shell Positions** | **05. Beer Can Ejection** |
| :---: | :---: |
| <img src="docs/assets/showcase/04-known-shell-positions.png" width="260" alt="Known Shells with Current Shell Indicator" /> | <img src="docs/assets/showcase/05-beer-ejection-modal.png" width="260" alt="Beer Ejection Workflow Modal" /> |
| *Position 1 CURRENT SHELL status with dynamic shift on fire.* | *Safe ejection verifying Position 1 or manual confirmation.* |

</div>

---

## ✨ Key Features

### 🔴 Chamber Inventory & Odds Engine
- **Visual Ammunition Readout:** Segmented chamber capsules representing remaining live and blank rounds with distinct soft-industrial glow identities.
- **Statistical Composition Odds:** Real-time odds computation displaying exact percentages and semantic tactical descriptions (*Dominant Live*, *High Live Risk*, *50/50 Even Split*, *High Blank Chance*, *Dominant Blank*).
- **Quick-Load Presets:** Pre-configured buttons for standard dealer loads (`1L/1B`, `2L/1B`, `2L/2B`, `3L/2B`, `3L/3B`, `4L/4B`) with custom steppers up to 8 rounds.

### 📞 Burner Phone Intelligence System
- **Relative Positional Tracking:** Records revealed shells by relative position offset (`Position 1` = currently chambered shell, `Position 2` = next in line).
- **Dynamic Position Advancement:** When any shell is fired or ejected, surviving intelligence automatically shifts forward (`pos = pos - 1`).
- **Current Shell Detection:** When Position 1 becomes known, the interface prominently flags it as **CURRENT SHELL**, removing all ambiguity before pulling the trigger.
- **Sanity Validation:** Prevents duplicate entries on the same position and ensures revealed shells do not exceed remaining ammunition counts.

### 🍺 Beer Can Ejection Handling
- **Automated Intelligence Consumption:** If Position 1 is already revealed, tapping Beer Can immediately ejects and logs that shell without extra prompts.
- **Unrevealed Shell Modal:** If Position 1 is unrevealed, an interactive modal allows selecting whether a Live or Blank shell was expelled from the chamber.
- **Defense-in-Depth Verification:** Rejects ambiguous ejections, preserving data integrity across both frontend and backend state.

### ↩️ Deterministic Single-Step Undo
- **Full-Stack Rollback:** Reverses the last action (shot, ejection, or intel change), restoring previous ammunition counts, odds, and positional state.
- **History Badge Indicator:** Displays the reversible action count with layout-stable geometry.

### ☁️ Cloud Persistence & Offline Recovery
- **Telegram Serverless Isolate:** Built natively on `@tgcloud/cli` using V8 serverless isolate functions.
- **SQLite Database:** Authoritative session persistence using SQLite in WAL mode.
- **Optimistic Concurrency:** Version-checked `revision` headers prevent stale writes and race conditions.
- **Offline Mutation Queue:** Local storage queue caches mutations during disconnection and replays them when back online.

---

## 🕹️ How It Works

```text
1. SETUP PHASE           2. ROUND EXECUTION             3. REVELATION & EJECTION
┌─────────────────┐      ┌────────────────────────┐      ┌─────────────────────────┐
│ Dealer reveals  │ ──►  │ Fire Live / Blank      │ ──►  │ Use Burner Phone        │
│ 3 Live, 2 Blank │      │ Chamber updates        │      │ Record Pos 3 is LIVE    │
│ Tap preset 3L/2B│      │ Odds recalculate       │      │ Shells shift on fire    │
└─────────────────┘      └────────────────────────┘      └─────────────────────────┘
                                   │                                  │
                                   ▼                                  ▼
                         ┌────────────────────────┐      ┌─────────────────────────┐
                         │ Undo last shot         │      │ Drink Beer              │
                         │ Rollback state & intel │      │ Eject shell from gun    │
                         │ Invariants preserved   │      │ Known Pos 1 consumed    │
                         └────────────────────────┘      └─────────────────────────┘
```

---

## 🏗️ Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as Player
    participant App as React Mini App
    participant Storage as Local Cache & Queue
    participant Cloud as Telegram Serverless (V8)
    participant DB as SQLite (WAL Mode)

    User->>App: Launch Mini App via Telegram
    App->>Storage: Hydrate cached session & offline queue
    App->>Cloud: POST /api/getActiveSession (with initData)
    Cloud->>Cloud: Verify Telegram cryptographic signature
    Cloud->>DB: Query tracker_sessions by user_id
    DB-->>Cloud: Active session record
    Cloud-->>App: Authoritative session state

    User->>App: Record Shot (Live / Blank)
    App->>App: Optimistically update UI, odds & intel
    App->>Storage: Persist local snapshot & enqueue mutation
    App->>Cloud: POST /api/recordShot (payload + revision)
    Cloud->>DB: Validate revision & update session atomically
    DB-->>Cloud: Success (new revision)
    Cloud-->>App: Operation confirmed (drain queue)
```

---

## 🛠️ Technology Stack

| Area | Technology |
| :--- | :--- |
| **Frontend UI** | <img src="https://img.shields.io/badge/React-19.3.1-61DAFB?style=flat&logo=react&logoColor=black" alt="React 19" /> <img src="https://img.shields.io/badge/TypeScript-7.0.2-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" /> |
| **Styling & Tokens** | <img src="https://img.shields.io/badge/CSS-Tokens%20%2B%20Soft%20Industrial-1572B6?style=flat&logo=css3&logoColor=white" alt="CSS" /> |
| **Build Tooling** | <img src="https://img.shields.io/badge/Vite-8.3.8-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite" /> |
| **Client Platform** | <img src="https://img.shields.io/badge/Telegram-Mini%20Apps-26A5E4?style=flat&logo=telegram&logoColor=white" alt="Telegram Mini Apps" /> |
| **Serverless Runtime** | <img src="https://img.shields.io/badge/Telegram-Serverless%20V8-0088cc?style=flat&logo=telegram&logoColor=white" alt="Telegram Serverless" /> |
| **Persistence Engine** | <img src="https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=flat&logo=sqlite&logoColor=white" alt="SQLite" /> |
| **Test Suites** | <img src="https://img.shields.io/badge/Vitest-5.1.1-6E9F18?style=flat&logo=vitest&logoColor=white" alt="Vitest" /> |
| **E2E & UI Verification** | <img src="https://img.shields.io/badge/Puppeteer-Core-40B5A4?style=flat&logo=puppeteer&logoColor=white" alt="Puppeteer" /> |

---

## 📂 Project Structure

```text
Buckshot Tracker/
├── .github/
│   ├── workflows/ci.yml             # GitHub Actions CI (test, typecheck, build)
│   ├── ISSUE_TEMPLATE/              # Bug report and feature request forms
│   ├── PULL_REQUEST_TEMPLATE.md     # Pull request guidelines and checklist
│   └── CODEOWNERS                   # Repository code ownership
├── dist/                            # Production static build deployed to Telegram
├── docs/
│   ├── README.md                    # Documentation index
│   ├── architecture.md              # Technical specifications & data flow
│   ├── development.md               # Local dev environment & operational manual
│   ├── game-mechanics-sources.md    # Authoritative rules & intelligence citations
│   ├── tgcloud-sdk.md               # Telegram Serverless SDK reference
│   ├── photo/                       # Public branding banners and logos
│   └── assets/showcase/             # Application visual showcase screenshots
├── src/
│   ├── app/                         # Application entrypoint & layout
│   ├── components/                  # UI components (AmmoIndicator, KnownShellPositions, etc.)
│   ├── features/tracker/            # Pure counting engine, intelligence logic & tests
│   ├── hooks/                       # React hooks (useTelegram, useTrackerSession)
│   ├── services/                    # Telegram Serverless client & local storage
│   └── styles/                      # Soft industrial design tokens & global CSS
├── tests/                           # Vitest test suites & Puppeteer verification scripts
├── tgcloud/                         # Telegram Serverless backend modules (deployed to cloud)
│   ├── endpoints/                   # Serverless endpoints (recordShot, ejectShell, etc.)
│   ├── handlers/                    # Telegram bot update handlers (message.js)
│   ├── lib/                         # Shared backend helper functions
│   └── schema.js                    # SQLite database schema (sdk/db)
├── CHANGELOG.md                     # Keep a Changelog release history
├── CONTRIBUTING.md                  # Contribution guidelines
├── CODE_OF_CONDUCT.md               # Community standards
├── SECURITY.md                      # Vulnerability reporting policy
├── SUPPORT.md                       # Support & troubleshooting guidance
├── CITATION.cff                     # Citation file format metadata
├── LICENSE                          # MIT License
├── package.json                     # Project manifest (v1.0.0)
├── tgcloud.jsonc                    # Telegram Serverless platform configuration
└── vite.config.ts                   # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `20.x` or later (LTS recommended)
- **npm:** `10.x` or later

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Greenhawk5/Buckshot-Tracker.git
cd Buckshot-Tracker

# 2. Install dependencies
npm install
```

### Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). In a desktop browser, Telegram WebApp APIs automatically fallback to preview mocks for seamless local testing.

---

## 🧪 Testing

The test suite validates counting logic, positional intelligence shifts, persistence queues, and serverless backend endpoints:

```bash
# Run complete test suite (53 tests)
npm test

# Run TypeScript type check
npm run typecheck

# Build production bundle
npm run build
```

### End-to-End Responsive Verification
Verify layout integrity and intelligence behaviors across simulated mobile viewports:
```bash
node tests/test-intel-verification.mjs
```

---

## ☁️ Deployment

Buckshot Tracker is hosted natively on Telegram Serverless using `@tgcloud/cli`:

```bash
# 1. Authenticate with your Telegram Bot
npx tgcloud login

# 2. Verify cloud drift and status
npm run status

# 3. Apply SQLite schema migrations
npm run migrate

# 4. Deploy static frontend and backend endpoints
npm run deploy
```

---

## 🔒 Security & Privacy

- **Cryptographic Launch Verification:** All requests must include valid Telegram `initData`. Signatures are validated by the serverless platform before endpoint execution.
- **Tenant Isolation:** All database records and session mutations are scoped strictly to the authenticated `user.id`.
- **Zero Client-Side Secrets:** No bot tokens, database credentials, or secret keys are stored in client code or frontend bundles.
- **Responsible Disclosure:** See [SECURITY.md](SECURITY.md) for vulnerability disclosure procedures.

---

## 📖 Documentation Index

- [Architecture & Data Flow](docs/architecture.md)
- [Development & Deployment Manual](docs/development.md)
- [Game Mechanics & Sources](docs/game-mechanics-sources.md)
- [Telegram Serverless SDK Reference](docs/tgcloud-sdk.md)
- [Release History (Changelog)](CHANGELOG.md)

---

## 🤝 Contributing

We welcome bug fixes and documentation improvements. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).  
Copyright © 2026 **Greenhawk5**.

*Buckshot Roulette is created by Mike Klubnika. Buckshot Tracker is an independent fan-made tactical companion.*
