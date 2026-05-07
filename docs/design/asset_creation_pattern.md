# Asset creation — shared pattern

This document describes the consistent UX and technical pattern used across all asset creation tools: Create Object, Create Faction, and Create Location. When building any of these, treat this as the canonical reference. The individual feature specs (object_creation.md, faction_creation.md, location_creation.md) define what's unique to each type; this document defines what they share.

---

## The three creation tools

| Tool | Output fields | Accent colour | Individual spec |
|---|---|---|---|
| Create Object | description, provenance, dramatic_weight, signature_line | Amber | object_creation.md |
| Create Faction | description, history, dramatic_role, internal_tension, motto | Sage green | faction_creation.md |
| Create Location | description, history, dramatic_role, signature_line | Steel blue | location_creation.md |

Each tool has its own HTML mockup in this folder demonstrating the full interactive form.

---

## Shared form structure

Every creation form follows this exact top-to-bottom order. Do not reorder sections.

```
1. Your idea       — pitch textarea, always first
2. [divider]
3. Type selector   — chips row, none selected by default
4. Name            — optional text input
5. Core details    — three dropdowns (vary per tool), all None by default
6. Type-specific   — revealed when a type chip is selected, hidden otherwise
7. [divider]
8. Associations    — character / faction / location chips with inline note inputs
9. Output panel    — hidden until generation completes
```

The footer contains: Discard · Save draft · Generate → (left to right). Discard triggers an inline confirmation that replaces the footer row — no modal.

---

## The pitch-first principle

The pitch textarea is always the first element in the form. All other fields are optional and default to None or empty. A user should be able to write a pitch and hit Generate without touching anything else.

This has two consequences for how the LLM prompt is built:
- Fields set to None are omitted from the prompt entirely — they add nothing
- The pitch carries the full creative intent; structured fields are additive context, not required scaffolding

Enforce this in the UI: Generate is disabled when pitch is empty. Save is enabled when either pitch or name has content.

---

## Type chips

A horizontal wrapping row of pill-shaped chips. One can be selected at a time; clicking the selected chip again deselects it. Selecting a type reveals a two-field grid of type-specific dropdowns below the core details. Deselecting hides them again.

All chips start unselected. "Custom" is always the last chip and reveals a single free-text input instead of dropdowns.

Implementation note: use `data-type` on each chip and look up `#type-fields-{type}` by ID to show/hide the relevant panel.

---

## Core details (three dropdowns)

Each tool has three dropdowns positioned in a three-column grid. All default to the empty "None" option. When None is selected, the field is excluded from the LLM prompt.

| Tool | Dropdown 1 | Dropdown 2 | Dropdown 3 |
|---|---|---|---|
| Object | Rarity | Age / Era | Condition |
| Faction | Size | Status | Age |
| Location | Scale | Status | Access |

Dropdown structure: a labelled box with the field name at the top in small caps and a select element below. Use custom CSS to hide the native arrow and render a consistent chevron across browsers.

---

## Associations

Every form has an Associations section with sub-sections for each relevant asset type. The available sub-sections vary by tool:

| Tool | Sub-sections |
|---|---|
| Object | Characters, Factions, Locations |
| Faction | Characters, Locations |
| Location | Characters, Factions |

Each sub-section shows the existing assets in the world as selectable chips (multi-select, none selected by default). Assets are pulled from the current world's state arrays at render time.

**Empty states:** If a world has no assets of a given type yet, show a short italic message instead of chips: "No [type] yet — add them once the [Tool] tool is built." This applies to Factions and Locations in the short term since those tools are being built now.

**Inline note inputs:** When a chip is selected, a note row appears below that sub-section's chip row. The row shows the asset name (in the tool's accent colour) and a short text input asking about the connection. This is optional and can be left blank. When a chip is deselected, its note row is removed and the content discarded.

