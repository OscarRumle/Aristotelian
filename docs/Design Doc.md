# Aristotle Character Forge — App Documentation
**Version:** 2.0 (aristotelian-3.jsx)
**Last updated:** April 2026
**Design system:** Nordic Warm Minimal
**Stack:** React (single-file JSX artifact), Anthropic API (claude-sonnet-4-20250514)

---

## 1. Purpose & Vision

"Aristotelian" is a creative tool for writers, game designers, and storytellers. It uses the framework of Aristotle's Poetics — as outlined in the companion guides — to help creators build psychologically coherent, dramatically compelling characters.

The core idea: most character creation tools are descriptive (what does the character look like, what is their backstory). This tool is structural — it asks *what does the character do under pressure*, *what is their hamartia*, *what is the logic of their choices*. The LLM processes the creator's rough ideas through the Aristotelian framework and returns a fully realized character sheet.

Characters exist inside **Worlds** — named fictional universes or IPs that provide context, tone, and constraints that the LLM uses when generating characters.

---

## 2. App Architecture

### 2.1 Views / Screens

Navigation is state-driven (no routing library). The app has five named views:

```
hub            — World Hub: list of all worlds
createWorld    — Create World form
world          — World Detail: characters in a world
createCharacter — Character creation form
character      — Character Sheet (tab-based)
```

### 2.2 State Structure

All app state lives in React `useState`. Worlds and characters are persisted across sessions via `window.storage` (key: `aristotelian-worlds-v2`).

```javascript
appState = {
  view: 'hub' | 'createWorld' | 'world' | 'createCharacter' | 'character',
  worlds: [World],
  activeWorldId: string | null,
  activeCharId: string | null,
  loaded: boolean,           // storage hydration complete
  generating: boolean,       // full character generation in progress
  expanding: boolean,        // expand-character call in progress
  genError: string | null,
  genAccumulated: string,    // streaming text buffer for phase detection
}

World = {
  id: string,
  name: string,
  description: string,
  characters: [Character],
}

Character = {
  id: string,
  worldId: string,
  pitch: string,             // user's original concept/idea

  // Identity
  name: string,
  age: string,
  gender: string,
  race: string,
  role: string,              // Lead | Deuteragonist | Supporting | Minor | Ensemble
  style: string,             // Tragic | Comic | Mixed

  // Summary & voice
  summary: [string, string, string],  // exactly 3 punchy sentences
  quote: string,                       // one line capturing their voice

  // Physical
  appearance: string,
  clothing: string,
  details: string,           // scars, mannerisms, distinguishing marks

  // History & psychology
  background: string,
  personality: string,
  desires: string,
  fears: string,
  moralCore: string,

  // Aristotelian core
  hamartia: string,
  consistency: string,       // one-sentence behavioral logic
  collectiveHamartia: string, // Ensemble only; empty string otherwise

  // Dialogue (Aristotle's Rhetoric)
  speechMode: string,        // "Ethos" | "Pathos" | "Logos"
  underPressure: string,     // what they do when cornered
  subtext: string,           // what they always talk around but never at
  voicePattern: string,      // structural rhythm, deflections, evasions

  // Relationships & analysis
  relationships: [{ characterId: string, characterName: string, description: string }],
  aristotelianNote: string,  // LLM meta-note: how this character satisfies the four requirements
}
```

---

## 3. Feature Specifications

### 3.1 Create World

**Trigger:** [+ New World] button on hub view.

**Fields:**
- `Name` — Text input. Max 60 chars.
- `Description` — Textarea. Genre, tone, rules, history, feel. Max 600 chars. Passed verbatim to the LLM as world context for every character generated within it.

**On submit:** World added to state, navigate to World Detail. No LLM call at world creation.

---

### 3.2 World Detail View

Displays world name, description, and a list of Character Cards. Each card shows: character name, role (italic), quote (italic amber, clamped to 2 lines), and a "View character →" CTA.

---

### 3.3 Create Character — Input Screen

All fields are optional. The LLM generates a complete character from zero input using only world context.

**Core fields (always visible):**
| Field | Type | Notes |
|---|---|---|
| Idea / Pitch | Textarea | The creator's rough concept. Any length. |
| Role | Pill selector | Lead / Deuteragonist / Supporting / Minor / Ensemble. Leave blank for LLM to choose. |
| Style | Pill selector | Tragic / Comic / Mixed. Leave blank for LLM to choose. |

