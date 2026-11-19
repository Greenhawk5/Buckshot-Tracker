# Changelog

All notable changes to **Buckshot Tracker** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-20

### Added
- **Tactical Ammunition Tracker:** Real-time binary shell tracking for Live and Blank rounds in Single-Player Buckshot Roulette.
- **Chamber Inventory Display:** High-contrast capsule indicators showing remaining ammunition distribution, active loadout status, and shot counter.
- **Composition Odds Engine:** Real-time probabilistic calculations displaying Live vs. Blank percentages with semantic risk status (*Dominant Live*, *High Live Risk*, *50/50 Even Split*, *High Blank Chance*, *Dominant Blank*).
- **Quick Load Presets:** One-tap loadout selectors for standard dealer configurations (`1L / 1B`, `2L / 1B`, `2L / 2B`, `3L / 2B`, `3L / 3B`, `4L / 4B`) alongside custom capacity steppers (up to 8 total shells).
- **Burner Phone Intelligence System:** Positional tracking for shells revealed by the Burner Phone:
  - 1-based relative position indexing from the current chamber forward.
  - Automatic designation of Position 1 as the active `CURRENT SHELL`.
  - Dynamic index decrement (`pos = pos - 1`) as shells are discharged.
  - Automatic expiration and removal when a known shell is fired or ejected.
  - Conflict-prevention validation ensuring no dual entries on the same position.
- **Beer Can Ejection Workflow:** Tactical shell ejection modal supporting:
  - Automatic deduction and consumption when Position 1 is already known.
  - Explicit Live or Blank confirmation when Position 1 is unrevealed.
  - Validation rejecting unverified `unknown` ejections without intelligence.
- **Deterministic Reversible Undo:** Full-stack single-step undo engine restoring inventory counts, shot logs, and positional intelligence to their exact prior state.
- **Telegram Serverless Backend (`@tgcloud/cli`):**
  - Isolated V8 serverless endpoints (`createSession`, `recordShot`, `ejectShell`, `addShellIntel`, `removeShellIntel`, `undoLastAction`, `getActiveSession`, `abandonSession`, `ping`).
  - Strict Telegram WebApp `initData` cryptographic signature verification.
  - SQLite persistence with `tracker_sessions` and `processed_operations` schema.
  - Optimistic concurrency control via monotonic `revision` guards.
- **Offline Resilience:** Local storage state hydration, automatic mutation queuing, and background synchronization upon network reconnection.
- **Soft Industrial Gaming Interface:** OLED-optimized dark theme (`#07090e`), responsive 320px–768px layout, tactile CSS touch states, and Telegram haptic feedback.
- **Automated Test Suite:** Vitest test suite covering logic, positional intelligence invariants, persistence, and backend endpoints (53 passed tests).

### Security
- Cryptographic launch validation enforcing caller identity via `ctx.initData.user`.
- Defense-in-depth backend validation rejecting unauthorized shell ejection states.
- User-isolated database queries preventing cross-tenant data access.

