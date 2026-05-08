# Design: Global Field Actions — Edit / Feedback / Expand / Regenerate

**Status:** Draft  
**Scope:** All narrative text fields across Characters, Worlds, Factions, Locations, Objects

---

## 1. Problem

The app currently has an uneven editing experience:

- `CharacterSheet` fields use `CharField`, which has Feedback + Regenerate but no Expand and no manual edit.
- `WorldDetail` uses `EditableText`, which has manual edit only — no AI actions.
- `FactionDetail`, `LocationDetail`, `ObjectDetail` have essentially no field-level editing at all.

The goal is a unified system: one component, four actions, consistent UX everywhere, and a new Expand capability that doesn't exist yet.

---

## 2. The Four Actions

### 2.1 Edit (manual)
Click the field value → becomes a textarea → Save / Discard. No LLM involved.  
*Already implemented in `EditableText.jsx`. Needs to be merged into the unified component.*

### 2.2 Feedback → Regenerate
User writes what they want changed. LLM rewrites only that field, leaving the rest of the character/entity intact. The feedback is a constraint, not a full re-prompt.

- Result shown as a pending value (not committed yet)
- User confirms or discards
- Existing: `regen.js → buildRegenPrompt(world, character, fieldKey, feedback)` already handles this. No prompt changes needed.

### 2.3 Expand
User appends to a field by giving the LLM a direction — or nothing, and the LLM decides. Two modes:

**Vertical** — goes deeper on what's already there. More detail, more texture, same subject.  
Example: field describes a city's traffic. Vertical writes more about the traffic — congestion patterns, the smell, the specific chaos of rush hour.

**Horizontal** — introduces new adjacent content that doesn't exist yet.  
Example: same city field. Horizontal invents the sewer system, the underground market, something adjacent and new.

**Result behavior:** appends to the existing field value. Never replaces. The original stays intact; new content is added after it.

**Input:** optional direction text. If blank, the LLM decides what to expand on.

This requires a new prompt builder: `buildFieldExpandPrompt`. See Section 4.

### 2.4 Regenerate (blind re-roll)
Runs the same prompt again without any changes. Used to fish for a different result when the current one is fine but not quite right.

- Replaces field content (not appends)
- Shows result as pending → confirm / discard
- Existing: same `buildRegenPrompt` with no feedback string.

---

## 3. Field Classification

Not all fields get all actions. Classification is by field type:

| Type | Description | Actions |
|---|---|---|
| **Narrative** | Paragraph or multi-sentence prose | Edit, Feedback, Expand, Regenerate |
| **Short narrative** | 1–2 sentence description or note | Edit, Feedback, Regenerate (no Expand) |
| **Structured** | Single value: name, age, role, gender | Edit only |

### Character field classification

| Field | Type |
|---|---|
| `name`, `age`, `gender`, `race`, `role`, `style` | Structured |
| `summary[0/1/2]` | Short narrative |
| `appearance`, `clothing`, `details` | Short narrative |
| `background`, `personality`, `desires`, `fears` | Narrative |
| `moralCore`, `hamartia`, `consistency` | Short narrative |
| `speechMode`, `underPressure`, `subtext`, `voicePattern` | Short narrative |
| `collectiveHamartia`, `aristotelianNote` | Short narrative |
| `quote` | Short narrative |

### World / Faction / Location / Object

All prose description fields are Narrative. Names are Structured.

---

## 4. New Prompt: `buildFieldExpandPrompt`

New file: `src/prompts/fieldExpand.js`

```js
export function buildFieldExpandPrompt(entityType, entity, world, fieldKey, mode, direction = "") {
  const currentValue = entity[fieldKey];
  const directionClause = direction.trim()
    ? `Direction from the user: "${direction.trim()}"`
    : `No direction given — use your judgment about what would enrich this content.`;

  const modeInstruction = mode === "vertical"
    ? `VERTICAL EXPAND: Write more about the same subject already present. Add depth, texture, and specificity to what is already described. Do not introduce new topics.`
    : `HORIZONTAL EXPAND: Introduce entirely new content adjacent to what is already described. The new content should not overlap with the existing text — it should open up new ground within the same world/entity context.`;

  return `You are expanding one field of an existing ${entityType}.

WORLD: ${world.name}
${world.description}

${entityType.toUpperCase()}: ${JSON.stringify(entity)}

FIELD: "${fieldKey}"
CURRENT VALUE:
${currentValue}

${modeInstruction}

${directionClause}

Write ONLY the new content to append. Do not repeat or summarize the existing text. Do not include labels, headers, or preamble. Plain prose only.`;
}
```

