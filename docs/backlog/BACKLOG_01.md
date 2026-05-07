# Backlog — Aristotle Character Forge

Tracked feature requests, bugs, and UI tweaks. Each item has enough context for Claude Code to implement without needing to ask questions.

Status tags: `[ ]` open · `[~]` in progress · `[x]` done

---

## Bugs & Polish

### B-01 · Remove redundant tooltip boxes · `[x]`

**What:** Yellow/amber inline boxes appear beneath certain field labels in the character creation form and character sheet. They display the same text already shown in the field's subtitle/description line directly above — pure duplication, and visually noisy.

**Resolution (May 2026):** PHIL note rendering is now toggled via a `?` hint chip on the field label and only renders when clicked. No always-visible duplicate. Styling is muted italic serif — not a yellow box. See `CharField.jsx`.

---

### B-02 · Fix animated dots appending to existing ellipsis · `[x]`

**What:** The `...` loading animation appends three new dots to placeholder text that already ends in `...`. Result: `"example... ..."` instead of a clean cycling animation.

**Resolution:** `AnimatedVerbs` strips trailing `.` / `…` from the verb string before the dots animation appends — see [AnimatedVerbs.jsx:108](../../src/components/AnimatedVerbs.jsx#L108): `const verbBase = verb.replace(/[.…]+$/, "");`. Cycle is now clean.

---

### B-03 · Fix type badge color · `[x]`

**What:** The pill/badge showing character style (e.g. "Comedy", "Tragic") renders in a green accent color that clashes. It should use the same color as the surrounding body text.

**Resolution:** `.char-tag` now uses `color: var(--muted)` with a neutral `var(--border)` outline — no green. See [styles.css:281](../../src/styles.css#L281).

---

## Features

### F-01 · Inline field feedback → guided regeneration · `[x]`

**Resolution:** Implemented in `CharField`. The `✎` action (now in the `⋯` overflow after the May 2026 design pass) opens an inline feedback textarea, calls `onRegenWithFeedback(fieldKey, text)`, and presents the new value with explicit `✓ Confirm` / `✕ Discard` actions. No silent overwrites. See [CharField.jsx:52](../../src/components/CharField.jsx#L52) and [prompts/regen.js](../../src/prompts/regen.js).

---

### F-02 · Character list tabs in World view · `[x]`

**Resolution:** Implemented in `WorldDetail.CharactersPanel`. Tabs render only when the cast exceeds 3 characters; default tab is **Recent**, with role tabs (Lead / Deuteragonist / Supporting / Minor / Ensemble) appearing only for roles with at least one character. State is local to the panel. See [WorldDetail.jsx:14](../../src/components/WorldDetail.jsx#L14).

---

### F-03 · Advanced World Building — AI Interview + Lore Documents · `[x]`

**Resolution:** Shipped. `CreateWorldAdvanced.jsx` drives the interview flow with `buildInterviewPrompt`. World docs are stored on `world.documents[]` and rendered through `LoreView` + `DocumentViewer`. The `STORAGE_KEY` was bumped to `"aristotelian-worlds-v2"` for the schema change. Per-doc expand and lore-driven character context are wired through `LoreExpandInterview` and `buildPromptContext`.

---

## Ideas / Not Yet Scoped

These have been mentioned but not fully specced. Don't implement without discussion.

- **Export** — PDF or markdown clipboard copy of a character sheet.
- **Scene generation** — Two characters + world → a dramatic scene with their hamartias in collision.
- **Doc-driven prompts** — Build script that reads the philosophy guides and regenerates the `PHIL`, role, and style constants automatically so the guides are the true source of truth.
