# Security Policy

## Supported Versions

Only the latest stable release of **Buckshot Tracker** receives active security fixes.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting a Vulnerability

We take the security of Buckshot Tracker and its users seriously.

If you discover a security vulnerability, please **do not** open a public issue. Instead, report it privately through GitHub:

1. Navigate to the repository's [Security Advisories](https://github.com/Greenhawk5/Buckshot-Tracker/security/advisories) tab.
2. Click **Report a vulnerability**.
3. Provide a clear description of the potential vulnerability, including reproduction steps, affected endpoints or components, and any potential impact.

Maintainers will acknowledge receipt of your vulnerability report within 72 hours and provide updates as the issue is investigated and remediated.

---

## Security Model & Guidelines

- **Cryptographic Authentication:** The Telegram Serverless endpoints validate caller identity exclusively via cryptographically signed `initData` provided by the Telegram platform.
- **Tenant Isolation:** All database records and session mutations are scoped strictly to the authenticated `user.id`.
- **Zero Stored Secrets:** No bot tokens, encryption keys, or sensitive credentials are ever bundled in client code or stored in client-side persistence.
