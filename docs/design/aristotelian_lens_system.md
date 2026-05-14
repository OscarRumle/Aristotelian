# The Aristotelian Lens System — v3

> **Status:** Executable source of truth. v3 folds in fourteen UX fixes on top
> of v2. If you are implementing the feature, read this entire document first.

## What this is and why it matters

Today, almost all LLM generation in the app runs through a single Aristotelian angle: **Hamartia** — the fatal error that emerges from a character's greatest strength. This was the right starting point, but Aristotle's framework is much richer. Different lenses produce genuinely different — and dramatically useful — content from the same inputs.

The lens system adds a single new parameter — `lens` — to every generation surface. It defaults to `"hamartia"` everywhere, so users who never touch it see no change. Selecting a different lens swaps the *angle* of the LLM prompt, producing a different *type* of insight from the same inputs.

**This is a cross-cutting feature.** Every creation tool, every field regen, every prompt builder needs to honor the lens. There is no useful intermediate state — if Lens lives on character creation but not on dialogue, users will (correctly) perceive the system as half-built. **Implement all surfaces in the same pass.**

---

## The lenses

| ID | Label | Source guide | Core question |
|---|---|---|---|
| `null` | None | — | No framing. Generate freely without an Aristotelian angle. |
| `hamartia` | Hamartia | Aristotle_Character_Guide.md | What fatal error emerges from the greatest strength? Same quality, different circumstances. |
| `anagnorisis` | Recognition | Aristotle_Character_Guide.md | What does this entity not yet know about itself? What truth is approaching? |
| `peripeteia` | Reversal | Aristotle_Character_Guide.md | What choices already contain the seeds of their own undoing? |
| `telos` | Direction | Aristotle_World_Guide.md | Where is this tending? If nothing changes, what does it become? |
| `polis` | Society | Aristotle_World_Guide.md | Who holds power? What does the community value publicly vs. actually reward? |
| `world_hamartia` | World flaw | Aristotle_World_Guide.md | What structural tension can this world only manage, not resolve? |
| `rhetoric` | Rhetoric | Aristotle_Dialogue_Guide.md | What mode does this entity argue from — Ethos, Pathos, Logos? |
| `gap` | Comic gap | Aristotle_Comedy_Guide.md | What does this entity believe to be true that the audience can see is false? *Only available when style is Comic or Mixed.* |

The `null` lens is always available. Some content (sensory descriptions, physical inventories) genuinely doesn't benefit from philosophical framing — don't hide the None option.

---

## The lens framing instructions

Single source of truth lives in `src/prompts/lensFraming.js`. Every prompt builder imports `getLensFraming(lens)` — never copy the framing text into individual prompt builders.

