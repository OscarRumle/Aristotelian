# Create Object — feature spec

## Overview

The Create Object tool lets users add objects to their world. An object can be a weapon, artifact, document, symbol, garment, structure, or anything custom. The tool has two modes: generate (LLM writes the object based on your input) and save (manually written, no generation). Everything is optional except the pitch — the one thing the user must provide is their idea.

---

## Core principle: pitch-first, options second

The pitch textarea comes first in the form. Every other field is optional and defaults to None. If the user writes a pitch and hits Generate without touching anything else, the LLM bases the output entirely on the pitch. Options exist to give the LLM more to work with — they're additive, not required.

This mirrors the character tool and keeps the creation experience fast. A user who knows what they want can get from blank form to generated object in under a minute.

---

## Form structure

### 1. Your idea (top, required for Generate)

A free-text textarea. Sits at the very top of the form. Placeholder guides the user: "Describe your object — what it is, what makes it interesting, what role it plays in your world."

This is the only field that blocks generation. If it's empty and the user clicks Generate, show an inline error.

### 2. Object type

A row of chips: Weapon, Artifact, Garment / Regalia, Document, Symbol, Structure, Custom.

Default: none selected. Selecting a type reveals a small set of type-specific detail fields below the core fields. Deselecting hides them again.

### 3. Name (optional)

Plain text input. If left blank, the LLM is instructed to invent a name. Placeholder: "Leave blank to let the world name it."

### 4. Core details

Three small dropdowns, all defaulting to None:

- **Rarity** — None / Common / Rare / Unique / Legendary
- **Age / Era** — None / Ancient / Historical / Contemporary / Recent
- **Condition** — None / Pristine / Worn / Damaged / Destroyed / Lost

When set to None, the field is omitted from the LLM prompt and the LLM infers from context.

### 5. Type-specific fields

Appears only when a type is selected. All fields default to None.

| Type | Field 1 | Field 2 |
|---|---|---|
| Weapon | Form: Blade / Ranged / Blunt / Polearm / Magical | Scale: Personal / Ceremonial / War |
| Artifact | Origin: Crafted / Natural / Divine / Unknown | Nature: Mundane / Enchanted / Cursed |
| Garment / Regalia | Kind: Armor / Robe / Crown / Seal / Jewelry / Standard | Context: Everyday / Ceremonial / Battle |
| Document | Form: Letter / Map / Contract / Prophecy / Tome / Decree | Secrecy: Public / Private / Secret / Forbidden |
| Symbol | Form: Sigil / Seal / Banner / Mark / Crest | Affiliation: Character / Faction / Religion / Place |
| Structure | Kind: Tower / Ruin / Chamber / Settlement / Shrine | Status: Standing / Ruined / Abandoned / Lost |
| Custom | Free text: "What kind of thing is this?" | — |

### 6. Associations

Three sub-sections: Characters, Factions, Locations. Each shows the existing world assets as selectable chips. Multiple can be selected across all three. All start unselected.

The associations tell the LLM whose story this object belongs to. A sword associated with Caela Vorne will be framed through her story, her arc, and her hamartia. An unassociated sword is described more neutrally.

**When a chip is selected, a note input appears inline below that section's chip row.** One row per selected asset, showing the asset name and a short text field: "What's the connection?" This is optional — left blank, the LLM just knows the association exists. Filled in, it gives the LLM specific context: "she inherited it from her father but has never worn it" shapes the output in ways that just attaching a name can't.

Placeholder text is contextual to the asset type:
- Characters: *"e.g. she inherited it, it was used against him…"*
- Factions: *"e.g. it was made by them, it symbolises their power…"*
- Locations: *"e.g. it was found here, it was hidden here…"*

Deselecting a chip removes its note row and discards the note text.

Assets shown in each section are pulled from the current world:
- **Characters** — all characters in `world.characters`
- **Factions** — all factions in `world.factions` (once that feature exists)
- **Locations** — all locations in `world.locations` (once that feature exists)

If a world has no characters yet, the Characters section shows an empty state: "No characters yet — create one first."

---

## Generation output

When the LLM generates an object, it returns a structured JSON with the following fields:

```
name          — string (or confirm user-provided name)
type          — string
description   — string (physical description, sensory detail)
provenance    — string (where it came from, whose hands it's been in)
dramatic_weight — string (what conflict, meaning, or power it carries)
signature_line  — string (one memorable line — not a quote, more like a caption)
```

The `dramatic_weight` field is what separates this from a generic item generator. It answers: why does this object matter to the story? What does it cost to possess it? What does it represent?

---

## Save without generating

The user can fill in the form and click Save without generating anything. In this case the object is saved with whatever the user has typed — pitch becomes the description, other fields are stored as metadata. The object appears in the Library with a "draft" indicator.

This is useful for users who already have detailed ideas and don't need generation, or who want to save a placeholder and return to it later.

---

## Discard flow

Clicking Discard shows an inline confirmation in the footer area (not a modal):

> "Discard this object? Any unsaved work will be lost." [Discard] [Keep editing]

The confirmation replaces the footer buttons rather than overlaying the form. This keeps it lightweight without being dismissible by clicking away accidentally.

---

## Footer button states

| State | Buttons shown |
|---|---|
| Form empty | Discard (disabled) · Save (disabled) · Generate (disabled) |
| Pitch filled, nothing else | Discard · Save · Generate → |
| Discard clicked | "Discard this object?" [Discard] [Keep editing] |
| Generating | Discard (disabled) · [spinner] Generating… |
| Generated | Discard · Save · Regenerate |

Generate is only enabled when the pitch has content. Save is enabled when either the pitch or the name has content.

---

## LLM prompt strategy

The prompt is built from the filled fields only. Fields set to None are omitted. The prompt structure:

```
You are creating an object for [world name], a world described as: [world description].

The user describes their object: [pitch]

[if type set] Object type: [type]
[if type-specific fields set] [field]: [value]
[if name provided] The object is called [name]
[if rarity/era/condition set] [field]: [value]
[if associations set] This object is associated with:
  [for each character] [name] — [role], [one-line character summary][if note: "; [user's note]"]
  [for each faction] [name] — [one-line faction summary][if note: "; [user's note]"]

Generate a JSON object with the following fields:
name, type, description, provenance, dramatic_weight, signature_line

The dramatic_weight should address: what conflict or meaning does this object carry? What does it cost to hold it? What does it represent in this world's story?
```

---

## Technical notes

- Object schema lives in `src/prompts/schema.js` alongside the character schema
- World objects stored in `world.objects` array, same pattern as `world.characters`
- `addObject(o)` and `updateObject(o)` follow the same immutable `.map()` pattern as character state mutations
- The associations field stores IDs, not names — names are resolved at render and prompt-build time
- Streaming: use the same `useGeneratingProgress` hook as character generation; objects are simpler so phase count can be reduced to 3 (describing → contextualising → finishing)
