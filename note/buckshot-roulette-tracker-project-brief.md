# Buckshot Roulette Tracker

## Product Requirements, Technical Architecture, UX Specification, and Implementation Roadmap

**Document type:** Product & Engineering Brief\
**Version:** 1.0\
**Status:** Ready for implementation planning\
**Primary platform:** Telegram Mini App\
**Backend platform:** Telegram Serverless (already enabled for the
target Telegram bot)\
**Working product name:** Buckshot Roulette Tracker

------------------------------------------------------------------------

## 1. Project Overview

Build a lightweight, polished Telegram Mini App that helps players of
**Buckshot Roulette** keep track of the live and blank shells remaining
in the shotgun during a round.

The app is a companion utility, not a game implementation. It must not
attempt to control, inspect, or modify the Buckshot Roulette game. Users
manually enter the initial ammunition counts and manually record each
shot or shell-removal action.

The experience should be extremely fast during gameplay: users should be
able to identify the remaining ammunition and record a shot with one
deliberate tap.

### 1.1 Product goals

1.  Provide an accurate live/blank ammunition counter.
2.  Make recording a shot fast and unambiguous.
3.  Support undo so accidental taps can be corrected.
4.  Preserve the active session when the Mini App is closed or
    refreshed.
5.  Provide a high-quality, responsive, game-inspired interface.
6.  Run the backend and host the Mini App using the Telegram Serverless
    platform, avoiding a separate VPS or external backend unless a
    verified platform limitation makes it necessary.

### 1.2 Non-goals for V1

-   Implementing Buckshot Roulette itself.
-   Reading game memory, screen contents, or game files.
-   Automatically detecting which shell was fired.
-   Multiplayer synchronization between players.
-   Accounts or passwords separate from Telegram identity.
-   Competitive rankings, leaderboards, achievements, or social
    features.
-   Guessing the actual order of shells in the shotgun.
-   Treating statistical probability as a prediction of the next shell.

------------------------------------------------------------------------

## 2. Platform and Architecture Decisions

### 2.1 Telegram Mini App, not Telegram Games

Implement the interface as a **Telegram Mini App**: a web application
opened inside Telegram.

Do not use the legacy Telegram Games API. The product does not need game
scores, game callbacks, or leaderboard functionality. It needs a full
interactive application interface with buttons, state, and persistent
data.

The bot is the entry point. The Mini App is the actual user interface.

### 2.2 Telegram Serverless

The target Telegram bot already exists and Telegram Serverless has
already been enabled for it.

Use Telegram Serverless for the backend and, where supported by the
current platform tooling, Mini App hosting. Do not create a separate
VPS, Cloudflare Worker, Firebase project, Supabase project, or other
external backend for V1.

**Important implementation requirement:** Telegram Serverless is a
platform-specific runtime. Before writing backend code, inspect the
current official Telegram Serverless documentation and the actual
installed CLI/SDK version. Confirm the current project layout, endpoint
conventions, database API, deployment commands, hosting workflow, and
runtime limitations. Do not assume that a generic Node.js server,
Express, filesystem access, arbitrary npm packages, or standard Node
APIs are supported.

Use only APIs and project conventions confirmed by the current official
documentation and generated project template.

### 2.3 Proposed high-level architecture

``` text
Telegram Client
    |
    | Opens the bot's Mini App
    v
Telegram Bot
    |
    | Launches the configured Mini App URL
    v
Telegram Mini App (React + TypeScript)
    |
    | Telegram Mini App SDK / documented Serverless client API
    v
Telegram Serverless Endpoints
    |
    | Validated user identity and application operations
    v
Telegram Serverless SQLite Database
```

The frontend should remain usable during a short network interruption by
maintaining a local working state. Server persistence should be
synchronized safely when connectivity is available.

### 2.4 Frontend technology

Preferred stack:

-   React
-   TypeScript
-   Vite
-   CSS Modules or a carefully structured CSS system
-   CSS variables for design tokens
-   Telegram Mini Apps SDK or the officially recommended integration
    method

Tailwind CSS is optional. Do not add a styling framework merely for
convenience if it complicates the visual system or build process.

Use a small dependency set. Avoid unnecessary component libraries and
large animation packages.

### 2.5 Backend technology