**Deuteragonist-only:** When Role = Deuteragonist and at least one Lead exists in the world, a dropdown appears to optionally target a specific Lead. The selected Lead's full character data is injected into the prompt so the Deuteragonist's hamartia can interlock with theirs.

**Optional fields (behind "Add specifics" toggle):**
Identity: Name, Age, Gender, Race/Species
Physical: Appearance, Clothing, Details
Psychology: Background, Personality, Desires, Fears, Moral Core

User-supplied fields are treated as hard constraints. Blank fields are generated by the LLM.

---

### 3.4 Character Generation — LLM Call

**Model:** `claude-sonnet-4-20250514`
**Max tokens:** 2000
**Mode:** Streaming (`callClaudeStreaming`)

Generation is streaming. The accumulated text is passed to a `useGeneratingProgress` hook that detects phase completion by watching for specific JSON key strings in the stream.

**Generating Overlay — 6 Phases:**

The overlay displays animated verbs cycling every 1.6s, with a minimum 4s per phase. Each phase completes when its `streamMarker` appears in the accumulated JSON:

| Phase | Label | Stream marker |
|---|---|---|
| identity | Identity | `"summary"` |
| history | History | `"personality"` |
| psychology | Psychology | `"moralCore"` |
| core | Aristotelian Core | `"speechMode"` |
| dialogue | Dialogue | `"aristotelianNote"` |
| finishing | Finishing | end of JSON (`}`) |

When a phase completes, it flashes green for 900ms before advancing.

**System prompt structure (buildPrompt):**

```
You are a character creation assistant trained on Aristotle's Poetics, Rhetoric, and the full dramatic framework.

WORLD: {world.name}
{world.description}

EXISTING CHARACTERS:
{list of name (role) — consistency/summary[0], or "None yet"}

{roleInstruction for selected role}
{styleInstruction for selected style}

ARISTOTLE'S FRAMEWORK:
1. GOODNESS
2. APPROPRIATENESS
3. LIKENESS TO TRUTH
4. CONSISTENCY
5. HAMARTIA

DIALOGUE FRAMEWORK (Aristotle's Rhetoric):
speechMode / underPressure / subtext / voicePattern

USER INPUT:
{all non-empty user fields}

FIELD INSTRUCTIONS:
{instructions for role, style, summary, quote, aristotelianNote, collectiveHamartia}

Return ONLY valid JSON. No preamble. No markdown fences.
{full schema}
```

**Role instructions injected into prompt:**

- **Lead** — Full Aristotelian treatment: complete hamartia arc, capable of anagnorisis. Choices must drive the central reversal.
- **Deuteragonist** — Complementary hamartia to the Lead's. If a target Lead is provided, their full data is injected and the prompt asks: does this character's error make the lead's error more inevitable?
- **Supporting** — Four requirements but no full hamartia arc. Exists to reveal the lead. Hamartia minimal unless it directly serves that function.
- **Minor** — Appropriateness and consistency only. Feels like a person with an entire life offscreen.
- **Ensemble** — Compressed Aristotelian arc. Includes `collectiveHamartia` field describing the shared assumption the ensemble collectively carries.

**Style instructions injected into prompt:**

- **Tragic** — Consequences are irreversible. Error emerges from genuine virtue, not wickedness. Audience must feel: I might have done the same.
- **Comic** — Deficiency specific and visible before it's visible to the character. Consequences stop short of real lasting pain. Superiority must be affectionate. Character can recover.
- **Mixed** — Dark Comedy. Comic behavior + real stakes. The comedy is the mechanism that makes the tragedy land harder.

**Response JSON schema:**
```json
{
  "name": "", "age": "", "gender": "", "race": "",
  "role": "", "style": "",
  "summary": ["", "", ""],
  "appearance": "", "clothing": "", "details": "",
  "background": "", "personality": "", "desires": "", "fears": "",
  "moralCore": "", "hamartia": "", "consistency": "",
  "speechMode": "", "underPressure": "", "subtext": "", "voicePattern": "",
  "collectiveHamartia": "",
  "relationships": [],
  "aristotelianNote": "", "quote": ""
}
```

