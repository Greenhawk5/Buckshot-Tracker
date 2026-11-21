# Analytics & Telemetry Design — Buckshot Tracker v1.2.0

---

## 1. Core Principles

1. **Explicit Event Logging:** Telemetry is grounded strictly in explicit, recorded actions.
2. **Zero Fabrication:** If an event was not recorded (e.g. prior to the v1.2.0 release), it is reported as uncollected rather than fabricated or assumed.
3. **UTC Normalization:** All persisted timestamps and time window boundaries are computed in UTC.
4. **Idempotent Recording:** Every event supports an idempotency key (`eventId`) to ensure network retries never duplicate metrics.
5. **Bounded Metadata:** Event metadata is schema-controlled, sanitized, and size-bounded (<= 2048 bytes). No credentials, session tokens, or raw Telegram `initData` are ever stored.
6. **Best-Effort Failure Strategy:** Analytics write errors are caught and logged server-side so that an analytics failure never interrupts or blocks core ammunition tracking.

---

## 2. Event Taxonomy

| Event Type | Category | Description | Trigger Point |
|---|---|---|---|
| `app_opened` | `app` | Mini App opened/initialized | App startup (`recordAppOpen`) |
| `session_created` | `tracker` | New tracker session created | `createSession` endpoint |
| `shot_recorded` | `tracker` | Live or blank shot committed | `recordShot` endpoint |
| `shell_ejected` | `tracker` | Beer Can ejection committed | `ejectShell` endpoint |
| `shell_intel_added` | `tracker` | Burner Phone intelligence added | `addShellIntel` endpoint |
| `shell_intel_removed` | `tracker` | Intel entry cleared | `removeShellIntel` endpoint |
| `undo_executed` | `tracker` | Last shot or ejection rolled back | `undoLastAction` endpoint |
| `session_completed` | `tracker` | Chamber empty (0 live, 0 blank) | `recordShot` / `ejectShell` |
| `session_abandoned` | `tracker` | Session abandoned by player | `abandonSession` endpoint |
| `feedback_submitted` | `feedback` | Player submitted feedback/bug report | `submitFeedback` endpoint |
| `broadcast_interaction` | `broadcast` | Broadcast interaction recorded | Campaign handlers |

---

## 3. Time Windows & Calculation

### 3.1 Presets
- **`24h`:** Rolling 24 hours (`now - 86,400,000 ms`).
- **`7d`:** Rolling 7 days (`now - 604,800,000 ms`).
- **`30d`:** Rolling 30 days (`now - 2,592,000,000 ms`).
- **`90d`:** Rolling 90 days (`now - 7,776,000,000 ms`).
- **`180d`:** Rolling 180 days (`now - 15,552,000,000 ms`).
- **`365d`:** Rolling 365 days (`now - 31,536,000,000 ms`).
- **`custom`:** Explicit `customStart` to `customEnd` timestamps.

### 3.2 Comparison Windows
Every metric query calculates an equivalent prior period immediately preceding the selected window:
`previousStartTime = startTime - (endTime - startTime)`
`previousEndTime = startTime`

---

## 4. Metric Definitions

- **Total Users:** Distinct count of all observed Telegram identities in `users` table.
- **Active Users:** Distinct count of users with at least one qualifying activity event in the selected interval.
- **New Users:** Users whose `firstSeenAt` timestamp falls within the selected interval.
- **Returning Users:** Active users in the interval whose `firstSeenAt` precedes `startTime`.
- **DAU / WAU / MAU:** Active user counts over rolling 24h, 7d, and 30d anchors from current execution time.
- **Actions Recorded:** Sum of all `shot_recorded`, `shell_ejected`, `shell_intel_added`, `shell_intel_removed`, and `undo_executed` events.