-   Telegram Serverless runtime and its official SDK.
-   JavaScript or TypeScript only if the platform's current toolchain
    officially supports it.
-   SQLite through the platform's documented database interface.
-   Server-side validation for every operation that changes persistent
    state.

Do not implement a conventional long-running Node.js HTTP server unless
the current platform documentation explicitly requires or supports that
deployment model.

------------------------------------------------------------------------

## 3. Core User Experience

### 3.1 Primary user journey

1.  The user opens the bot in Telegram.
2.  The user taps the Mini App launch button.
3.  The Mini App loads and identifies the Telegram user through
    Telegram's supported launch/authentication data.
4.  The app checks for an existing active ammunition session.
5.  If an active session exists, show the tracker and restore its state.
6.  If no active session exists, show the setup screen.
7.  The user enters the initial live and blank shell counts.
8.  The user starts the load.
9.  The tracker displays the remaining counts and shot controls.
10. After each shot, the user taps the corresponding shell type.
11. The application updates the counts and event history.
12. The user can undo the last action, start a new load, or close the
    Mini App.
13. On reopening, the active session is restored.

### 3.2 Main screens and states

The application should feel like one focused utility, not a multi-page
admin dashboard.

#### Screen A: Setup

Purpose: define the ammunition loaded into the shotgun.

Required elements:

-   Product mark/name.
-   Clear `NEW LOAD` or equivalent heading.
-   Live shell counter.
-   Blank shell counter.
-   Increment and decrement controls for both counters.
-   Total shell count.
-   Start/Load button.
-   Optional small helper text explaining the two shell types.

Behavior:

-   Counts must be integers.
-   Counts cannot be negative.
-   The total must be greater than zero to start a load.
-   Apply a sensible configurable maximum to prevent accidental or
    unreasonable values. Do not hard-code an assumed game maximum unless
    it is verified against the intended game mode.
-   The Start button must be disabled when the input is invalid.
-   Starting a new load while another session is active must require a
    clear confirmation, because it replaces the current load.

#### Screen B: Active Tracker

This is the most important screen and should receive the greatest design
attention.

Required elements:

-   Session status (for example, `ACTIVE`).
-   Large remaining live count.
-   Large remaining blank count.
-   Total remaining count.
-   Visual ammunition indicator.
-   Large `LIVE SHOT` action.
-   Large `BLANK SHOT` action.
-   Undo action.
-   New Load / Reset action.
-   Optional probability indicator.
-   Optional compact action-history preview.

The two shot buttons must be visually distinct and easy to tap:

-   Live: red visual treatment.
-   Blank: blue visual treatment.

Do not rely on color alone. Each action must also have a clear text
label and, where useful, a recognizable icon.

Behavior:

-   Tapping `LIVE SHOT` decrements only the live count.
-   Tapping `BLANK SHOT` decrements only the blank count.
-   Reject an action if that shell type has zero remaining.
-   Do not show a confirmation dialog for every shot.
-   Update the UI immediately after a valid tap.
-   Record every successful action in the session event history.
-   Provide subtle, short feedback for a successful action.
-   Prevent accidental duplicate processing from rapid repeated taps.

#### Screen C: Completed / Empty

Show this state when both remaining counts reach zero.

Required elements:

-   Clear completed/empty state.
-   Final shot count or concise session summary.
-   `NEW LOAD` action.
-   No active shot buttons.

Do not leave enabled controls that could create negative counts.

#### Screen D: Error / Offline / Sync state

Provide unobtrusive status feedback for:

-   Offline operation.
-   Pending synchronization.
-   Successful synchronization.
-   Failed synchronization.
-   Session recovery or conflict.

Do not block ordinary local tracking just because the backend is
temporarily unreachable. Explain that changes are pending
synchronization when appropriate.

------------------------------------------------------------------------

## 4. Core Domain Model and Counting Rules

### 4.1 Session state

Represent the active load with a clearly defined state model.

Suggested TypeScript model:

