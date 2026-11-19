# Contributing to Buckshot Tracker

Thank you for your interest in contributing to **Buckshot Tracker**! We welcome bug reports, documentation improvements, and thoughtful feature contributions that align with our single-player gameplay focus and design standards.

---

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all members of the community with respect and courtesy.

---

## Scope & Gameplay Philosophy

Before proposing features or architectural changes, please keep the project scope in mind:

1. **Single-Player Focus:** Buckshot Tracker is strictly built for the original Single-Player Buckshot Roulette game designed by Mike Klubnika. We do not support or plan to support multiplayer mechanics.
2. **Deterministic & Faithful Mechanics:** All ammunition behaviors, burner phone intelligence, beer ejections, and odds calculations must strictly reflect verified game mechanics. See [docs/game-mechanics-sources.md](docs/game-mechanics-sources.md).
3. **Soft Industrial Gaming Aesthetic:** Visual contributions must maintain our high-contrast, dark OLED theme, balanced proportions, and responsive behavior (320px to 768px+).

---

## Prerequisites

- **Node.js:** `20.x` or later (LTS recommended)
- **npm:** `10.x` or later
- **Git**

---

## Local Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/Greenhawk5/Buckshot-Tracker.git
   cd Buckshot-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser. Note: In standalone browser mode, Telegram WebApp APIs fallback gracefully to local preview mocks.

---

## Verification & Testing

Every pull request must pass all automated checks prior to review:

```bash
# 1. Run unit, backend, and persistence tests
npm test

# 2. Run TypeScript strict type verification
npm run typecheck

# 3. Verify clean production build
npm run build
```

---

## Telegram Serverless Platform (`tgcloud`)

The backend runs on Telegram's serverless platform. The CLI is installed as a project dependency:

- `npx tgcloud status` — Compare local modules with cloud state.
- `npx tgcloud push` — Deploy backend modules and the static frontend bundle.
- `npx tgcloud migrate` — Apply SQLite schema changes to the cloud database.
- `npx tgcloud run <module> [args]` — Execute an endpoint locally or server-side for testing.

> **Note:** Never commit `.tgcloud/` or any cloud credentials.

---

## Pull Request Guidelines

1. **Branch Naming:**
   - Features: `feature/<descriptive-name>`
   - Bug fixes: `fix/<issue-name>`
   - Documentation: `docs/<topic>`

2. **Commit Messages:**
   Follow Conventional Commits:
   - `feat(ui): add quick load preset indicator`
   - `fix(backend): validate position index bounds in ejectShell`
   - `docs(readme): update deployment instructions`

3. **Checklist Before Submitting:**
   - [ ] Automated tests pass (`npm test`).
   - [ ] Type check passes with 0 errors (`npm run typecheck`).
   - [ ] Production build succeeds (`npm run build`).
   - [ ] No personal tokens, secrets, or `.tgcloud/` files are staged.
   - [ ] Relevant documentation has been updated.