Note input placeholder text is contextual:
- Characters in Object: *"e.g. she inherited it, it was used against him…"*
- Characters in Faction: *"e.g. she founded it, he betrayed them, they're hunting her…"*
- Characters in Location: *"e.g. she was born here, he's imprisoned here, they're trying to reach it…"*
- Factions in Object: *"e.g. it was made by them, it symbolises their power…"*
- Factions in Location: *"e.g. they control it, they're fighting over it, they were driven out of here…"*
- Locations in Object: *"e.g. it was found here, it was hidden here…"*
- Locations in Faction: *"e.g. this is their base, they control this region…"*

---

## Generation output

All three tools follow the same output pattern:

1. **Description** — sensory, grounded, physical. What it is. What it looks/sounds/feels like.
2. **History / Provenance** — where it came from, what it has been through, what shaped it.
3. **Dramatic role / weight** — why it matters to the story. What conflict does it embody or enable?
4. **Signature field** — a single memorable line that captures the essence. Objects and Locations get a `signature_line`. Factions get two: `internal_tension` (the gap between self-image and reality) and `motto`.

The signature field is rendered in serif italic in the accent colour for that tool.

---

## Button states

All three forms share the same footer button logic:

| Condition | Discard | Save draft | Generate |
|---|---|---|---|
| Form empty | disabled | disabled | disabled |
| Pitch filled | enabled | enabled | enabled |
| Name only filled | enabled | enabled | disabled |
| Discard clicked | — | — | — (confirmation replaces footer) |
| Generating | (hidden) | (hidden) | replaced by spinner + "Generating…" |
| Post-generation | enabled | enabled | becomes "Regenerate →" |

**Discard confirmation:** Inline, replaces the footer row. Shows the message "Discard this [asset type]? Any unsaved work will be lost." with two buttons: Keep editing (returns to normal footer) and Discard (resets form and navigates away or clears state).

**Save draft:** Saves the current form state without generating. The asset is saved with whatever the user typed — pitch becomes the description, other fields stored as metadata. Asset appears in the Library with a draft indicator.

---

## State management

Each asset type lives in its own array on the world object:

```
world.characters  — existing
world.objects     — new
world.factions    — new
world.locations   — new
```

All follow the same pattern as `world.characters`. State mutations:

```js
addObject(o)        updateObject(o)
addFaction(f)       updateFaction(f)
addLocation(l)      updateLocation(l)
```

All use immutable `.map()` patterns. No external state library.

Association fields store IDs, not names. Names are resolved at render time and prompt-build time. This means if a character is renamed, associations update automatically.

---

## Streaming and generation

All three tools use the existing `useGeneratingProgress` hook. Objects, Factions, and Locations are simpler than characters, so use 3 phases instead of 6:

```
Phase 1: describing    — streaming the description field
Phase 2: contextualising — streaming history/provenance and dramatic role
Phase 3: finishing     — streaming signature fields
```

The `MIN_PHASE_MS = 4000` constant applies here too — keep it for legibility.

---

## Accent colours

Each tool has a distinct accent colour used for: selected association chips, note row names, and the signature line text. This gives each form a distinct feel while keeping the structural layout identical.

| Tool | Accent (light mode) | Accent bg |
|---|---|---|
| Object | `#b87d1a` (amber) | `#fdf3e0` |
| Faction | `#4a6741` (sage green) | `#edf2ec` |
| Location | `#3a5f7a` (steel blue) | `#eaf1f6` |

The rest of the UI (borders, text, backgrounds, buttons) is identical across all three forms.

---

## What's consistent, what varies

**Always the same:**
- Form section order
- Pitch-first principle
- Type chip behaviour
- Core details grid (3 columns, all None default)
- Associations behaviour (chips + inline notes)
- Footer buttons and discard confirmation
- Output panel structure (description → history → dramatic → signature)
- State mutation pattern
- Streaming hook usage

**Varies per tool:**
- Type chip labels and count
- Core detail dropdown labels and options
- Type-specific field sets
- Which association sub-sections appear
- Note input placeholder text
- Output JSON field names
- Accent colour
- LLM prompt framing and the specific angle of the "dramatic" output field
