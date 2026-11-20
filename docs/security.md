# Security, Privacy & Audit Policy

---

## 1. Threat Model & Trust Boundary

### 1.1 Telegram Cryptographic Signature
Telegram Mini Apps pass signed authorization data in `Telegram.WebApp.initData`. The Telegram Serverless platform cryptographically validates the HMAC signature using the Bot token before request dispatch:
- Requests with invalid or missing init data receive HTTP 401 and are rejected before endpoint execution.
- `ctx.initData.user` contains the platform-verified caller identity.

### 1.2 Owner Authorization Guard
- Server-side guard `requireOwner(ctx)` enforces that `String(ctx.initData.user.id) === '184202422'`.
- Client-supplied identifiers in request payloads (`ownerId`, `userId`, etc.) are completely ignored.
- Non-owners receive HTTP 400 with code `FORBIDDEN`.

### 1.3 Verified Inventory of Protected Administrative Endpoints (24 Endpoints)
The repository contains exactly **24 administrative endpoints**, each located in `tgcloud/endpoints/` and protected by `requireOwner(ctx)` as its first instruction:

| # | Endpoint File | Administrative Capability | Guard Verified |
|---|---|---|:---:|
| 1 | `tgcloud/endpoints/ownerCancelCampaign.js` | Cancels in-progress or queued broadcast campaign | Yes |
| 2 | `tgcloud/endpoints/ownerCreateCampaign.js` | Composes and snapshots new multimedia campaign | Yes |
| 3 | `tgcloud/endpoints/ownerExportReport.js` | Exports sanitized telemetry datasets in CSV or JSON | Yes |
| 4 | `tgcloud/endpoints/ownerGetAnalytics.js` | Computes rolling analytics, trends, and event breakdown | Yes |
| 5 | `tgcloud/endpoints/ownerGetAuditLogs.js` | Queries immutable administrative security logs | Yes |
| 6 | `tgcloud/endpoints/ownerGetCampaign.js` | Fetches campaign details and recipient breakdown | Yes |
| 7 | `tgcloud/endpoints/ownerGetOverview.js` | Computes primary Command Center KPI metrics | Yes |
| 8 | `tgcloud/endpoints/ownerGetSettings.js` | Reads system settings and operational parameters | Yes |
| 9 | `tgcloud/endpoints/ownerGetSystemHealth.js` | Returns SQLite latency, table volume, and health | Yes |
| 10 | `tgcloud/endpoints/ownerGetUserDetails.js` | Fetches player details, activity timeline, and stats | Yes |
| 11 | `tgcloud/endpoints/ownerListCampaigns.js` | Paginates broadcast campaigns list | Yes |
| 12 | `tgcloud/endpoints/ownerListFeedback.js` | Lists player feedback submissions | Yes |
| 13 | `tgcloud/endpoints/ownerListUsers.js` | Searches and filters player directory (VIP/Blocked) | Yes |
| 14 | `tgcloud/endpoints/ownerPauseCampaign.js` | Pauses running broadcast campaign | Yes |
| 15 | `tgcloud/endpoints/ownerPreviewCampaign.js` | Pre-calculates target audience recipient counts | Yes |
| 16 | `tgcloud/endpoints/ownerProcessBroadcastBatch.js` | Atomic Compare-And-Swap batch message dispatcher | Yes |
| 17 | `tgcloud/endpoints/ownerRestrictUser.js` | Restricts player from session creation / gameplay | Yes |
| 18 | `tgcloud/endpoints/ownerResumeCampaign.js` | Resumes paused broadcast campaign | Yes |
| 19 | `tgcloud/endpoints/ownerRetryCampaign.js` | Reschedules eligible retryable failed recipients | Yes |
| 20 | `tgcloud/endpoints/ownerStartCampaign.js` | Transitions draft campaign to queued / running | Yes |
| 21 | `tgcloud/endpoints/ownerUnrestrictUser.js` | Restores player access to gameplay features | Yes |
| 22 | `tgcloud/endpoints/ownerUpdateFeedback.js` | Updates feedback status and appends owner response | Yes |
| 23 | `tgcloud/endpoints/ownerUpdateSettings.js` | Modifies operational settings (maintenance, etc.) | Yes |
| 24 | `tgcloud/endpoints/ownerUpdateUserMetadata.js` | Updates private alias, VIP flag, and owner notes | Yes |

*Automated test verification:* `tests/owner-backend.test.ts` dynamically asserts that 100% of these 24 endpoints reject null, empty, or non-owner caller contexts.

### 1.4 Maintenance Mode Security & Access Boundary
- When `maintenanceMode` is enabled in `app_settings`, all session mutation endpoints (`createSession`, `recordShot`, `ejectShell`, `addShellIntel`, `removeShellIntel`, `undoLastAction`, `abandonSession`) strictly reject non-owner requests at the shared server boundary (`checkMaintenanceAccess`).
- Existing sessions remain preserved and readable via `getActiveSession`.
- The Owner (`184202422`) retains complete, uninhibited access to both the Owner Command Center and gameplay endpoints at all times, preventing lockout.

---

## 2. Privacy & Data Minimization

- **No Credential Storage:** Bot tokens, init data hashes, and session secrets are never stored in SQLite.
- **Sanitized Metadata:** Activity event metadata is stripped of sensitive keys and size-bounded (<= 2048 bytes).
- **Private Aliases:** Owner display aliases and notes are stored exclusively in the private user registry and never exposed on public endpoints.

---

## 3. Administrative Audit Trail

Every state-changing administrative operation creates an immutable entry in `admin_audit_logs`:
- User restriction / unrestriction
- User metadata / VIP updates
- Campaign creation, start, pause, resume, cancel, and retries
- System settings modifications
- Telemetry data exports

Audit records contain actor ID, action, target entity, timestamp, outcome, and sanitized parameters.

---

## 4. Spreadsheet Formula Injection Protection

When exporting data to CSV format, all values beginning with formula prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`) are automatically escaped with a leading single quote (`'`) to neutralize CSV injection attacks when opened in Microsoft Excel or Google Sheets.