``` ts
type SessionStatus = "active" | "completed";

type ShellType = "live" | "blank";

interface ShotEvent {
  id: string;
  type: "shot";
  shell: ShellType;
  createdAt: number;
}

interface EjectEvent {
  id: string;
  type: "eject";
  shell: ShellType | "unknown";
  createdAt: number;
}

type SessionEvent = ShotEvent | EjectEvent;

interface TrackerSession {
  id: string;
  userId: string;
  initialLive: number;
  initialBlank: number;
  liveRemaining: number;
  blankRemaining: number;
  status: SessionStatus;
  events: SessionEvent[];
  version: number;
  createdAt: number;
  updatedAt: number;
}
```

The exact implementation may differ, but the domain semantics must
remain consistent.

### 4.2 Invariants

Always preserve these rules:

1.  `initialLive` and `initialBlank` are non-negative integers.
2.  `liveRemaining` and `blankRemaining` are non-negative integers.
3.  Neither remaining count can exceed its corresponding initial count.
4.  `totalRemaining = liveRemaining + blankRemaining`.
5.  A successful live shot reduces only `liveRemaining` by one.
6.  A successful blank shot reduces only `blankRemaining` by one.
7.  An invalid operation must not partially mutate state.
8.  A completed session has zero remaining shells of both types.
9.  A session's event history must be sufficient to reconstruct its
    current state.
10. Undo must reverse the most recent reversible event without
    corrupting earlier events.

### 4.3 Probability display

The probability indicator is optional but recommended for V1 because it
is easy to calculate and useful during play.

When total remaining ammunition is greater than zero:

``` text
P(Live) = liveRemaining / totalRemaining * 100
P(Blank) = blankRemaining / totalRemaining * 100
```

Display rounded values, but use exact integer counts for all internal
calculations.

Label these values as **remaining composition** or **statistical
probability**, not as knowledge of the next shell's actual position.

The app must never claim to know the next shell.

When total remaining ammunition is zero, do not divide by zero. Hide the
probability display or show a neutral completed state.

### 4.4 Undo

Undo must reverse the most recent applicable user action.

For a shot event:

-   If the last event is a live shot, restore one live shell.
-   If the last event is a blank shot, restore one blank shell.

For an eject event, restore the shell only if its type was known and the
event model supports a reversible restoration.

For V1, the simplest safe implementation is to support undo for shot
events only. If an event type cannot be safely reversed, do not silently
guess.

Undo should be disabled when there are no reversible events.

### 4.5 Eject / Beer mechanic

Buckshot Roulette includes mechanics that can remove a shell without
firing it. A future version may support an explicit `EJECT` action for
the Beer item.

Do not model ejection as a shot.

For a known shell type:

-   Decrement the corresponding remaining count.
-   Record an eject event.
-   Allow undo if the event is still the most recent reversible event.

For an unknown shell type:

-   Do not arbitrarily decrement live or blank.
-   V2 may introduce an uncertainty-aware state model that tracks total
    remaining shells and the possible live/blank range.
-   Until that model exists, do not expose an unknown-type eject
    control.

This avoids false certainty in the tracker.

### 4.6 New load and reset semantics

Distinguish between:

-   **Undo:** reverse the last event.
-   **New Load:** create a fresh session with new initial counts.
-   **Abandon/Reset:** explicitly discard the current session.

Do not make Reset behave like Undo.

If a user attempts to replace an active session, show a confirmation
that clearly communicates that the current load will be discarded.

------------------------------------------------------------------------

## 5. Persistence, Offline Behavior, and Synchronization

### 5.1 General approach

The app must prioritize responsiveness while protecting session data.

Recommended approach:

1.  Maintain the current session in frontend application state.
2.  Persist a local recovery copy using a suitable browser storage
    mechanism supported by Telegram's Mini App environment.
3.  Send updates to the Serverless backend.
4.  Show a pending-sync state if persistence has not completed.
5.  Retry synchronization safely when connectivity returns or the app
    resumes.

Use only storage APIs supported by the target Telegram clients. Do not
assume local storage is always available or that it is a secure source
of identity.

### 5.2 Server persistence

The server-side database is the authoritative cross-device persistence
layer.

Suggested logical table:

``` sql
CREATE TABLE tracker_sessions (
    id TEXT PRIMARY KEY,
    telegram_user_id TEXT NOT NULL,
    initial_live INTEGER NOT NULL,
    initial_blank INTEGER NOT NULL,
    live_remaining INTEGER NOT NULL,
    blank_remaining INTEGER NOT NULL,
    status TEXT NOT NULL,
    events_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_tracker_sessions_user_updated
ON tracker_sessions (telegram_user_id, updated_at);
```