```js
// src/prompts/lensFraming.js — NEW FILE
// Returns the lens framing block for the given lens, or null when no
// framing should be injected. Callers must omit the block entirely on null.
// Unknown lens values fall back to hamartia (fail-soft).
export function getLensFraming(lens) {
  switch (lens) {
    case null:
    case undefined:
      return null;

    case "hamartia":
    default:
      return `LENS — HAMARTIA: Generate through the lens of hamartia. The fatal error must emerge from this entity's greatest strength — the same quality operating under different circumstances. Strength and flaw are inseparable. This is not a personality defect; it is a specific error of judgment made from a position of genuine virtue.`;

    case "anagnorisis":
      return `LENS — ANAGNORISIS (RECOGNITION): Generate through the lens of recognition. What does this entity not yet understand about itself? What truth is approaching? What moment of recognition is latent — the move from ignorance to knowledge that, once it arrives, changes everything? Frame every field around this gap. The most important thing about this entity is not what it is, but what it doesn't yet know.`;

    case "peripeteia":
      return `LENS — PERIPETEIA (REVERSAL): Generate through the lens of reversal. What choices or qualities already contain the seeds of their own undoing? The reversal must arise from the entity's own logic, not external accident. The moves made to secure a position must be the moves that undermine it. Frame every field around structural irony: what they are doing to protect themselves is what will destroy them.`;

    case "telos":
      return `LENS — TELOS (DIRECTION): Generate through the lens of final cause. Everything tends somewhere. The question is not what this entity is, but what it is becoming. If nothing changes and no story intervenes, where does this end up? What is already in motion that no one has fully recognized? Frame every field around trajectory, not current state.`;

    case "polis":
      return `LENS — POLIS (SOCIETY): Generate through the lens of the social fabric. This entity is constituted by the community that formed it. What does the world make of it? What virtues does it reward, what does it destroy, what contradictions does it create that the entity cannot resolve? Frame the description around social position, what the community values, and the gap between stated and actual values.`;

    case "world_hamartia":
      return `LENS — WORLD HAMARTIA (STRUCTURAL FLAW): Generate through the lens of systemic tension. This entity embodies or is caught inside an irresolvable contradiction — two legitimate goods in conflict, neither of which can win. This is not a defect; it is a structural tension that cannot be resolved, only managed. What is the central contradiction this entity lives inside?`;

    case "rhetoric":
      return `LENS — RHETORIC (MODES OF PERSUASION): Generate through the lens of Aristotle's Rhetoric. Every character argues from one of three modes: Ethos (authority — 'trust me because of who I am'), Pathos (emotion — 'feel what I feel'), Logos (logic — 'here is the reasoning'). The most revealing moment is which mode they retreat to when losing. Frame the description around how this entity persuades, argues, and communicates under pressure.`;

    case "gap":
      return `LENS — THE GAP (COMIC): Generate through the lens of the comic gap. Comedy = a specific visible deficiency + consequences that stop short of real lasting harm. The gap runs between what this entity believes to be true about itself and what the audience can clearly see is actually true. The gap must be visible to the audience before it is visible to the entity. Never let the entity fully see it — a full recognition closes the gap and ends the comedy. The wrongness must be recognizably human; the audience must want this entity to be okay, even while laughing at it. ONLY use this lens when style is Comic or Mixed.`;
  }
}
```

---

## Lens selector UI

### Placement in the form

The `LensSelector` sits **directly above the Generate button, below all optional fields**. Form flow becomes: pitch → role → style → lens → Generate. Discoverable but never blocking users who just want to type something and generate.

For `DialogueWriter`, the LensSelector sits **inline with the mood control**, not as a separate row. The dialogue surface is already busy (participants, mentions, mood, direction, pitch) — squeezing in another row hurts that screen. Sharing the mood row keeps the visual rhythm.

### Layout

Pill chips in a horizontal row, identical visual treatment to existing type chips. **Hamartia is first and selected by default. None is last, with reduced visual weight.** Visual order:

```
[Hamartia ✓] [Recognition] [Reversal] [Rhetoric] [Direction] [Society] [Gap*] [None]
                                                                              ↑
                                                                opacity .6