Key constraints passed to the model:
- Full entity context (so the new content stays consistent)
- World context (so the new content fits the setting)
- Mode instruction (vertical vs horizontal)
- The current value (so the model knows what's already there)
- Result is append-only — the prompt asks for new content only

---

## 5. Unified Component: `CharField` (upgraded)

`CharField.jsx` becomes the single field component used everywhere. It absorbs the edit functionality from `EditableText.jsx`.

### Props

```js
CharField({
  label,          // string — display label
  value,          // string — current field value
  fieldKey,       // string — key in entity JSON
  entityType,     // "character" | "world" | "faction" | "location" | "object"
  entity,         // full entity object (for context in prompts)
  world,          // world object (always needed for context)
  multiline,      // bool — textarea vs input in edit mode
  canExpand,      // bool — show Expand action (Narrative fields only)
  philNote,       // string | null — philosophy tooltip
  onSave,         // (fieldKey, value) => void — manual edit save
  onRegen,        // (fieldKey) => void — blind regenerate
  onRegenWithFeedback,  // (fieldKey, feedback) => void — feedback regen
  onExpand,       // (fieldKey, mode, direction) => void — expand
  regenningKey,   // string | null — which field is currently loading
  children,       // optional — override the value display
})
```

### Action bar layout

```
[label]   [?]  [✎ Edit]  [✦ Expand]  [✎ Feedback]  [↻ Regen]
```

On small fields or mobile, collapse to icon-only buttons.

### State machine per field

```
idle
  → editing (Edit clicked) → idle (Save / Discard)
  → feedback-open (Feedback clicked) → loading → pending-confirm → idle
  → expand-open (Expand clicked) → loading → idle (appended immediately)
  → loading (Regen clicked) → pending-confirm → idle
```

Expand does not show a confirm/discard step — the append is immediate. The user can undo via Edit if needed. This keeps the Expand flow fast.

### Expand panel UI

When Expand is open:

```
[ Vertical | Horizontal ]   ← toggle, Vertical default
[ Direction (optional)... ]
[ Expand → ]
```

Loading state: same `AnimatedVerbs` spinner as regen, but with expand-specific verbs (e.g. "Deepening…", "Branching…").

---

## 6. Context Propagation

Every entity detail screen (CharacterSheet, WorldDetail, FactionDetail, LocationDetail, ObjectDetail) needs to pass:

- `entity` — the full object being viewed
- `world` — the world it belongs to
- `entityType` — the string label

These are already available in `App.jsx` state. They need to be threaded into the field rendering layer in each detail component.

For characters: `entity = character`, `world = activeWorld`, `entityType = "character"`  
For worlds: `entity = world`, `world = world` (same), `entityType = "world"`  
For factions/locations/objects: `entity = item`, `world = activeWorld`, `entityType = "faction"` etc.

---

## 7. Expand Handler in `App.jsx`

```js
async function expandField(entityType, entityId, fieldKey, mode, direction) {
  const entity = getEntity(entityType, entityId);
  const world = getWorld(entity.worldId);
  const prompt = buildFieldExpandPrompt(entityType, entity, world, fieldKey, mode, direction);
  const addition = await callClaude(prompt);
  const newValue = entity[fieldKey] + "\n\n" + addition.trim();
  updateEntity(entityType, entityId, { [fieldKey]: newValue });
}
```

No pending-confirm step for Expand. The addition is applied directly. Field is updated in storage immediately.

---

## 8. What `EditableText.jsx` Becomes

Once CharField absorbs Edit mode, `EditableText.jsx` can be kept as a thin internal primitive (the actual textarea/input logic) that CharField uses internally. Or it can be deleted. Either way, call sites should migrate to CharField.

WorldDetail currently has one `EditableText` usage (world description field). This becomes a CharField with `canExpand={true}` and no `philNote`.

---

## 9. What `expand.js` Stays As

The existing `src/prompts/expand.js` (`buildExpandPrompt`) is a different feature — it fills in missing fields when a character was only partially created. That's "character-level expand", not "field-level expand". Keep it, don't touch it.

The new `fieldExpand.js` is the field-level operation designed here.

---

## 10. Implementation Order

1. **Write `fieldExpand.js`** — new prompt builder (Section 4)
2. **Add Expand state + handler to CharField** — mode toggle, direction input, loading state, append logic
3. **Add Edit mode to CharField** — absorb EditableText inline editing
4. **Migrate WorldDetail** — replace EditableText with upgraded CharField
5. **Add CharField to FactionDetail, LocationDetail, ObjectDetail** — where they currently show plain text
6. **Field classification pass** — set `canExpand`, `multiline`, `philNote` correctly per field in each detail screen
7. **Add expand-specific AnimatedVerbs** — "Deepening…", "Branching…", "Digging…", "Diverging…"

---

## 11. Out of Scope (for now)

- Undo history — Save/Discard in Edit mode is the only protection
- Expand on structured fields (name, age, role) — never
- Expand on `summary[]` array — needs array-aware handling, defer
- Diff view comparing original vs expanded — could be useful later
- Per-field generation loading in the full overlay — fields use inline spinners only