On success: character is saved to state, app navigates to Character Sheet.
On JSON parse error: "The model returned something unexpected. Try again."
On other error: "Something went wrong. Check your connection and try again."

---

### 3.5 Character Sheet View

Tab-based layout. Available tabs vary by role:

| Tab | Roles that see it |
|---|---|
| Overview | All |
| Identity | All |
| Psychology | Lead, Deuteragonist, Ensemble, Supporting |
| Dialogue | All |
| Aristotelian | All |

**Header (always visible):**
- Back button → World
- Character name (display serif)
- Role (italic, muted)
- Meta line: Race · Gender · Age
- Role and Style tags
- Summary (3-item list, each preceded by an em dash)
- Quote (italic amber)

**Overview tab:** Consistency, Moral Core, collapsible Aristotelian Analysis (aristotelianNote).

**Identity tab:** Appearance, Clothing, Details, Background. All with [↻] regenerate and [?] philosophy tooltip.

**Psychology tab:**
- Full roles (Lead, Deuteragonist, Ensemble): Personality, Desires, Fears, Hamartia. Ensemble also shows Collective Hamartia.
- Supporting: Personality, Desires, Fears (editable) + locked Hamartia/Consistency section with "Expand Character" CTA.

**Dialogue tab:** Speech Mode (displayed as a tag, not prose), Under Pressure, Subtext, Voice Pattern. If all dialogue fields are empty, shows "Generate Dialogue" button (triggers Expand).

**Aristotelian tab:** Hamartia (full roles only), Relationships list, Aristotelian Analysis. Non-full roles see a locked section with Expand CTA.

---

### 3.6 Single-Field Regeneration

**Trigger:** [↻] button on any field.

**Behavior:** Targeted LLM call (`callClaude`, non-streaming, max 500 tokens):
```
Regenerate only the "{fieldKey}" field.
Stay consistent with all other fields. Apply Aristotle's framework.
Return ONLY the new value as a plain string. No JSON. No labels.
```
World context and full character JSON are included. The specific field shows "Regenerating…" while in progress. All other fields remain interactive.

---

### 3.7 Expand Character

**Trigger:** "Expand Character" or "Generate Dialogue" button on Minor/Supporting character sheets.

**Behavior:** Single LLM call (`callClaude`, non-streaming, max 2000 tokens) using `buildExpandPrompt`. Fills in ALL missing or empty fields. Returns a complete character JSON that is merged into the existing character state (existing fields preserved, missing fields populated).

Prompt: provides world context, the partial character as JSON, and instructs the model to apply the full Aristotelian framework and fill everything missing.

---

### 3.8 Philosophy Tooltips

Each field has a [?] button that reveals a hardcoded philosophy note inline. These are not LLM calls — they are drawn from the `PHIL` constant in the JSX. Fields with tooltips:

`appearance`, `personality`, `desires`, `fears`, `moralCore`, `hamartia`, `consistency`, `speechMode`, `underPressure`, `subtext`, `voicePattern`

---

### 3.9 Relationships

Listed on the Aristotelian tab. When creating subsequent characters, the LLM receives existing character names + consistency/summary and may propose relationships automatically. Relationship entries show character name and description.

---

## 4. Design System

**Nordic Warm Minimal.** All in CSS-in-JS via `STYLES` constant.

### Color tokens
```css
--bg: #F4EDE4
--surface: #FDF8F0
--amber: #B8956A
--sage: #7B9E80
--dust: #C4806A
--dark: #2B2018
--muted: #9A8C85
--faint: #B0A49C
```

### Typography
- **Display / headings:** Cormorant Garamond, 300 & 400
- **Body / UI:** Jost, 300 / 400 / 500
- **Quotes:** Cormorant Garamond italic, amber
- **Labels:** Jost 500, ~0.65rem, uppercase, tracked

### Layout
- Max width: 420px, mobile-first, single column
- Fixed bottom bar for primary CTAs
- Never more than 2 buttons visible at once

### Key animations
- `fadeUp` — screen transitions
- `pulse` — save dot indicator
- `verbIn` — verb text entering during generation
- `checkIn` — phase completion checkmark

---

## 5. LLM Prompt Architecture

Three prompt functions:

