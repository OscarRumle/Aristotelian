# Create Faction — feature spec

## Overview

The Create Faction tool lets users add organised groups to their world — noble houses, guilds, religious orders, criminal networks, rebel movements, secret societies, and anything in between. Factions are the structural forces that characters belong to, fight for, and betray. They give the world political texture and create the conditions for dramatic conflict.

The form follows the same pattern as Create Object: pitch first, all options default to None, associations link to existing world assets with optional notes, and the user can generate or save manually.

---

## Core principle

A faction is most interesting when it has an internal contradiction — something it believes about itself that isn't quite true, or something it wants that conflicts with what it claims to stand for. The pitch and the dramatic role output should draw that out. The form is designed to give the LLM enough context to find that tension.

---

## Form structure

### 1. Your idea (top, required for Generate)

Free-text textarea. Placeholder: "Describe the faction — who they are, what they want, what they'd do to get it."

### 2. Faction type

Chips: Noble House, Guild, Military Order, Religious / Cult, Political, Criminal / Underground, Secret Society, Rebel / Revolutionary, Custom.

Default: none selected. Selecting a type reveals type-specific fields.

### 3. Name (optional)

Plain text input. If blank, the LLM invents a name. Placeholder: "Leave blank to let the world name them."

### 4. Core details

Three dropdowns, all defaulting to None:

- **Size** — None / Cell (a handful) / Small (dozens) / Established (hundreds) / Vast (thousands+)
- **Status** — None / Rising / Stable / Declining / Fractured / Secret / Disbanded
- **Age** — None / Ancient / Old / Established / Recent / New

### 5. Type-specific fields

| Type | Field 1 | Field 2 |
|---|---|---|
| Noble House | Seat: Capital / Provincial / Frontier / Exiled | Standing: Ruling / Noble / Minor / Fallen |
| Guild | Trade: Merchant / Craft / Information / Magic / Labour | Reach: Local / Regional / Empire-wide |
| Military Order | Loyalty: Crown / Independent / Mercenary / Church | Speciality: Infantry / Cavalry / Naval / Arcane / Assassins |
| Religious / Cult | Practice: Public worship / Mystery cult / Forbidden / Heretical | Orthodoxy: Mainstream / Reformed / Splinter / Outlawed |
| Political | Allegiance: Throne / Reform / Independence / Oligarchy | Method: Diplomacy / Intrigue / Propaganda / Force |
| Criminal / Underground | Territory: City-wide / Regional / Cross-border / Nomadic | Trade: Smuggling / Information / Assassination / Extortion |
| Secret Society | Visibility: Open secret / Rumoured / Truly hidden | Goal: Known / Partially known / Unknown |
| Rebel / Revolutionary | Cause: Political / Religious / Economic / Ethnic / Ideological | Tactics: Guerrilla / Propaganda / Assassination / Open warfare |
| Custom | Free text: "What kind of organisation is this?" | — |

### 6. Associations

Two sub-sections: Characters, Locations. (Faction-to-faction associations — allies, rivals — come once the Factions feature is fully built and other factions exist in the world.)

Same behaviour as Create Object: selecting a chip reveals an inline note input below that section. Note is optional.

**Characters** — drawn from `world.characters`. Note placeholder: *"e.g. she founded it, he betrayed them, they're hunting her…"*

**Locations** — drawn from `world.locations`. Note placeholder: *"e.g. this is their base, they control this region, they were driven out of here…"*

---

## Generation output

```
name            — string
type            — string
description     — string (what the faction is, how it presents itself publicly)
history         — string (how it came to be, key moments, what shaped it)
dramatic_role   — string (what conflict does it embody? what does it want, and what does that cost the world?)
internal_tension — string (the contradiction at its heart — what it believes vs. what it does)
motto           — string (a phrase, creed, or saying — real or unspoken — that captures their self-image)
```

The `internal_tension` field is the Aristotelian angle for factions. Every interesting faction has a gap between its stated purpose and its actual behaviour — the religious order that tortures in the name of mercy, the guild that claims to protect workers while exploiting them, the noble house that talks of honour while poisoning its rivals. This field names that gap explicitly and gives the writer something to dramatise.

---

## LLM prompt strategy

```
You are creating a faction for [world name], described as: [world description].

The user describes their faction: [pitch]

[if type set] Faction type: [type]
[if type-specific fields set] [field]: [value]
[if name provided] The faction is called [name]
[if size/status/age set] [field]: [value]
[if associations set] This faction is associated with:
  [for each character] [name] — [role], [summary][if note: "; [note]"]
  [for each location] [name] — [summary][if note: "; [note]"]

Generate a JSON object with fields:
name, type, description, history, dramatic_role, internal_tension, motto

The internal_tension should identify the gap between what this faction believes about itself and what it actually does or represents. This is what makes them dramatically interesting rather than a flat force of good or evil.
```

---

## Technical notes

- Factions stored in `world.factions` array, same pattern as `world.characters`
- `addFaction(f)` and `updateFaction(f)` follow the same immutable `.map()` pattern
- Association IDs reference `world.characters` and `world.locations` (when locations exist)
- Once multiple factions exist, faction-to-faction associations (ally/rival/enemy) can be added as a fourth field in the associations section
- Streaming: same `useGeneratingProgress` hook, 3 phases (describing → contextualising → finishing)
