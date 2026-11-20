# Release & Migration Verification Checklist — v1.2.0

> **Baseline:** `v1.0.0`\
> **Target Release:** `v1.2.0`\
> **Owner Telegram ID:** `184202422`

---

## Phase 0: Baseline & Environment Verification
- [x] All 53 v1.0.0 regression tests pass cleanly.
- [x] Git branch `develop/1.2.0` branched cleanly from verified `main`.
- [x] `@tgcloud/cli` platform constraints audited (`endpoints/` flat one-level, `lib/` nested).

## Phase 1: Database Foundation
- [x] `tgcloud/schema.js` updated with non-destructive, additive tables (`users`, `activity_events`, `broadcast_campaigns`, `broadcast_recipients`, `admin_audit_logs`, `app_settings`, `feedback_reports`).
- [x] Existing tables `tracker_sessions` and `processed_operations` preserved without alterations.
- [x] `tests/sdk-mock.ts` expanded with in-memory stores, builder methods, and Bot API mock.

## Phase 2: User Registry & Activity Tracking
- [x] `user-service.js` implemented with Unicode preservation, mutable usernames, and application-level restriction checking.
- [x] `event-service.js` implemented with event catalog, idempotency, and bounded metadata.
- [x] `metrics-service.js` implemented with rolling UTC time windows (`24h`, `7d`, `30d`, `90d`, `180d`, `365d`, `custom`).
- [x] Existing game endpoints integrated with non-blocking user & activity tracking.

## Phase 3: Owner Authorization & Protected APIs
- [x] Shared `requireOwner` guard enforcing Telegram ID `184202422`.
- [x] Negative authorization tests verified for forged IDs, unauthenticated calls, and non-owner callers.
- [x] Immutable administrative audit logger `recordAuditLog` implemented.

## Phase 4: Owner Command Center UI
- [x] Mobile-first layout with soft-industrial design tokens in `OwnerLayout.tsx`.
- [x] Responsive navigation tabs: Overview, Analytics, Users, Broadcasts, Health, Settings, Audit, Feedback, Exports.
- [x] Telemetry cards, rolling active user anchors, and activity histograms.

## Phase 5: Advanced Analytics & User Management
- [x] User list with search, filter chips (VIP, Restricted, Active), and pagination.
- [x] User detail drawer with activity stats, timeline, private aliases, and owner notes.
- [x] Safe restriction / unrestrict controls with Owner self-protection.

## Phase 6: Multimedia Broadcast Center
- [x] Composer supporting Text, Photo, Video, Voice, Video Note, and Document message types.
- [x] Audience segmentation and pre-send recipient count preview.
- [x] Bounded batch processor (`ownerProcessBroadcastBatch`) with atomic leasing.
- [x] Rate limit backoff (429 `retry_after`) and permanent error classification (403 blocked).

## Phase 7: Operations, Settings, Feedback & Exports
- [x] System health diagnostics checking SQLite round-trip latency.
- [x] Server-authoritative system settings with emergency broadcast pause.
- [x] Feedback submission and review system.
- [x] CSV and JSON report exports with automated formula injection protection.

## Phase 8: Public About Experience
- [x] About page accessible from header info button.
- [x] Canonical application configuration (`APP_CONFIG` in `src/config/app.config.ts`).
- [x] Verified external links to Creator Portfolio (`https://alifaniani.ir`) and GitHub.
- [x] Build version information canonically sourced as `1.2.0`.

## Phase 9: Quality Assurance & Build Hardening
- [x] Full automated test suite passes (82 tests across 7 test files).
- [x] TypeScript compiler (`tsc --noEmit`) passes with 0 errors.
- [x] Production build (`vite build`) succeeds.
- [x] Documentation deliverables updated and complete.
