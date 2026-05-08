# Feature Spec: Cast Analysis — Character Associations

**Status:** Draft  
**Date:** 2026-05-08  
**Scope:** Making cast analysis recommendations properly connected to the existing characters that motivated them. When the analysis says a new character is needed because of @CharacterA, clicking Create should pre-wire that association, pre-populate the pitch with @tags, and permanently store the relationship on the created character — just like any other association in the app.

---

## The Problem

Cast analysis currently outputs "What's Missing" as a single unstructured prose block with one generic "Create this character" button. When the user clicks it, the recommendation text is pasted into the pitch field as plain text. No formal link to the characters that motivated the recommendation. No @tags. No associations. The new character arrives in the world with no memory of why it was created or who it relates to.

This breaks the interconnectivity that makes the app work. If the analysis says "there's no one to witness @Marcus's reversal", the character created from that recommendation should arrive already associated with Marcus — not as a vague prose description the user has to manually re-connect.

---

## What Changes

### 1. The analysis prose uses @tags throughout

All four sections of the cast analysis — not just "What's Missing" — should use @CharacterName syntax whenever referring to an existing character by name. This is the same pattern used everywhere else in the app.

When rendered in the UI, @tags in the analysis text are displayed as tappable entity links, consistent with how they appear in character sheets, scene descriptions, and dialogue.

Example of current prose:
> *The lead character is positioned as the moral centre but has no one to hold them accountable.*

Should become:
> *@Marcus is positioned as the moral centre but has no one to hold them accountable.*

---

### 2. "What's Missing" becomes individual recommendation cards

Currently: one prose block, one Create button.

After: a list of individual recommendation cards, each one a discrete suggestion. The cast analysis prompt is updated to output "What's Missing" as a structured list of separate recommendations rather than continuous prose.

Each recommendation card shows:
- A brief concept label — what kind of character this is (e.g. "The Witness", "The Pragmatist")
- The explanation — 2–4 sentences describing the dramatic gap and why this character would fill it, using @tags for any existing characters referenced
- A "Motivated by" line listing the specific existing characters this recommendation is based on, rendered as @tags
- A **"Create this character →"** button

The number of recommendations is typically 2–3. The prompt should be instructed to surface distinct gaps, not variations on the same gap.

---

### 3. Create button passes structured data, not just text

Currently `onCreateCharacter(body)` passes a plain text string.

After: `onCreateCharacter({ pitch, motivatedBy })` where:

- `pitch` — the recommendation prose, with @tags intact
- `motivatedBy` — an array of existing character objects: `[{ id, name, kind: "character" }]` — the characters explicitly named as motivating this recommendation

The `motivatedBy` array is derived from the @tags present in the recommendation. The cast analysis prompt outputs character names; the component resolves those names to character IDs using the world's character list before passing them to the create flow.

---

### 4. Character creation pre-populates pitch and associations

When `CreateCharacterScreen` receives a `motivatedBy` array alongside the pitch:

**The pitch field** is pre-populated with the recommendation text including the @tags, exactly as they appear in the analysis card. The user can edit freely before generating.

**The associations panel** is pre-populated with one association entry per `motivatedBy` character, added before the user has even generated the character. Each pre-wired association has:
- `kind: "character"`
- `id`: the existing character's ID
- `note`: `"Motivated creation via cast analysis"`
- `relation`: the appropriate relation from the app's `RELATION_CATEGORIES` — most likely the "inspired by" or "narrative foil" direction, depending on what makes sense contextually. A sensible default is used; the user can edit after creation.

These pre-wired associations are visible in the associations panel immediately — the user sees them before generating and can remove or edit them if needed.

---

### 5. Generated character inherits the associations permanently

When the character is generated and saved, the pre-wired associations are saved with it as part of the character data, exactly as if the user had added them manually via the AssociationsPanel. The association data model is unchanged: `{ kind, id, note, relation }`.

The created character's sheet shows these associations on the Associations tab from the moment it's first viewed. There is no special "created from analysis" UI treatment — it's just a normal association, because that's what it is.

---

## Prompt Changes

### `buildCastAnalysisPrompt.js`

**All sections:** The LLM is instructed to use @CharacterName syntax whenever referencing an existing character by name. The exact names from the world's character list are passed to the prompt so the LLM can match them precisely.

**"What's Missing" section specifically:** The LLM is instructed to output this section as a list of discrete recommendations, not continuous prose. Each recommendation has:
- A short concept label (the "role" this character would fill dramatically)
- An explanation using @tags for any existing characters referenced
- A "Motivated by:" line explicitly listing the @CharacterName references that make this character necessary

Example output format:

```
**What's Missing**

The Witness
There's no one positioned to observe @Marcus's reversal from the outside and carry its meaning forward. @Sera is too close — she can't see it clearly. What's missing is someone who has no stake in @Marcus being right, so when he breaks, the audience has a witness who has no reason to lie about what they saw.
Motivated by: @Marcus, @Sera

The Institutional Voice
@Kael operates entirely outside the power structure, which means the world's official logic has no face. Someone who genuinely believes in the system — and is genuinely good — would show what the system costs its most loyal members.
Motivated by: @Kael
```

### `buildLoreInterviewPrompt.js`

No changes needed — lore interviews don't produce character recommendations.

---

## Parsing Changes

The "What's Missing" section parser needs to extract individual recommendation items from the structured output. Each item is identified by its concept label, body text, and "Motivated by:" line.

The "Motivated by:" line is parsed to extract character names. Those names are resolved against `world.characters` by name match (case-insensitive) to produce the `{ id, name, kind }` objects passed to the create flow.

Name resolution should be tolerant: if a name doesn't match exactly, it falls back to a partial match. If no match is found, that reference is omitted from the `motivatedBy` array silently — the pitch text keeps the @tag but no association is pre-wired for it.

---

## Rendering @tags in Analysis Text

The analysis text (all four sections) should render @tags as tappable entity links using the same component or pattern used elsewhere in the app for inline @mentions. Tapping a tag navigates to that character's sheet, or at minimum highlights the name — whichever is consistent with the existing implementation.

This applies to the rendered prose body of each section, including the recommendation cards in "What's Missing".

---

## States Summary

| State | What happens |
|---|---|
| Analysis generated | All 4 sections use @tags. "What's Missing" shows 2–3 individual recommendation cards. |
| User reads recommendation | Sees concept label, explanation with @tags, "Motivated by: @X @Y" line, Create button. |
| User clicks Create | Modal/panel closes. Pitch pre-filled with recommendation text + @tags. Associations panel pre-populated with motivating characters. |
| User edits pitch | Free to change anything, including @tags. Pre-wired associations remain unless manually removed. |
| Character generated & saved | Associations saved permanently. Character sheet shows them on the Associations tab like any other association. |

---

## What Does Not Change

- The four-section structure of the analysis output
- The overall CastAnalysis overlay UI (header, regenerate button, close button)
- The AssociationsPanel component and data model — no new fields, no schema changes
- The character creation flow — only the pre-population changes, not the generation logic itself
- How associations work on any other entity type