Adapt the SQL to the exact migration syntax and database conventions of
Telegram Serverless. If the platform uses a different schema-management
interface, follow that interface instead.

For V1, maintain one active session per Telegram user. Completed
sessions may be retained for a limited period or replaced according to a
documented retention policy. Do not add a large analytics schema without
a product requirement.

### 5.3 Concurrency and stale writes

A user may open the Mini App in more than one Telegram client.

Use optimistic concurrency:

-   Each persisted session has a monotonically increasing `version`.
-   A write includes the version the client last read.
-   The server validates that version before applying the write.
-   If the version is stale, return a conflict response with the latest
    server state.
-   The frontend must resolve the conflict deliberately rather than
    blindly overwriting newer data.

Do not rely only on client timestamps to resolve concurrent updates.

### 5.4 Idempotency

Every mutation should include a unique operation ID.

The backend should avoid applying the same operation twice if the client
retries after a timeout.

A repeated request with the same operation ID must not decrement the
count again.

Use a small operation log or another documented, reliable mechanism to
enforce idempotency.

### 5.5 Identity and security

-   Use Telegram's documented Mini App authentication/launch data flow.
-   Validate Telegram initialization data on the server using the
    official Serverless mechanism or documented verification API.
-   Never trust a user ID supplied only by the frontend.
-   Derive the authenticated Telegram user identity from validated
    server context.
-   Scope every database read and write to the authenticated user.
-   Never return another user's session.
-   Validate all integer counts and operation types on the backend.
-   Do not expose bot tokens, signing secrets, or server credentials in
    frontend bundles.
-   Do not store secrets in Git.
-   Do not log sensitive authentication payloads.
-   Use parameterized SQL or the platform's safe query interface.

The backend must reject unauthenticated or malformed requests.

------------------------------------------------------------------------

## 6. Backend API Contract

Implement only the endpoints needed for V1. Endpoint naming and file
placement must follow the current Telegram Serverless conventions.

Suggested logical operations:

### 6.1 `getActiveSession`

**Purpose:** Retrieve the authenticated user's active session.

Response:

``` json
{
  "ok": true,
  "session": {
    "id": "session-id",
    "initialLive": 4,
    "initialBlank": 3,
    "liveRemaining": 2,
    "blankRemaining": 2,
    "status": "active",
    "version": 5,
    "events": []
  }
}
```

If no active session exists:

``` json
{
  "ok": true,
  "session": null
}
```

### 6.2 `createSession`

**Purpose:** Create a new load.

Input:

``` json
{
  "initialLive": 4,
  "initialBlank": 3,
  "operationId": "unique-operation-id"
}
```

Requirements:

-   Validate both counts.
-   Validate the total and configured maximum.
-   Confirm replacement if an active session exists. The confirmation is
    a frontend UX step; the backend must still enforce an explicit
    replacement flag or equivalent policy.
-   Derive the user identity from validated Telegram context.
-   Return the newly persisted session.

### 6.3 `recordShot`

**Purpose:** Record a live or blank shot.

Input:

``` json
{
  "sessionId": "session-id",
  "shell": "live",
  "expectedVersion": 5,
  "operationId": "unique-operation-id"
}
```

Requirements:

-   Validate the session belongs to the authenticated user.
-   Validate the shell type.
-   Validate the expected version.
-   Validate that the selected shell count is greater than zero.
-   Apply the mutation atomically.
-   Append the event.
-   Update status and version.
-   Return the updated session.

### 6.4 `undoLastAction`

**Purpose:** Undo the most recent reversible action.

Input:

``` json
{
  "sessionId": "session-id",
  "expectedVersion": 6,
  "operationId": "unique-operation-id"
}
```

Requirements:

-   Validate ownership and version.
-   Confirm there is a reversible event.
-   Restore the correct shell count.
-   Remove or mark the event as undone according to the chosen
    event-history model.
-   Return the updated session.

### 6.5 `abandonSession`

**Purpose:** Explicitly abandon the active load.

Input:

``` json
{
  "sessionId": "session-id",
  "expectedVersion": 7,
  "operationId": "unique-operation-id"
}
```

