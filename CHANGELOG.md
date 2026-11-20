# Changelog

All notable changes to **Buckshot Tracker** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-12-20

### Added
- **Public About Experience (`AboutPage.tsx`):**
  - Accessible via the circular information icon in the header.
  - Dedicated sections for product identity, single-player tactical capabilities, verified technology stack, and canonical versioning (`v1.2.0`).
  - Developer showcase and repository links to creator portfolio (`https://alifaniani.ir`) and GitHub (`https://github.com/Greenhawk5/Buckshot-Tracker`).
  - In-app feedback submission modal allowing players to submit bug reports and feature requests directly to the cloud backend.
- **Private Owner Command Center (`OwnerLayout.tsx`):**
  - Strictly gated server-side exclusively to Telegram user ID `184202422`.
  - **Overview & Telemetry:** Total observed users, active users across rolling UTC intervals (`24h`, `7d`, `30d`, `90d`, `180d`, `365d`), sessions created, actions recorded, and activity velocity histograms.
  - **Advanced Analytics:** Comparative growth metrics, active user anchors (DAU, WAU, MAU), event taxonomy breakdown, and custom date range filters.
  - **User Registry & Management:** Searchable player directory with Unicode preservation, mutable handle handling, player detail drawer with activity timeline, private owner notes & display aliases, VIP playtester tagging, and application-level restriction controls.
  - **Multimedia Broadcast Center:** Campaign composer supporting Telegram text, photo, video, voice, video note, and document formats. Audience segmentation (all, active, inactive, new, VIP), pre-send recipient count preview, and bounded batch queue processing with lease timestamps and rate limit (429 `retry_after`) exponential backoff.
  - **System Health & Diagnostics:** Live SQLite database latency check, entity volume monitoring, and queue telemetry.
  - **Operational Settings:** Server-authoritative maintenance mode toggle, announcement banner editor, emergency global broadcast pause, and inter-send pacing delay controls.
  - **Administrative Audit Logs:** Append-only security audit trail recording actor ID, action, target entity, timestamp, outcome, and sanitized parameters for all sensitive operations.
  - **Feedback Review System:** In-app management interface for reviewing, updating status (`new`, `reviewing`, `resolved`, `dismissed`), and recording owner responses.
  - **Reports & Export Center:** One-click CSV and JSON exports for Users, Events, Sessions, Campaigns, Audit, and Feedback with automated spreadsheet formula injection protection (`=`, `+`, `-`, `@`).
- **Telemetry & Event Tracking:**
  - Automated tracking of domain lifecycle events (`app_opened`, `session_created`, `shot_recorded`, `shell_ejected`, `shell_intel_added`, `shell_intel_removed`, `undo_executed`, `session_completed`, `session_abandoned`, `feedback_submitted`).
  - Schema-controlled metadata bounding and idempotency key deduplication.
- **Additive Database Foundation (`tgcloud/schema.js`):**
  - Non-destructive tables: `users`, `activity_events`, `broadcast_campaigns`, `broadcast_recipients`, `admin_audit_logs`, `app_settings`, and `feedback_reports`.
  - Full backward compatibility with existing `tracker_sessions` and `processed_operations` tables.
- **Expanded Automated Test Suite:**
  - 82 automated Vitest tests across 7 test suites covering backend authorization, owner guard, user registry, telemetry calculations, broadcast lifecycle, formula injection escaping, persistence, and frontend architecture.

### Security
- Cryptographic owner authorization guard (`requireOwner`) independently enforced on all administrative endpoints.
- Client-supplied IDs in request payloads, query parameters, or local storage are strictly ignored.
- Automated CSV formula injection neutralization on all exported datasets.

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

