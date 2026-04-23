# Create Location — feature spec

## Overview

The Create Location tool lets users add places to their world — cities, ruins, towers, hidden valleys, contested borders, sacred sites, prisons. Locations are where things happen. They're the stages for dramatic scenes, the prizes factions fight over, the places characters are from or flee to or are trying to reach. A well-written location has atmosphere, history, and dramatic weight — not just coordinates on a map.

Same form pattern as Create Object and Create Faction: pitch first, all options default to None, associations link to existing world assets, generate or save manually.

---

## Core principle

The most dramatically useful locations have a tension built into them — a place that promises safety but delivers danger, a city that was once great and now isn't, a ruin that holds something someone desperately wants. The form is designed to surface that, and the `dramatic_role` output names it explicitly.

---

## Form structure

### 1. Your idea (top, required for Generate)

Free-text textarea. Placeholder: "Describe the location — what it is, what it feels like, why it matters to your world."

### 2. Location type

Chips: Settlement, Structure, Landscape, Region, Ruin, Hidden / Secret, Custom.

Default: none selected. Selecting a type reveals type-specific fields.

### 3. Name (optional)

Plain text input. If blank, the LLM invents a name. Placeholder: "Leave blank to let the world name it."

### 4. Core details

Three dropdowns, all defaulting to None:

- **Scale** — None / Room or chamber / Building / District or landmark / Settlement / Region / Vast territory
- **Status** — None / Thriving / Struggling / Abandoned / Ruined / Mythic / Unknown
- **Access** — None / Open / Restricted / Guarded / Secret / Lost

### 5. Type-specific fields

| Type | Field 1 | Field 2 |
|---|---|---|
| Settlement | Size: Hamlet / Town / City / Capital / Sprawling | Governance: Monarchy / Republic / Guild-run / Theocracy / Lawless |
| Structure | Purpose: Military / Religious / Civic / Private / Arcane | Condition: Intact / Damaged / Derelict / Ruined |
| Landscape | Terrain: Forest / Mountain / Coast / Wetland / Desert / Plains / Underground | Danger: Safe / Hazardous / Deadly / Unknown |
| Region | Climate: Temperate / Arid / Arctic / Tropical / Blighted | Control: Unified / Contested / Fractured / Ungoverned |
| Ruin | What it was: City / Fortress / Temple / Estate / Settlement | Cause of fall: War / Disaster / Plague / Abandonment / Unknown |
| Hidden / Secret | Concealment: Physically hidden / Magically hidden / Unknown to most / Known but unreachable | Who knows: One person / A few / A faction / A legend |
| Custom | Free text: "What kind of place is this?" | — |

### 6. Associations

Two sub-sections: Characters, Factions.

Same behaviour as Create Object and Create Faction: selecting a chip reveals an inline note input below that section. Note is optional.

**Characters** — drawn from `world.characters`. Note placeholder: *"e.g. she was born here, he's imprisoned here, they're trying to reach it…"*

**Factions** — drawn from `world.factions`. Note placeholder: *"e.g. they control it, they're fighting over it, they were driven out of here…"*

---

## Generation output

```
name            — string
type            — string
description     — string (sensory, atmospheric — what it looks, sounds, smells like; what it feels like to be there)
history         — string (what happened here; how it became what it is; what it used to be)
dramatic_role   — string (what conflict does this place embody or enable? what does it mean to the story?)
signature_line  — string (one evocative line that captures the place — not a quote, more like a caption or epitaph)
```

The `description` field should be sensory and grounded — the reader should be able to see the place. The `dramatic_role` field is what separates this from a geography entry: it names what the location means to the story, not just what it is.

---

## LLM prompt strategy

```
You are creating a location for [world name], described as: [world description].

The user describes their location: [pitch]

[if type set] Location type: [type]
[if type-specific fields set] [field]: [value]
[if name provided] The location is called [name]
[if scale/status/access set] [field]: [value]
[if associations set] This location is associated with:
  [for each character] [name] — [role], [summary][if note: "; [note]"]
  [for each faction] [name] — [one-line summary][if note: "; [note]"]

Generate a JSON object with fields:
name, type, description, history, dramatic_role, signature_line

The description should be sensory and specific — not "a dark castle" but what makes this particular place feel the way it does. The dramatic_role should address: what conflict or meaning does this place carry? Who wants it, who fears it, who is defined by it?
```

---

## Technical notes

- Locations stored in `world.locations` array, same pattern as `world.characters` and `world.factions`
- `addLocation(l)` and `updateLocation(l)` follow the same immutable `.map()` pattern
- Association IDs reference `world.characters` and `world.factions`
- Once locations exist, they become available as association options in Create Object and Create Faction forms
- Streaming: same `useStream` hook, 3 phases (describing → contextualising → finishing)
- Scale field maps to a rough prompt instruction about how much geographic/physical detail to include