Requirements:

-   Validate ownership and version.
-   Require explicit user intent in the UI.
-   Mark the session abandoned or apply the chosen retention policy.
-   Never silently discard a session due to an ordinary screen
    navigation.

### 6.6 API response conventions

Use a consistent response format:

``` ts
interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiError {
  ok: false;
  error: {
    code:
      | "UNAUTHORIZED"
      | "VALIDATION_ERROR"
      | "NOT_FOUND"
      | "OUT_OF_STOCK"
      | "VERSION_CONFLICT"
      | "DUPLICATE_OPERATION"
      | "INTERNAL_ERROR";
    message: string;
    latestSession?: unknown;
  };
}
```

The exact wire format can be adjusted, but error codes must be
predictable and handled explicitly by the frontend.

------------------------------------------------------------------------

## 7. Visual Design Direction

### 7.1 Design concept

Create a premium, dark, industrial interface inspired by the atmosphere
of Buckshot Roulette without copying copyrighted game artwork, logos, or
proprietary assets.

The interface should feel:

-   Dark and atmospheric.
-   Minimal and focused.
-   Tactile and game-like.
-   Precise and readable.
-   Modern rather than cluttered.
-   Appropriate for quick use during a game.

Avoid generic AI-generated dashboard aesthetics, excessive gradients,
glowing borders everywhere, and decorative elements that reduce
readability.

### 7.2 Color system

Suggested starting tokens:

``` css
:root {
  --color-bg: #101113;
  --color-surface: #191b1f;
  --color-surface-raised: #22252a;
  --color-border: #34383f;
  --color-text: #f2f2f0;
  --color-muted: #999da5;

  --color-live: #ef626b;
  --color-live-soft: #3b2025;

  --color-blank: #65b5ee;
  --color-blank-soft: #1c3040;

  --color-success: #70c49b;
  --color-warning: #e6b86b;
}
```

These are initial design tokens, not mandatory final values. Refine
contrast and accessibility during implementation.

### 7.3 Typography

-   Use a highly legible interface font.
-   Use tabular numerals for ammunition counts.
-   Make remaining counts the strongest visual elements.
-   Keep labels concise and consistent.
-   Avoid overly distressed or decorative fonts for critical numbers.

### 7.4 Layout

-   Design mobile-first.
-   Support narrow phone screens.
-   Respect Telegram's safe areas and viewport behavior.
-   Keep the two primary shot controls reachable with the thumb.
-   Avoid horizontal scrolling.
-   Use responsive spacing.
-   Support portrait orientation as the primary layout.
-   Desktop should remain usable, but do not compromise the mobile
    experience to imitate a desktop dashboard.

### 7.5 Motion and feedback

Use short, purposeful animations:

-   A subtle count transition after a shot.
-   A small visual response on the selected shell action.
-   A clear but restrained completed state.
-   A brief Undo feedback state.
-   No long transitions that delay the next action.

Respect reduced-motion preferences where possible.

### 7.6 Accessibility

-   Do not communicate shell type through color alone.
-   Use accessible button labels.
-   Ensure adequate contrast.
-   Ensure touch targets are comfortably sized.
-   Support keyboard interaction on desktop.
-   Provide visible focus states.
-   Prevent text from becoming too small.

------------------------------------------------------------------------

## 8. Telegram Integration Requirements

### 8.1 Bot launch experience

The bot should provide a simple entry point.

Suggested `/start` behavior:

-   Send a concise welcome message.
-   Explain that the bot opens the ammunition tracker.
-   Provide a clear Mini App launch button.

Configure the bot's Main Mini App and/or Menu Button using the current
official BotFather and Telegram Bot API procedures.

Do not build a text-command-driven tracker. The actual tracking workflow
belongs in the Mini App.

### 8.2 Telegram Web App integration

Use the official Telegram Mini Apps SDK/API.

At startup:

-   Initialize the Telegram Web App integration.
-   Call the documented readiness method when appropriate.
-   Read the supported theme and viewport information.
-   Configure the supported header/background behavior.
-   Request fullscreen only when the API is supported and the user
    experience benefits from it.
-   Handle unsupported methods gracefully.
-   Do not assume that all Telegram clients support identical features.

### 8.3 Client compatibility

Test at minimum:

