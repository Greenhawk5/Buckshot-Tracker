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
