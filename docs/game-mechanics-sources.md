# Buckshot Roulette — Game Mechanics & Source Reference Documentation

**Project:** Buckshot Tracker  
**Target Game:** *Buckshot Roulette* (Developer: Mike Klubnika; Publisher: CRITICAL REFLEX)  
**Primary Platform:** Steam (App ID: `2835570`), itch.io release  
**Document Purpose:** Document verified in-game rules, mechanics, community references, and clearly delineate confirmed gameplay facts from application design assumptions.

---

## 1. Verified Mechanics: Burner Phone

### A. Confirmed In-Game Facts
1. **Positional Frame of Reference:**
   - The Burner Phone announces shells relative to the shotgun's **current chamber status**, not the initial loadout ordering.
   - **Position 1** refers to the currently chambered shell (the shell that will fire if the trigger is pulled right now).
   - **Position 2** refers to the 2nd shell from the current moment (the shell immediately behind the chambered shell).
   - **Position $k$** refers to the $k$-th shell from the current moment ($k - 1$ cycles away).
2. **Audio / Text Dialogue:**
   - When used with sufficient ammunition remaining:
     *Robotic Voice:* `"[ORDINAL] SHELL... [LIVE / BLANK]"` (e.g., *"SECOND SHELL... LIVE"*, *"THIRD SHELL... BLANK"*).
   - When used with fewer than the minimum required shells remaining:
     *Robotic Voice:* `"HOW UNFORTUNATE..."` (no information is provided; the item is consumed with no revelation).
3. **Earliest Positional Bounds:**
   - **Single-Player Mode:**
     - Requires $\ge 2$ remaining shells in the shotgun.
     - The earliest possible revealed shell is the **2nd shell** (Position 2).
     - The Burner Phone **never reveals the 1st shell** (Position 1 is reserved exclusively for the Magnifying Glass item).
   - **Multiplayer Mode (v1.2.0+):**
     - Requires $\ge 3$ remaining shells in the shotgun.
     - The earliest possible revealed shell is the **3rd shell** (Position 3).
4. **Advancement upon Consumption:**
   - Each time a shell is fired (discharged) or ejected (racked out via Beer), the shotgun's pump action cycles the next shell into the chamber.
   - Consequently, all relative positions decrement by 1 ($k \to k - 1$).
   - When a known shell reaches Position 1, it is chambered and will be consumed on the next discharge or ejection.

### B. Confirmed vs Assumed Tracker Boundaries
- **Confirmed Fact:** Single-Player Burner Phone reveals Position 2+ when $\ge 2$ shells remain.
- **Confirmed Fact:** Position 1 can be inspected using the Magnifying Glass.
- **Tracker Implementation Scope:** The current Buckshot Tracker Mini App strictly targets and enforces **Single-Player Mode** ($\ge 2$ shells, position 2+). Multiplayer mode is deliberately classified as **NOT IMPLEMENTED** in persistence and UI.

---

## 2. Verified Mechanics: Beer Ejection

### A. Confirmed In-Game Facts
1. **Physical Action:**
   - Using the Beer item causes the player character to rack the shotgun's pump action without pulling the trigger.
   - The shell currently in the chamber (Position 1) is ejected and flies out onto the table.
2. **Visual Feedback:**
   - The ejected shell's hull color is physically visible as it ejects and lands on the table:
     - **Crimson / Red Hull:** Live round ejected.
     - **Cyan / Blue Hull:** Blank round ejected.
   - In multiplayer and single-player, all players observe the exact shell type that was ejected.
3. **Inventory & State Changes:**
   - Total remaining ammunition decreases by exactly 1.
   - The specific shell count (Live or Blank) corresponding to the observed hull color decreases by 1.
   - The chambered shell is discarded; the next shell in the magazine tube becomes the new chambered shell (Position 1).

### B. Confirmed vs Assumed Tracker Boundaries
- **Confirmed Fact:** The player always sees which shell was ejected on the table.
- **Tracker Implementation Guard:** The tracker requires the user to explicitly indicate whether a Live or Blank shell was ejected, or confirms the known Position 1 shell. Unidentified (`unknown`) ejections are rejected server-side to prevent state corruption.

---

## 3. Verified References & URLs

1. **Steam Store & Patch Announcements (Developer: Mike Klubnika):**
   - Game Store Page: `https://store.steampowered.com/app/2835570/Buckshot_Roulette/`
   - Multiplayer Update Announcement (v1.2.0): `https://store.steampowered.com/news/app/2835570/view/4545914364058145214`
2. **Buckshot Roulette Official Community Wiki (Fandom):**
   - Burner Phone Reference: `https://buckshot-roulette.fandom.com/wiki/Burner_Phone`
     - *Validates:* Dialogue ("HOW UNFORTUNATE...", "X SHELL... [TYPE]"), single-player minimum 2 shells, multiplayer minimum 3 shells, relative position counting.
   - Beer Reference: `https://buckshot-roulette.fandom.com/wiki/Beer`
     - *Validates:* Shell racking action, visual visibility of ejected hull on table, ammunition count decrement.
   - Magnifying Glass Reference: `https://buckshot-roulette.fandom.com/wiki/Magnifying_Glass`
     - *Validates:* Immediate chamber inspection (Position 1).