-   Telegram Android.
-   Telegram iOS, if available for testing.
-   Telegram Desktop.
-   Telegram Web, if supported by the chosen launch configuration.

Fullscreen and viewport behavior may differ between clients. The
application must remain usable without fullscreen support.

### 8.4 Launch data security

The frontend must not treat client-side Telegram user data as proof of
identity.

All authenticated backend operations must rely on the official
server-validated Telegram context provided by Telegram Serverless.

------------------------------------------------------------------------

## 9. Recommended Project Structure

The final structure must follow the generated Telegram Serverless
template. The following is a conceptual organization, not a claim about
mandatory CLI folder names.

``` text
buckshot-roulette-tracker/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── app.css
│   ├── components/
│   │   ├── ShellCounter.tsx
│   │   ├── ShotButton.tsx
│   │   ├── AmmoIndicator.tsx
│   │   ├── ProbabilityDisplay.tsx
│   │   ├── UndoButton.tsx
│   │   └── SyncStatus.tsx
│   ├── features/
│   │   └── tracker/
│   │       ├── tracker.types.ts
│   │       ├── tracker.reducer.ts
│   │       ├── tracker.logic.ts
│   │       ├── tracker.validation.ts
│   │       └── tracker.tests.ts
│   ├── hooks/
│   │   ├── useTrackerSession.ts
│   │   └── useTelegram.ts
│   ├── services/
│   │   ├── serverless.client.ts
│   │   ├── session.api.ts
│   │   └── local.persistence.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   └── global.css
│   └── main.tsx
├── tgcloud/
│   ├── handlers/
│   ├── endpoints/
│   ├── lib/
│   └── schema.js
├── public/
│   ├── icons/
│   └── assets/
├── tests/
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

If the official CLI generates a different structure, preserve its
required conventions and adapt this organization rather than forcing the
template into this exact tree.

Keep the counting logic independent from React components so it can be
unit-tested without rendering the UI.

------------------------------------------------------------------------

## 10. Testing and Quality Requirements

### 10.1 Unit tests

Test the domain logic independently.

Required cases:

1.  Create a session with valid counts.
2.  Reject negative counts.
3.  Reject non-integer counts.
4.  Reject an invalid total.
5.  Record a live shot.
6.  Record a blank shot.
7.  Reject a live shot when no live shells remain.
8.  Reject a blank shot when no blank shells remain.
9.  Ensure counts never become negative.
10. Calculate remaining totals correctly.
11. Calculate live/blank percentages correctly.
12. Undo a live shot.
13. Undo a blank shot.
14. Reject undo when no reversible event exists.
15. Mark a session completed when all shells are consumed.
16. Start a new session without corrupting the previous session's event
    data.

### 10.2 Backend tests

Test:

-   Unauthenticated request rejection.
-   Invalid payload rejection.
-   User ownership enforcement.
-   Session retrieval.
-   Session creation.
-   Shot mutation.
-   Undo mutation.
-   Stale version rejection.
-   Duplicate operation handling.
-   Concurrent mutation behavior.
-   Database migration behavior.

### 10.3 UI tests

Test:

-   Setup input controls.
-   Start button disabled/enabled states.
-   Live and blank actions.
-   Undo.
-   New load confirmation.
-   Completed state.
-   Loading state.
-   Offline indicator.
-   Sync failure and recovery.
-   Small screen layout.
-   Telegram viewport/safe-area behavior.

### 10.4 Manual acceptance checklist

The V1 release is not complete until all of the following are verified:

-   [ ] The bot opens the Mini App successfully.
-   [ ] The Mini App loads on a supported Telegram client.
-   [ ] A user can create a load.
-   [ ] Live and blank counts are displayed correctly.
-   [ ] A live shot decrements only the live count.
-   [ ] A blank shot decrements only the blank count.
-   [ ] Counts cannot become negative.
-   [ ] Undo restores the last supported action.
-   [ ] The completed state appears when all shells are consumed.
-   [ ] The session survives a page refresh.
-   [ ] The session survives closing and reopening the Mini App.
-   [ ] Different Telegram users have isolated sessions.
-   [ ] Stale writes do not silently overwrite newer state.
-   [ ] Duplicate network retries do not double-apply an action.
-   [ ] The app remains usable when fullscreen is unavailable.
-   [ ] The interface is usable on a narrow phone screen.
-   [ ] No secrets are present in the frontend bundle or Git repository.

------------------------------------------------------------------------

## 11. Implementation Roadmap

Work in small, verifiable phases. Do not attempt to implement the entire
product in one large code-generation step.

### Phase 0 --- Platform Verification

**Goal:** Prove the Telegram Serverless environment and Mini App hosting
path before building the product.

Tasks:

1.  Inspect the current official Telegram Serverless documentation.
2.  Inspect the actual CLI version and its help output.
3.  Inspect the generated project template.
4.  Confirm the supported frontend hosting workflow.
5.  Confirm the supported backend endpoint format.
6.  Confirm the database and migration API.
7.  Confirm how authenticated Telegram user context reaches an endpoint.
8.  Create a minimal test endpoint.
9.  Deploy a minimal test Mini App.
10. Open it from the existing bot.

Deliverable: a minimal deployed Telegram Mini App that successfully
calls a Serverless endpoint.

**Exit criteria:** The platform integration is proven with the actual
bot. Do not proceed by relying on assumed commands or undocumented APIs.

### Phase 1 --- Project Foundation

Tasks:

1.  Initialize the repository.
2.  Configure React, TypeScript, and Vite according to the official
    hosting requirements.
3.  Configure linting and formatting if useful.
4.  Establish the application entry point.
5.  Add Telegram Mini App initialization.
6.  Add basic responsive layout and design tokens.
7.  Verify local development and production builds.

Deliverable: a clean application shell running inside Telegram.

### Phase 2 --- UI Implementation

Tasks:

1.  Build the Setup screen.
2.  Build the Active Tracker screen.
3.  Build the Completed screen.
4.  Build the shell counter component.
5.  Build the two shot buttons.
6.  Build the ammunition indicator.
7.  Build Undo and New Load controls.
8.  Add responsive behavior and purposeful motion.
9.  Verify touch usability.

Deliverable: a complete frontend using temporary in-memory state.

### Phase 3 --- Counting Engine

Tasks:

1.  Implement typed session models.
2.  Implement state transitions.
3.  Implement validation and invariants.
4.  Implement shot recording.
5.  Implement undo.
6.  Implement completion handling.
7.  Implement probability calculations.
8.  Add comprehensive unit tests.

Deliverable: a deterministic, thoroughly tested tracking engine.

### Phase 4 --- Serverless Persistence

Tasks:

1.  Define the database schema using the official migration mechanism.
2.  Implement session retrieval.
3.  Implement session creation.
4.  Implement shot recording.
5.  Implement undo.
6.  Implement abandonment/replacement.
7.  Enforce user ownership.
8.  Add optimistic concurrency.
9.  Add idempotency.
10. Add backend tests.

Deliverable: authenticated, persistent sessions.

### Phase 5 --- Local Recovery and Synchronization

Tasks:

1.  Add local session recovery.
2.  Add pending-operation handling.
3.  Add retry behavior.
4.  Add sync status UI.
5.  Handle stale versions.
6.  Handle multiple-client conflicts.
7.  Test refresh, close/reopen, and temporary network loss.

Deliverable: resilient session tracking.

### Phase 6 --- Telegram Polish

Tasks:

1.  Configure the bot launch experience.
2.  Configure the Main Mini App and/or Menu Button.
3.  Add Telegram theme integration where appropriate.
4.  Add safe-area and viewport handling.
5.  Add graceful fullscreen behavior.
6.  Test supported Telegram clients.

Deliverable: polished Telegram-native experience.

### Phase 7 --- Release

Tasks:

1.  Run all automated tests.
2.  Run production build.
3.  Inspect the frontend bundle for accidental secrets.
4.  Verify database migrations.
5.  Test user isolation.
6.  Test recovery and synchronization.
7.  Deploy production.
8.  Verify the live bot launch path.
9.  Document setup and maintenance.

Deliverable: V1 release.

------------------------------------------------------------------------

## 12. V2 and V3 Ideas

Do not implement these before V1 is stable.

### V2 --- Advanced Tracking

-   Explicit shell ejection action for known shell types.
-   Uncertainty-aware tracking for unknown ejected shell types.
-   Session history.
-   Session statistics.
-   Optional configurable game presets, only after verifying the
    intended game modes.
-   More detailed action history.
-   Improved haptic feedback where supported.

### V3 --- Multiplayer and Shared Sessions

-   Shared tracker session.
-   Invite link or session code.
-   Multiple players viewing the same ammunition state.
-   Conflict-safe simultaneous updates.
-   Optional turn/shot attribution.

Multiplayer introduces substantially more synchronization complexity and
should remain outside V1.

------------------------------------------------------------------------

## 13. Engineering Rules for the AI Agent

The implementing agent must follow these instructions throughout the
project.

1.  **Verify before coding.** Read current official Telegram Serverless
    and Mini Apps documentation. Do not rely on outdated examples or
    assumptions.
2.  **Preserve the existing bot.** The bot already exists and Serverless
    is enabled. Do not create a replacement bot unless explicitly
    requested.
3.  **Do not invent platform APIs.** Confirm every CLI command, SDK
    method, endpoint convention, and database operation against current
    documentation or the installed template.
4.  **Do not introduce unnecessary infrastructure.** No VPS, external
    backend, external database, or unrelated cloud service for V1.
5.  **Keep the product focused.** The main job is counting live and
    blank shells quickly and accurately.
6.  **Separate domain logic from UI.** Counting and undo logic must be
    independently testable.
7.  **Protect user data.** Enforce server-side Telegram identity
    validation and per-user ownership.
8.  **Handle retries safely.** Mutations must be idempotent.
9.  **Handle stale state safely.** Use version checks or an equally
    reliable concurrency mechanism.
10. **Never guess shell type.** Unknown ejected ammunition must not be
    arbitrarily classified.
11. **Do not over-design.** The interface should be polished but fast,
    legible, and minimal.
12. **Do not use copyrighted game artwork or logos without permission.**
    Create an original visual identity inspired by the game's
    atmosphere.
13. **Test each phase.** Do not proceed past a phase until its exit
    criteria are met.
14. **Keep the repository clean.** Exclude secrets, generated
    credentials, local caches, and platform-specific private
    configuration.
15. **Document actual commands.** README instructions must reflect
    commands verified in the current environment.
16. **Report limitations honestly.** If a platform feature is
    unavailable or behaves differently from the brief, explain it and
    propose the smallest compatible adjustment.
17. **Do not silently change product scope.** Ask before adding external
    services, analytics, accounts, payments, or multiplayer
    functionality.

### Required agent workflow

At the beginning of implementation:

1.  Inspect the repository and existing project files.
2.  Inspect the current Telegram Serverless documentation and CLI.
3.  Produce a concise platform verification report.
4.  Identify any mismatch between this brief and the actual platform.
5.  Propose the exact implementation plan.
6.  Start Phase 0 and prove deployment before implementing the full UI.

For every phase:

-   State the intended outcome.
-   Make the smallest coherent set of changes.
-   Run relevant tests and builds.
-   Report files changed.
-   Report commands executed and their actual results.
-   Identify unresolved risks.
-   Wait for approval before any destructive operation or major scope
    change.

------------------------------------------------------------------------

## 14. Definition of Done for V1

V1 is complete when:

1.  The existing Telegram bot launches the Mini App.
2.  The Mini App has a polished, responsive, original dark industrial
    interface.
3.  A user can enter live and blank shell counts.
4.  A user can record each shot with one tap.
5.  Counts and totals remain correct under all supported operations.
6.  Undo works correctly.
7.  Completed sessions are handled cleanly.
8.  The active session persists in Telegram Serverless SQLite.
9.  The session can be restored after closing and reopening the Mini
    App.
10. User data is isolated and authenticated.
11. Duplicate operations and stale writes are handled safely.
12. Temporary network problems do not silently destroy local progress.
13. Automated tests pass.
14. The production deployment is verified from the actual Telegram bot.

------------------------------------------------------------------------

## 15. Final Product Principle

**The tracker must never get in the player's way.**

The ideal interaction is:

-   Open the Mini App.
-   Immediately see the remaining live and blank shells.
-   Tap the correct shot button.
-   Continue playing.

Every technical and design decision should support that experience.
Reliability, speed, clarity, and a distinctive visual identity matter
more than adding a large number of features.
