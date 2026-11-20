# Owner Command Center Specification & Reference

> **Authorized Owner Telegram ID:** `184202422`\
> **Release Target:** `v1.2.0`\
> **Security Policy:** Cryptographically verified server-side identity only (`ctx.initData.user.id`).

---

## 1. Overview

The **Owner Command Center** is a private, owner-only operational suite built directly into the Buckshot Tracker Telegram Mini App. It provides telemetry, player management, multimedia campaigns, operational controls, and audit trails without complicating the main single-player game tracker.

---

## 2. Security & Access Boundary

### 2.1 The Single-Owner Policy
Access to all administrative endpoints and administrative interfaces is restricted exclusively to Telegram user ID `184202422`.

### 2.2 Server-Side Authorization (`requireOwner`)
- The backend never trusts client-supplied user IDs, roles, body parameters, or query parameters.
- Every protected endpoint imports and invokes `requireOwner(ctx)` as its first instruction.
- The platform guarantees `ctx.initData` was signed with the official Telegram Bot token. Invalid or tampered requests are rejected with HTTP 401 before an endpoint executes.
- If the authenticated caller ID is not `'184202422'`, the endpoint rejects the call immediately with an `EndpointError` having code `FORBIDDEN` (HTTP 400 with description: *"Forbidden: Owner authorization required."*).
- Non-owners never receive sensitive user lists, telemetry, or system health details.

---

## 3. Command Center Modules

### 3.1 Overview
- Telemetry totals: total observed users, active users in selected period, sessions created, actions recorded.
- Activity velocity: Time-series event histograms across rolling presets (`24h`, `7d`, `30d`, `90d`, `180d`, `365d`).
- Rolling active user anchors: Daily Active Users (DAU), Weekly Active Users (WAU), Monthly Active Users (MAU).

### 3.2 Analytics
- Deep period analysis with custom date ranges.
- Event taxonomy distribution (e.g. `shot_recorded`, `shell_ejected`, `session_created`, `app_opened`).
- Comparative growth metrics (current period vs. prior equivalent period).

### 3.3 Users Registry & Management
- Searchable directory of observed Telegram accounts (by ID, username, name, or private alias).
- User detail drawer:
  - Account statistics (total sessions, completed games, action volume).
  - Chronological activity timeline.
  - Private owner notes & display aliases (visible only to the owner).
  - VIP playtester tagging.
  - Application-level access restriction (prevents malicious/spam users from creating sessions, while owner account is strictly protected from restriction).

### 3.4 Multimedia Broadcast Center
- Campaign composer supporting all Telegram Bot API media types:
  - Text (HTML parse mode)
  - Photo with caption
  - Video with caption
  - Voice note with caption
  - Video note (circular bubble)
  - Document / file attachment
- Audience targeting presets:
  - All eligible users (automatically excludes blocked accounts and owner)
  - Active in last 7 or 30 days
  - Inactive in last 30 days
  - New users (first seen < 7 days)
  - VIP playtesters
  - Custom user ID selection
- Resumable queue processor:
  - Bounded batch execution (5-10 recipients per invocation).
  - Safe lease timestamps prevent duplicate concurrent sends.
  - Rate-limit handling (429 `retry_after`) with automatic exponential backoff.
  - Automatic permanent failure classification for 403 (bot blocked by user).
  - Campaign lifecycle controls: Start, Pause, Resume, Cancel, Retry.

### 3.5 System Health & Diagnostics
- Live SQLite database latency check.
- Durable storage row volume (users, sessions, events, campaigns).
- Broadcast queue telemetry (pending, sending, failed).

### 3.6 System Settings
- Maintenance mode toggle and announcement message.
- Emergency global broadcast pause switch.
- In-app announcement banner text and activation toggle.
- Broadcast inter-send pacing delay (ms).

### 3.7 Audit Logs
- Append-only administrative log of all owner operations.
- Captures actor ID, action, target entity, timestamp, and sanitized details.

### 3.8 Feedback & Reports
- In-app feedback management: review user bug reports and feature requests.
- Update report status (`new`, `reviewing`, `resolved`, `dismissed`) and record owner responses.

### 3.9 Reports & Exports
- One-click export for Users, Events, Sessions, Campaigns, Audit, and Feedback.
- Available in CSV (with automated spreadsheet formula injection protection) and JSON formats.