```

The selected chip is always the first chip. The `None` chip uses `opacity: 0.6` — same text size as other chips so the row doesn't look ragged, just lighter.

**No 6-chip cap.** Show all relevant lenses for the current tool (see per-tool table below). On narrow screens the row wraps to two lines — that's fine.

### Collapsed header

The selector is collapsed by default. It shows one line:

> Generated with: **{currentLabel}** ▾ &nbsp; ⓘ

`{currentLabel}` always reflects the current selection — `Hamartia` on a fresh form, `Recognition` if the user previously picked Recognition, etc.

The `ⓘ` icon is a small unobtrusive button. Clicking it re-displays the first-time hint card on demand (see below). Always available; not tied to first-time state.

Clicking the header expands the chip row.

### Discovery: first-time hint

The first time a user expands the selector (i.e. the first time `aristotelian-lens-discovered` is set in `localStorage`), display a one-time hint card directly below the chip row:

> **Lenses change the angle of generation.** Same world, same inputs — but a different lens asks the LLM a different question about your character. Hamartia (the default) generates a fatal flaw from their greatest strength. The others ask about what they don't yet know, what they're becoming, how they argue. Pick one or stay with Hamartia.
>
> [Got it]

`Got it` writes `aristotelian-lens-hint-dismissed: true` to localStorage and the card fades out. The card never appears again automatically. The `ⓘ` icon in the header always reopens it.

### Persistence

Once a user has expanded the selector (`aristotelian-lens-discovered: true`), every creation form opens with the selector already expanded — across forms, across sessions, across reloads. This is a one-way switch. Less hide-and-seek; more "you have this tool now."

### Plain-English description

Beneath the chip row, render a single line of plain-English explanatory text for the **currently selected lens**. Soft cap: **20 words per description** so it never wraps to three lines on narrow screens.

| Lens | Description (≤ 20 words) |
|---|---|
| Hamartia | *"Generates from the idea that your character's greatest quality is also what will destroy them."* |
| Recognition | *"Generates around what your character doesn't yet understand — and what happens when they finally do."* |
| Reversal | *"Generates around the structural irony: the choices they're making to protect themselves will undo them."* |
| Direction | *"Generates around where this is heading — not what it is now, but what it's becoming."* |
| Society | *"Generates from the social world that shaped this entity — what made it, what it can't escape."* |
| World flaw | *"Generates from an irresolvable contradiction — two things that are both true and can't both win."* |
| Rhetoric | *"Generates from how this character argues — what mode they use, and what they retreat to when losing."* |
| Comic gap | *"Generates from the gap between what this character believes about themselves and what everyone else sees."* |
| None | *"No framework. Generate without an Aristotelian angle."* |

When the selected lens changes, the description text **crossfades in 150ms** rather than hard-swapping — softer, less jumpy.

**No hover previews.** One always-visible description is enough — adding hover text creates two competing meta-text layers.

### Per-tool relevant lenses

**Order = likelihood of use for that entity type.** Default first, conditional/rare options later, None last as the explicit opt-out.

| Tool | Show these lenses (in this order) |
|---|---|
| Create Character | hamartia, anagnorisis, peripeteia, rhetoric, telos, polis, gap*, none |
| Create Faction | polis, world_hamartia, telos, peripeteia, hamartia, none |
| Create Location | world_hamartia, telos, anagnorisis, peripeteia, polis, none |
| Create Object | hamartia, telos, anagnorisis, peripeteia, polis, none |
| Dialogue Writer | hamartia, rhetoric, anagnorisis, none |
| Field regen (inline) | *Uses stored lens silently — no selector shown* |

Object's list **includes Telos and Polis** — both apply meaningfully to objects with histories, owners, and trajectories.

`gap` only appears in the Character row, and only when the current style is Comic or Mixed.

### Accessibility

- The collapsed header is a `<button>` with `aria-expanded={isExpanded}` and `aria-controls={chipRowId}`.
- The chip row is `role="radiogroup"` with `aria-label="Generation lens"`.
- Each chip is a `<button role="radio">` with `aria-checked` set on the selected chip.
- Arrow keys (Left/Right) move the selection between chips; Enter and Space confirm. The roving-tabindex pattern keeps the active chip in the tab order while inactive chips are `tabIndex={-1}`.
- The description region uses `aria-live="polite"` so screen readers announce the new description when the selection changes.
- The `ⓘ` reopen-hint button has an explicit `aria-label="Show lens explainer"`.
- The hint card itself is `role="status"` and contains a single dismiss button.

---

## Lens on entity detail pages

Show the lens as a small tag near the entity's name, alongside the existing role/style tags. **The tag is hoverable.** On hover (or tap on mobile):

> **Generated through Recognition.**
> Generates around what your character doesn't yet understand. Lens is fixed for this character — create a new character to try a different lens.

Plain-English description plus an honest statement of the v1 limitation. No click action.

**Hard rules:**
- When `lens === null`, **don't render the tag at all.** "Generated through None" is meaningless to the user.
- When `lens` is an unrecognized value (data drift, manual edit, future migration glitch), **don't render the tag.** Look up via `LENS_LABELS[lens]`; if it returns `undefined`, render nothing. Fail-soft.

---

## Field-level regen

When the user regenerates a single field on an existing entity, the entity's stored `lens` is read silently and passed through. **No lens picker is shown at the field level.** A character generated through Recognition should have its fields regenerated through Recognition — drifting back to Hamartia mid-character would break the entity's voice.

If `lens === null`, field regen also uses null.

No per-field lens override in v1.

---

## Phase verbs

Generation overlay verbs must be lens-aware across **every phase that runs after the lens engages** — not just one phase per entity type. A user who picks Recognition and sees "Reading the wound… / Counting the years…" during the History phase reasonably concludes the lens did nothing. Verbs are load-bearing UX, not polish.

Add `verbsByLens` maps to all phases except the structural opening ones (`identity` for characters, `describing` for entities — those run before any lens framing meaningfully shapes output). Full arrays land in the implementation — see [Appendix: Verb sets](#appendix-verb-sets).

Phase-verb selection logic:

```js
function pickVerbs(phase, lens) {
  if (lens && phase.verbsByLens?.[lens]) return phase.verbsByLens[lens];
  if (lens && import.meta.env.DEV) {
    console.warn(`[lens] No verbsByLens["${lens}"] for phase "${phase.id}" — falling back to default verbs.`);
  }
  return phase.verbs;
}
```

The dev warning catches coverage gaps during the verb-writing pass. Silent in production.

### Overlay header lens indicator

While generating, the overlay header shows the active lens:

> **Generating Caela Vorne**
> *through the lens of Recognition*

Suppress the "through the lens of …" line entirely when `lens === null` — just the entity name on its own.

---

## Dialogue generation

Replace the existing `hamartiaOn` boolean with a `lens` field. Migration rule:

- `hamartiaOn: true` → `lens: "hamartia"`
- `hamartiaOn: false` → `lens: null`

**Verify in code before writing the migration**: `hamartiaOn` lives on **each dialogue** inside `scene.dialogues[]`, NOT on the scene itself. Migrate per-dialogue. (Check `src/storage.js` migrations and `DialogueWriter.jsx` state shape.)

After migration, remove all references to `hamartiaOn` in `DialogueWriter.jsx` and `buildDialoguePrompt.js`. Don't keep both fields.

In `DialogueWriter.jsx`, the existing "Hamartia" toggle is replaced by the standard `LensSelector` component (Dialogue Writer lens list), rendered **inline with the existing mood control** rather than as a separate row.

---

## Lens × style interactions

Only one combination is genuinely contradictory: **Tragic + Gap**. Resolution: hide the `gap` chip whenever style is Tragic (already covered by the per-tool rule).

All other combinations are allowed and produce useful (if sometimes surprising) output. The LLM navigates the tension. We don't try to enumerate every pair.

---

## Storage migration

Bump `STORAGE_VERSION` in `src/constants.js` by 1. Follow the existing migration pattern in `src/storage.js` exactly — do not invent a new one.

Migration adds a `lens` field, defaulting to `"hamartia"`, to every existing entity that lacks one:

- `world.characters[*].lens = "hamartia"` if absent
- `world.factions[*].lens = "hamartia"` if absent
- `world.locations[*].lens = "hamartia"` if absent
- `world.objects[*].lens = "hamartia"` if absent
- For each `world.scenes[*].dialogues[*]`: convert `hamartiaOn` boolean to `lens` (`true → "hamartia"`, `false → null`), then `delete d.hamartiaOn`

### Atomic write on creation

When a user picks a lens and generates a new entity, **the lens is set on the entity at the same moment the parsed JSON is committed to the world** — same atomic write. If generation fails (malformed JSON, network error, user abort), no orphan lens. The lens travels with the entity record, never separate from it.

---

## Locked lens (v1) — and the friction it creates

A character's lens is set at creation and **cannot be changed**. The detail-page tag is hover-only with copy that says so.

**This is a real limitation.** A user who generates with Hamartia, then learns about lenses and wants to try Recognition, has to redo every seed input from memory. There is no "duplicate this character" action in the app today. We are acknowledging this friction explicitly in v1 rather than papering over it.

**The priority v2 follow-up is "Duplicate with new lens"** — not generic "regenerate with new lens." Duplicate-with-lens preserves the user's seed inputs (name, role, style, pitch) but runs generation through a different lens, producing a parallel character the user can compare and pick from. This is the right next step and should ship as the first v2 enhancement of the lens system.

---

## What's out of scope for v1

The following are real opportunities the lens system opens up. They are **deferred**, not forgotten:

- **Priority v2: "Duplicate character with new lens"** — preserve seed inputs, re-run generation through a different lens. Removes the lock-and-recreate friction described above.
- **World-level lens / world tonal anchor.** A world-level lens that becomes the default for all generation in that world. `telos` and `world_hamartia` are world concepts in Aristotle.
- **Relationship-web lens awareness.** Relationship-web generation could honor each character's stored lens when generating connections.
- **Cross-entity tonal consistency tooling.** A panel that surfaces lens distribution across a world to help writers spot tonal sprawl.
- **Cast analysis enhancement.** v2 idea was to add an anagnorisis-aware section to cast analysis. Deferred — the user-facing change would be invisible, and the cast analysis is already information-dense.

---

## Every file that needs to change

This is the complete v1 list. If a file is not on this list, it doesn't need changes for v1.

### Create
1. **`src/prompts/lensFraming.js`** — `getLensFraming(lens)` function. Single source of truth.
2. **`src/components/LensSelector.jsx`** — Collapsed-by-default pill row with first-time hint, ⓘ reopen, per-lens description, full keyboard a11y.

### Modify
3. **`src/constants.js`** — Add `LENS_OPTIONS`, `LENS_LABELS`, `LENS_DESCRIPTIONS`, `DEFAULT_LENS`, `PER_TOOL_LENSES`. Add `verbsByLens` maps to relevant phases in `PHASES` (and the parallel entity phases).
4. **`src/storage.js`** — Bump `STORAGE_VERSION`. Add the migration described above (including per-dialogue `hamartiaOn` → `lens`).
5. **`src/prompts/build.js`** — Accept `lens`. Inject `getLensFraming(lens)` in place of the implicit hamartia framing.
6. **`src/prompts/buildFactionPrompt.js`** — Accept `lens`. Inject framing.
7. **`src/prompts/buildLocationPrompt.js`** — Same.
8. **`src/prompts/buildObjectPrompt.js`** — Same.
9. **`src/prompts/buildDialoguePrompt.js`** — Replace `hamartiaOn` block with `getLensFraming(lens)`.
10. **`src/prompts/expand.js`** — Accept `lens`, default to entity's stored lens.
11. **`src/prompts/regen.js`** — Accept `lens`, read from character's stored `lens`.
12. **`src/prompts/entityRegen.js`** — Same for non-character entities.
13. **`src/prompts/fieldExpand.js`** — Same.
14. **`src/prompts/buildInterviewPrompt.js`** — Align hardcoded lens label names with `LENS_OPTIONS` values where they overlap. No user-facing lens selector here.
15. **`src/components/CreateCharacterScreen.jsx`** — Mount `LensSelector` above Generate. Pass `lens` through. Store on the created character atomically with the JSON parse.
16. **`src/components/CreateFactionScreen.jsx`** — Same pattern.
17. **`src/components/CreateLocationScreen.jsx`** — Same.
18. **`src/components/CreateObjectScreen.jsx`** — Same.
19. **`src/components/DialogueWriter.jsx`** — Remove `hamartiaOn` toggle. Mount `LensSelector` inline with the mood control. Pass `lens` to `buildDialoguePrompt`.
20. **`src/components/CharacterSheet.jsx`** — Hover-only lens tag.
21. **`src/components/FactionDetail.jsx`** — Same.
22. **`src/components/LocationDetail.jsx`** — Same.
23. **`src/components/ObjectDetail.jsx`** — Same.
24. **`src/components/GeneratingOverlay.jsx`** — Show "through the lens of {label}" header line when a non-null lens is active. Suppress when null.
25. **`src/components/CharField.jsx`** — Pass the entity's stored lens to regen/expand calls.
26. **`src/hooks/useGeneratingProgress.js`** — Accept `lens`. Use `phase.verbsByLens[lens]` when present; fall back to `phase.verbs` with a dev console warning.

**Not in v1**: `buildCastAnalysisPrompt.js` (deferred — see "Out of scope" above).

---

## Implementation order

1. **Foundation (no UI)**: `lensFraming.js`, constants additions (LENS_OPTIONS / LABELS / DESCRIPTIONS / PER_TOOL_LENSES / verbsByLens), `storage.js` migration. Verify a default-lens character generation produces output indistinguishable from today's in quality and tone (regression sanity check — output won't be byte-identical due to LLM nondeterminism).
2. **Prompt builders**: thread `lens` through every builder.
3. **`LensSelector` component**: collapsed chip row, first-time hint, ⓘ reopen, 150ms description crossfade, full a11y.
4. **Creation forms**: wire `LensSelector` into the four creation screens. Position above Generate. Atomic lens write on success.
5. **DialogueWriter**: swap toggle for `LensSelector` inline with mood. Migration check.
6. **Phase verbs + overlay header**: hook lens-aware verb selection into `useGeneratingProgress`. Add lens indicator line to overlay header.
7. **Detail pages**: hover-only lens tag on all four detail components.

Each step is independently testable. Commit at each milestone.

---

## How to verify completeness

After implementation, grep for every call site of each prompt builder. Each call must pass a `lens` argument explicitly — not rely on default. Any call without one is a gap.

```
src/prompts/build.js               — CreateCharacterScreen.jsx
src/prompts/buildFactionPrompt.js  — CreateFactionScreen.jsx
src/prompts/buildLocationPrompt.js — CreateLocationScreen.jsx
src/prompts/buildObjectPrompt.js   — CreateObjectScreen.jsx
src/prompts/buildDialoguePrompt.js — DialogueWriter.jsx
src/prompts/regen.js               — CharField.jsx, CharacterSheet.jsx
src/prompts/entityRegen.js         — FactionDetail.jsx, LocationDetail.jsx, ObjectDetail.jsx
src/prompts/fieldExpand.js         — CharField.jsx and entity detail components
src/prompts/expand.js              — CreateCharacterScreen.jsx (expand existing)
```

Functional checks:
- Generate a character with each lens. The hamartia, aristotelianNote, and overall framing should differ meaningfully.
- Generate a faction with `polis`, then with `world_hamartia`. Outputs should be structurally different.
- Open a pre-migration save. All entities should have `lens: "hamartia"`. Pre-migration dialogues should have `hamartiaOn` gone and `lens` correctly set.
- Hover the lens tag on a detail page — copy appears; lens label is correct; tag is omitted entirely for `lens: null` and for unknown values.
- Generate with `lens: "rhetoric"` — overlay header reads "through the lens of Rhetoric" and phase verbs come from the `rhetoric` set across all lens-aware phases.
- In dev mode, generate with a lens for which a phase has no `verbsByLens` entry — confirm `console.warn` fires once per missing combo.
- Keyboard: tab to the lens selector, press Enter to expand, arrow-key through chips, Enter to select, observe `aria-live` description update.

---

## What not to do

- **Do not implement the lens selector on one screen and leave the others.** All creation flows must ship together.
- **Do not change the output JSON schema for different lenses.** Same fields regardless.
- **Do not show all lenses on every tool.** The per-tool table is deliberate.
- **Do not add a lens picker to field regen.** Field regen uses the entity's stored lens silently.
- **Do not skip `lensFraming.js`.** Copying framing text into individual prompt builders causes drift.
- **Do not remove the None option.** Preserve the escape hatch.
- **Do not put None first in the chip row.** Default (Hamartia) goes first.
- **Do not show two layers of meta-text.** One always-visible description for the selected lens — no hover preview.
- **Do not migrate `hamartiaOn` per-scene.** It lives per-dialogue.
- **Do not render the lens tag for `lens: null` or unrecognized values.**
- **Do not write the lens onto an entity before generation succeeds.** Atomic write only.

---

## Appendix: Verb sets

I will write verb arrays for every lens × phase combination during step 1. Sketch:

### Character phases

```js
// "history" phase
{
  verbs: ["Digging through the past…", "Finding the wound…", "Counting the years…", ...],
  verbsByLens: {
    anagnorisis:   ["Finding what they refuse to look at…", "Tracing the blind spot back…", "Reading what's hidden from themselves…"],
    peripeteia:    ["Tracing the move that will undo them…", "Finding the seed of the reversal…", "Reading the irony backward…"],
    telos:         ["Reading the trajectory…", "Finding where this is heading…", "Following the momentum…"],
    polis:         ["Reading the world that made them…", "Tracing the social weight…", "Finding what was given and what was taken…"],
    rhetoric:      ["Listening for the mode…", "Finding what they argue from…", "Hearing the retreat under pressure…"],
    gap:           ["Finding the wrongness they can't see…", "Measuring the gap…", "Locating the misunderstanding…"],
  },
}

// "psychology" phase
{
  verbs: ["Mapping the desires…", "Weighing the fears…", "Reading the cracks…", ...],
  verbsByLens: {
    anagnorisis:   ["Locating what they don't yet know…", "Mapping the recognition to come…", "Finding the truth approaching…"],
    peripeteia:    ["Tracing how the same move becomes the wound…", "Reading the structural irony…", "Following the logic of undoing…"],
    telos:         ["Reading where the desires lead…", "Following the trajectory of want…", "Finding what they're becoming…"],
    polis:         ["Reading what the world rewards in them…", "Finding what was made of them…", "Tracing the contradiction the world creates…"],
    rhetoric:      ["Finding what mode they trust…", "Reading who they argue against in their own head…", "Hearing the inner persuasion…"],
    gap:           ["Reading the gap between belief and truth…", "Finding what the audience already knows…", "Measuring the wrongness…"],
  },
}

// "core" and "dialogue" phases — full arrays written during implementation, same structure.
```

### Entity (object / faction / location) phases

```js
// "contextualising" phase — written per lens, tuned to entity type.
```

Voice matches existing PHASES verbs — short ellipsis-terminated phrases, in the project's idiom.
