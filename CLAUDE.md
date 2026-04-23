# Aristotle Character Forge — Claude Code Context

This is a single-file React app that generates dramatically structured characters using Aristotle's Poetics framework and the Anthropic API. Read this before touching anything.

---

## What the app does

Users create **Worlds** (named fictional settings with a description), then generate **Characters** within them. Each character is built by injecting the world context, the existing cast, and any user inputs into a structured prompt that applies Aristotle's four requirements (Goodness, Appropriateness, Likeness to Truth, Consistency) plus Hamartia. The LLM returns a structured JSON character sheet.

The tool is opinionated: it's about dramatic structure, not appearance checklists. Hamartia (the error that emerges from the character's greatest strength) is a first-class field, not an afterthought.

---

## File structure

```
Aristotelian/
├── aristotelian-3.jsx          ← The entire app. Single file. READ-ONLY.
├── CLAUDE.md                   ← This file.
├── HANDOVER.md                 ← Written by /handover. Current session state + next steps.
├── src/                        ← The web app (Vite + React). This is what runs.
└── docs/
    ├── README.md               ← Docs navigation index.
    ├── BACKLOG.md              ← All open bugs + feature requests. The work queue.
    ├── Design Doc.md           ← Full product spec. Read when building new features.
    ├── aristotelian-sprint-retro.md  ← Sprint history.
    └── philosophy/
        ├── Aristotle_Character_Guide.md  ← Four requirements + hamartia theory
        ├── Aristotle_Role_Guide.md       ← Lead / Deuteragonist / Supporting / Minor / Ensemble
        ├── Aristotle_Style_Guide.md      ← Tragic / Comic / Mixed modes
        ├── Aristotle_Dialogue_Guide.md   ← Speech modes, subtext, voice
        └── Aristotle_Comedy_Guide.md     ← Six comic types, gap theory
```

**The JSX is the source of truth for what the app does. The markdown guides are reference material** — their content is condensed and hardcoded into the JSX (in `PHIL`, `buildPrompt`, and the role/style instructions). There is no runtime pipeline between docs and app. A future build-step is planned to change this.

---

## Stack

- **React** (single-file JSX, no bundler — runs as a Claude artifact)
- **Anthropic API** — `claude-sonnet-4-20250514`, called directly from the browser via `fetch`
- **window.storage** — persistence layer provided by the artifact environment (not localStorage)
- **No external libraries** — useState/useEffect/useRef only. All CSS is in a `STYLES` string constant.

---

## Key constants — where things live

**`PHASES`** — Array of 6 generation phases (Identity, History, Psychology, Aristotelian Core, Dialogue, Finishing). Each has a `streamMarker` — a JSON key string that, when detected in the streaming response, signals that phase is done. Drives the generating overlay animation.

**`PHIL`** — Object of philosophy tooltip strings, keyed by field name. These are the hardcoded Aristotle notes shown when a user clicks [?] on a field. Drawn from the guides but not auto-synced.

**`ROLE_OPTIONS`** — `[Lead, Deuteragonist, Supporting, Minor, Ensemble]` with labels and one-line descriptions.

**`STYLE_OPTIONS`** — `[Tragic, Comic, Mixed]` with labels and descriptions.

**`STORAGE_KEY`** — `"aristotelian-worlds-v2"`. Bump version if you change the state schema in a breaking way.

---

## Prompt architecture

Three functions build LLM prompts:

### `buildPrompt(world, existingChars, inputs, targetLead)`
Used for full character generation. Assembles:
1. World name + description
2. Existing character list (name, role, consistency/summary[0])
3. Role instruction block (varies by role — see `roleInstructions` object inside the function)
4. Style instruction block (varies by style — see `styleInstructions` object)
5. Aristotle's framework (5 requirements, hardcoded)
6. Dialogue framework (4 fields, hardcoded)
7. User inputs (only non-empty fields)
8. Field instructions + JSON schema

Returns: full character JSON matching the `Character` schema.

### `buildExpandPrompt(world, character)`
Used to fill missing fields on a partial character (Minor/Supporting characters, or the "Generate Dialogue" path). Takes the existing partial character JSON and asks the model to fill everything missing while staying consistent. Returns complete character JSON.

