# Changelog

All notable changes to **Buckshot Tracker** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-11-21

### Added
- **Public About Experience (`AboutPage.tsx`):**
  - Accessible via the circular information icon in the application header.
  - Dedicated sections for product identity, single-player and multiplayer companion mission, verified technology stack with official brand icons, and canonical versioning (`v1.2.0`).
  - Infinite auto-scrolling carousels for Core Intelligence Capabilities and Technology Stack.
  - Developer showcase and repository links to creator portfolio (`https://alifaniani.ir`) and GitHub (`https://github.com/Greenhawk5/Buckshot-Tracker`).
  - In-app feedback submission modal allowing players to submit encrypted bug reports and feature requests directly to the cloud backend.
- **Private Owner Command Center (`OwnerLayout.tsx`):**
  - Strictly gated server-side exclusively to Telegram user ID `184202422`.
  - **Overview & Pulse:** Total observed users, rolling UTC active user metrics (`24h`, `7d`, `30d`, `90d`, `180d`, `365d`), sessions created, actions recorded, and tactical activity matrix.
  - **Advanced Analytics:** Comparative growth metrics with formatted delta indicators, 4-cell active user anchors strip (DAU, WAU, MAU, Avg Sess/User), smooth progression curve (`TacticalAreaChart`), multi-segment event distribution (`TaxonomyDonutChart`), and custom date range filters.
  - **User Registry & Management:** Searchable player directory with Unicode preservation, mutable handle resolution, player detail drawer with activity timeline, private owner notes & display aliases, VIP playtester tagging, and application-level restriction controls.
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

### Improved
- **Owner Command Center UI/UX & Information Density:**
  - Redesigned Overview and Analytics metric cards into an ultra-compact 2×2 mobile grid (`repeat(2, 1fr)`), reducing card heights to ~66px.
  - Replaced oversized Active User Anchors card with a sleek 50px-high 4-cell Telemetry Strip (`DAU`, `WAU`, `MAU`, `Avg Sess/User`).
  - Reduced total above-the-fold content stack to 465px, enabling complete dashboard visibility without initial mobile scrolling.
- **Adaptive Data Visualizations:**
  - Implemented dynamic time-series bucketing (2h, 1d, 3d, 7d, 14d, 30d) across ranges (`24h`, `7d`, `30d`, `90d`, `180d`, `365d`) guaranteeing 7–14 readable columns across all screen widths down to 320px.
  - Guaranteed mathematical data integrity: unique active users per bucket are computed via discrete `Set` deduplication rather than sums of daily counts.
  - Eliminated duplicate `GridBarChart` in Analytics view, dedicating Overview to discrete tactile bars and Analytics to continuous progression curves (`TacticalAreaChart`) and compositional rings (`TaxonomyDonutChart`).
- **Navbar Stability & Trajectory Algorithm:**
  - Eliminated multi-rotation scrolling loops by replacing hardcoded set selectors with a closest-instance minimal-distance trajectory algorithm.
  - Added programmatic scroll state machine with boundary lock to prevent circular animation fighting during adjacent tab clicks and manual drags.
- **Application Header Responsiveness:**
  - Reorganized app header into a flexible brand identity container, dedicated action buttons (About and Owner Panel), and responsive user status indicator.
  - Ensured zero clipping and zero horizontal overflow across viewports from 320px to 1024px.
- **About Page Responsive Section Headers:**
  - Added responsive stacking on mobile screens ($\le 480$px) so section headings receive 100% of the content width and render on a single clean line.
  - Enforced `white-space: nowrap` and `flex-shrink: 0` on badges (`.section-tag-badge`), preventing mid-word breaks and multi-line squishing (`8 SYSTEMS`, `OPEN SOURCE`).

### Fixed
- **Atomic Broadcast CAS Claiming:**
  - Replaced in-memory recipient claiming with an atomic database compare-and-swap mechanism in `batch-processor.js`, preventing race conditions and double claims under concurrent batch execution.
- **Server-Side Maintenance Mode Enforcement:**
  - Implemented strict server-side checks rejecting non-owner session mutations and tracking events during active maintenance windows while allowing administrative access.
- **Ultra-Narrow Chart Header Collision:**
  - Added flex wrapping and gap spacing to `.area-chart-header` and `.grid-bar-header` to prevent title and counter overlap on 320px screens.

### Security
- Cryptographic owner authorization guard (`requireOwner`) independently enforced on all administrative endpoints strictly for Telegram user ID `184202422`.
- Client-supplied IDs in request payloads, query parameters, or local storage are strictly ignored.
- Automated CSV formula injection neutralization (`=`, `+`, `-`, `@`) on all exported datasets.
- Append-only security audit log recording actor ID, action, target entity, timestamp, outcome, and sanitized parameters.
- Server-side maintenance mode enforcement blocking unauthorized state mutations.

### Testing & Quality
- **97 Passing Vitest Tests:** Complete test suite covering core game logic, burner phone intel invariants, session persistence, backend endpoints, owner authentication, atomic CAS claiming, and analytics aggregation across 8 test suites.
- **Zero TypeScript Errors:** Strict typechecking verified with `tsc --noEmit`.
- **Zero Horizontal Overflow:** Verified across 8 responsive viewports (320px, 360px, 375px, 390px, 430px, 600px, 768px, 1024px).

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
