# Backlog — Aristotle Character Forge

Tracked feature requests, bugs, and UI tweaks. Each item has enough context for Claude Code to implement without needing to ask questions.

Status tags: `[ ]` open · `[~]` in progress · `[x]` done

---

## Bugs & Polish

### B-01 · Remove redundant tooltip boxes · `[ ]`

**What:** Yellow/amber inline boxes appear beneath certain field labels in the character creation form and character sheet. They display the same text already shown in the field's subtitle/description line directly above — pure duplication, and visually noisy.

**Where:** Look for the `PHIL` constant in `src/constants.js` (or `aristotelian-3.jsx` if not yet extracted). These are the strings rendered in styled tooltip boxes when a user clicks `[?]`. The boxes themselves are the problem, not the `[?]` button or the underlying `PHIL` content.

**Fix:** Remove the yellow box rendering. The `[?]` button and popup can stay (or go — user's call), but the always-visible inline duplicate boxes should be deleted. Check `CharField` component (or equivalent in the JSX) for where these render.

---

### B-02 · Fix animated dots appending to existing ellipsis · `[ ]`

**What:** The `...` loading animation appends three new dots to placeholder text that already ends in `...`. Result: `"example... ..."` instead of a clean cycling animation.

**Where:** `AnimatedDots` component (in JSX around line 425, or `src/components/AnimatedDots.jsx` once extracted). The `Typewriter` component nearby may also be involved.

**Fix:** The animation should cycle through: `text` → `text.` → `text..` → `text...` → back to `text`. Strip any trailing dots from the base string before the animation starts, then append dots as the cycle progresses. Do not concatenate dots onto a string that already contains them.

---

### B-03 · Fix type badge color · `[ ]`

**What:** The pill/badge showing character style (e.g. "Comedy", "Tragic") renders in a green accent color that clashes. It should use the same color as the surrounding body text.

**Where:** Look for the style badge in `WorldDetail` or `CharacterSheet` — wherever the character's style is rendered as a pill element. Also check `styles.css` or the `STYLES` constant for a `.badge`, `.pill`, or `.type-tag` class with a hardcoded green.

**Fix:** Change the badge text color to `var(--text)` or `currentColor`. Remove or neutralize the green background/border if it draws too much attention.

---

## Features

### F-01 · Inline field feedback → guided regeneration · `[ ]`

**What:** On any generated text field in the character sheet, the user should be able to give natural-language feedback and have that specific field regenerated incorporating the feedback. Not a full character regen — just that one field.

**UX flow:**
1. User clicks a "Give feedback" icon (or expands an existing regen button) next to a field.
2. A small text input appears inline below the field content.
3. User types feedback (e.g. "make this darker, she's hiding something").
4. On submit: LLM regenerates that field using the feedback + the existing character context as constraints.
5. User sees the new value and can **Confirm** (replaces old value) or **Discard** (reverts to original). No silent overwrites.

**Where to build:** Extend `CharField` (or equivalent). The existing single-field regen logic is in `buildRegenPrompt` (`src/prompts/regen.js`). Add a `feedback` param to that prompt so it becomes: "Regenerate this field. Here is what to change: [feedback]. Keep everything else consistent."

**Constraints:**
- Must not auto-apply. Always confirm/discard.
- Must pass the full character JSON as context, not just the field value.
- Keep the feedback input visually minimal — it should feel like annotating, not opening a new form.

---

### F-02 · Character list tabs in World view · `[ ]`

**What:** When inside a World and viewing its character list, add tab navigation at the top of the list. Default landing tab is **Recent** (characters sorted by creation time, newest first). Additional tabs appear for each role type that has at least one character: Lead, Deuteragonist, Supporting, Minor, Ensemble.

**UX:**
- Tabs only appear if the world has more than ~3 characters (not worth it for tiny casts).
- A role tab only appears if at least one character has that role.
- Tab order: Recent · Lead · Deuteragonist · Supporting · Minor · Ensemble.
- Active tab is remembered in local state (not persisted — resetting on world navigation is fine).

**Where to build:** `WorldDetail` component (or equivalent in the JSX). The character list is currently a flat array render. Wrap it in a tabbed view using the existing `PillSelect` pattern or a lightweight tab component.

---

### F-03 · Advanced World Building — AI Interview + Lore Documents · `[ ]`

**Spec:** Full design in `docs/design/world-building-advanced.md` — read that before touching anything.

**Summary:** Add an Advanced mode to world creation. Simple mode stays unchanged. Advanced mode adds: extended structured inputs, file upload (lore docs, images), a choice of Short (5Q) or Long (20Q) AI interview, and auto-generated topic documents displayed on the world page.

**Interview structure:** Two phases — gap-filling first (what's underspecified), then Aristotelian pressure (world hamartia, polis structure, probability/necessity). Every question has A/B/C options where one is marked "Aristotle's pick."

**Output docs:** Named topic documents — World Primer, Power & Conflict, Society & Culture, History & Myth, Geography, Rules of the World, Interview Transcript. Only generated if the interview produced enough content for them.

**Character generation impact:** Advanced worlds pass the full doc set as LLM context — characters should feel meaningfully shaped by the world's established structure.

**State changes needed:** `world.mode`, `world.documents[]`, `world.interviewTranscript[]`, `world.uploadedFiles[]`. Bump storage version.

**Key constraints:**
- One interview per world, done at creation time. Not repeatable.
- Simple mode is not touched.
- File upload may need server-side PDF parsing — confirm before building upload UI.

---

## Ideas / Not Yet Scoped

These have been mentioned but not fully specced. Don't implement without discussion.

- **Export** — PDF or markdown clipboard copy of a character sheet.
- **Scene generation** — Two characters + world → a dramatic scene with their hamartias in collision.
- **Doc-driven prompts** — Build script that reads the philosophy guides and regenerates the `PHIL`, role, and style constants automatically so the guides are the true source of truth.