### Inline regen prompt (in `CharacterSheet`)
Single-field regeneration. Sends world + full character JSON + field key. Returns a plain string (not JSON). Max 500 tokens.

---

## Role system — affects generation depth

The role is the most structurally significant field. It changes what the prompt asks for and which fields are shown/editable in the character sheet.

| Role | Generation depth | Sheet behavior |
|---|---|---|
| Lead | Full Aristotelian treatment. Complete hamartia arc. Must drive central reversal. | All tabs, all fields |
| Deuteragonist | Full treatment. Hamartia must interlock with a Lead's. Target lead can be specified. | All tabs, all fields |
| Ensemble | Full treatment + `collectiveHamartia` field. | All tabs, all fields |
| Supporting | 4 requirements, no full hamartia arc. Exists to reveal the lead. | Psychology tab has locked Aristotelian section |
| Minor | Appropriateness + consistency only. Must feel like a person with a life offscreen. | Limited fields; Aristotelian tab has locked section |

Helper functions: `isFullRole(r)`, `isSupport(r)`, `isMini(r)` — used throughout the sheet to conditionally render tabs and fields.

---

## Style system — affects consequence framing

Style (Tragic / Comic / Mixed) is injected as a separate instruction block in the prompt. It frames how the LLM should treat the hamartia's consequences:

- **Tragic** — irreversible consequences, error from virtue not wickedness
- **Comic** — survivable consequences, visible deficiency, affectionate superiority required
- **Mixed** — comic surface with real stakes; the comedy makes the tragedy land harder

Comic generation is the weakest area currently. Characters tend to drift toward tragic gravity. The `Aristotle_Comedy_Guide.md` contains detailed guidance on six comic types (Observer, Deep Comic, Joyful Fool, Tragic Clown, Social Transgressor, Self-Defeating Schemer) and the structural gap theory — this is not yet fully injected into the comic style instruction.

---

## Streaming and the generating overlay

Character generation uses `callClaudeStreaming`. The accumulated JSON string is passed to `useGeneratingProgress`, which:
1. Watches for `PHASES[i].streamMarker` strings in the accumulating text
2. When found, schedules phase completion after a minimum 4s from phase start (`MIN_PHASE_MS`)
3. Holds the green "done" state for 900ms before advancing to the next phase
4. Drives animated verb cycling (every 1.6s) from each phase's `verbs` array

The overlay is a full-screen component (`GeneratingOverlay`) with a `Typewriter` component for the verb text.

---

## Persistence

`window.storage.get(key)` / `window.storage.set(key, value)` — provided by the artifact runtime, not standard localStorage. Values are JSON strings.

Load happens on mount in a `useEffect`. Save happens on every `worlds` state change (guarded by `loaded` flag to prevent saving on initial hydration).

A `justSaved` state triggers a brief "Saved" indicator (sage dot, top-right).

---

## State mutations

Three state update helpers in `App`:
- `addWorld(w)` — appends to worlds array
- `addCharacter(c)` — appends to active world's characters array
- `updateCharacter(c)` — replaces character by id in active world

All use immutable update patterns (`.map()`). No external state library.

---

## What to work on next

1. **Improve Comic generation** — The comic style instruction in `buildPrompt` is thin. The `Aristotle_Comedy_Guide.md` has the full framework (six types, gap theory, affection vs contempt test). This content needs to be worked into the Comic style instruction so generated comic characters are actually structurally comic, not just lighter-toned tragic ones.

2. **Doc-driven prompts** — The framework content (PHIL, role instructions, style instructions, framework section of buildPrompt) is hardcoded. A build script that reads the markdown guides and regenerates these constants would let the guides be the actual source of truth.

3. **Export** — PDF character sheet / markdown clipboard copy.

4. **Scene generation** — Two characters + world → dramatic scene with their hamartias in collision.

---

## What NOT to do

- Don't add a routing library — state-driven navigation is intentional and fine for this scope.
- Don't split into multiple files unless moving to a proper build environment. This is a single-file artifact.
- Don't switch from `window.storage` to localStorage — the artifact runtime requires window.storage.
- Don't change `STORAGE_KEY` without bumping the version string — existing user data will be lost.
- Don't remove the minimum phase time (`MIN_PHASE_MS = 4000`) — it exists to make the overlay legible, not just fast.