**`buildPrompt(world, existingChars, inputs, targetLead)`**
Full character generation. Injects world, existing cast, role instruction, style instruction, Aristotelian framework, dialogue framework, and user inputs. Returns full character JSON.

**`buildExpandPrompt(world, character)`**
Expand a partial character. Fills all missing fields, stays consistent with what exists. Returns complete character JSON.

**`regen(fieldKey)`** (inline in CharacterSheet)
Single-field regeneration. Returns plain string value only.

---

## 6. Persistence

State is persisted via `window.storage.get/set` with key `aristotelian-worlds-v2`. Loaded on mount, saved on every worlds state change. A "Saved" indicator (sage dot) pulses briefly on each save.

---

## 7. Navigation & UX Flow

```
App Launch
    │
    ▼
WORLD HUB
    │
    [+ New World] ──► CREATE WORLD FORM ──► WORLD DETAIL
                                                │
                                         [+ New Character]
                                                │
                                                ▼
                                    CHARACTER CREATION FORM
                                                │
                                   [Generate Character] ──► streaming + overlay
                                                │
                                                ▼
                                        CHARACTER SHEET
                                                │
                    ┌───────────────────────────┼────────────────────────────┐
                [↻] any field           [Expand Character]            [← Back]
                single-field regen      fills missing fields        World Detail
```

---

## 8. Empty & Loading States

| State | Treatment |
|---|---|
| No worlds | Empty state with Aristotle quote + single CTA |
| No characters in world | Empty state: *"Without action there cannot be a tragedy"* |
| Generating character | Full-screen overlay, 6 phases, animated verbs, streaming-aware |
| Expanding character | Button shows "Expanding…", disabled during call |
| Regenerating single field | Field shows "Regenerating…", other fields stay interactive |
| API error (generation) | ErrorToast below character form with Retry button |
| API error (regen) | Inline error message, auto-clears after 5s |

---

## 9. Component Structure

```
App
├── GeneratingOverlay          (full-screen phase progress)
├── WorldHub                   (hub view)
├── CreateWorldScreen          (create world form)
├── WorldDetail                (world + character list)
├── CreateCharacterScreen      (character creation form)
│   ├── PillSelect             (role + style selectors)
│   └── ErrorToast             (generation error)
└── CharacterSheet             (tab-based character view)
    ├── CharField              (label + value + [↻] + [?])
    └── LockedSection          (locked fields with Expand CTA)

Shared:
  AnimatedDots / Typewriter / GeneratingOverlay
  ErrorToast / BottomBar / EmptyState / PillSelect
```

---

## 10. Key Design Decisions & Rationale

**Why no required fields?**
Aristotle's framework works at any level of specificity. A writer with only a vague instinct should get as much value as one with a fully detailed concept. The LLM fills gaps using world context and the framework.

**Why is hamartia a first-class field?**
Most character tools treat psychology as description. Hamartia is structural — it connects the character's greatest quality to their greatest error. Making it a labeled, visible field forces the creator to engage with it explicitly.

**Why tabs on the character sheet?**
Mobile-first layout. Grouping fields by category (Identity / Psychology / Dialogue / Aristotelian) lets users navigate a dense character without scrolling through everything. The tab structure also maps onto the generation phases, reinforcing the framework structure.

**Why does role affect generation depth?**
Aristotle's requirements apply differently depending on causal weight. A Minor character doesn't need a hamartia arc — it would be wrong, not just unnecessary. Generation depth matching role keeps characters appropriately sized for their dramatic function.

**Why streaming?**
A full character at 2000 tokens takes several seconds. Streaming with phase detection gives the user visible progress that maps onto the actual structure being generated, rather than a generic spinner.

---

## 11. Roadmap

- **Export** — PDF character sheet, copy to clipboard as markdown.
- **World elements** — Locations, Props, Lore entries. Each informs character generation context.
- **Relationship graph** — Visual map of character connections within a world.
- **Scene generation** — Given two characters and a world, generate a dramatic scene that puts their hamartias in collision.
- **Character arc planner** — Map peripeteia and anagnorisis moments across a story structure.
- **Doc-driven prompts** — Build script to pull framework content from the markdown guides directly into JSX constants, so editing the guides updates the prompts.
- **Multi-user / collab** — Share a world with collaborators.
