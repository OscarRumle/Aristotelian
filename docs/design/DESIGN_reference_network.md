# Reference Network Feature — Design Document

**Status:** Design spec (Phase 1 implementation plan outlined)  
**Last updated:** 2026-04-26

---

## 1. Vision & Overview

### What this system does

The Reference Network transforms Aristotelian from isolated entity pages into a **living, interconnected world**. It allows users to reference any entity (character, object, location, faction, lore document) within prose fields, creating a web of relationships that emerge from the narrative itself — not just from explicit structural links.

### Why it matters

- **Natural world-building:** Users write about their world and automatically create a graph of what references what. As they generate scene dialogue, the LLM naturally mentions existing characters and objects, building the network *as writing happens*.
- **Discovery:** Hover previews and backlinks reveal unexpected connections. A user discovers that three factions were all mentioned in a character's backstory — a connection the user hadn't explicitly registered.
- **Two kinds of association:** The `associations` array captures *intentional structural links* ("this object belongs to this character"). Reference tags capture *textual mentions* ("this character mentioned this object in dialogue"). Both matter; both persist.
- **Lightweight mention workflow:** No modal friction. Click an unresolved mention → confirm entity name and type → routed to creation page with full context already loaded → LLM generates the entity. Back to reading.

### The core interaction pattern

1. **LLM generates prose** containing `[[Entity Name|type]]` markers
2. **Client renders** resolved mentions as clickable links, unresolved as "potential entity" indicators
3. **User clicks unresolved** → "Create this?" prompt → routes to entity creation with source text pre-loaded
4. **LLM generates entity** with full context from the source mention
5. **Mention is now resolved** and rendered as a link

---

## 2. The `[[Entity Name]]` Syntax

### Format

Double brackets with optional type hint:

```
[[The Enchanted Apple]]              — no type hint
[[The Enchanted Apple|object]]       — with type hint
[[Theron|character]]                 — character mention
[[The Shadow Court|faction]]         — faction mention
```

### Type hints (strongly recommended for LLM)

The LLM should **always** include the type hint. It disambiguates when resolving and helps the client quickly identify what kind of entity is being referenced.

Valid type values: `"character"`, `"object"`, `"location"`, `"faction"`, `"lore"`

When the resolver encounters `[[The Enchanted Apple|object]]`, it searches the world's `objects` array for a name match. If no type hint is provided, the resolver tries all entity types in priority order.

### Storage

The `[[...]]` markup is **stored raw** in text fields — `description`, `history`, `appearance`, `background`, `personality`, `hamartia`, `dialogue` lines, lore document `content`, etc.

No separate `tags` or `mentions` field. The markup lives inline in the prose.

### Escaping and edge cases

- **Double brackets in content:** If a user needs literal `[[` in text, not a reference, they write `\[\[`. The parser recognizes the escape and renders it as plain text `[[`.
- **Nested brackets:** Not allowed. `[[Outer [[Inner]]]]` is invalid. The parser matches the first closing `]]` and treats everything after as separate text.
- **Whitespace:** Allowed within the brackets. `[[ The Enchanted Apple | object ]]` is valid; parser strips whitespace around pipes and names.
- **Case sensitivity:** Entity names are matched case-*insensitive* but the canonical case is preserved from the entity's stored name.

---

## 3. LLM Instruction Changes

### Core instruction addition

All prompt builders (character, object, faction, location, dialogue, lore document, scene) should receive this addition:

```
REFERENCE SYNTAX:
When you mention an existing entity (character, object, location, faction, lore document) 
in any prose field, wrap it in double brackets with the entity type:
  [[Entity Name|character]]
  [[Entity Name|object]]
  [[Entity Name|location]]
  [[Entity Name|faction]]
  [[Entity Name|lore]]

Include this syntax EVERY TIME you mention an existing entity. Do not use it for invented 
or hypothetical entities — only for references to named entities in the world.

Examples:
  "She carried the [[Enchanted Apple|object]] across [[The Shattered Mountains|location]] 
   to deliver it to [[Lord Malachi|character]] of [[The Shadow Court|faction]]."

This syntax is invisible to the user. The client will render it as interactive links.
```

### Prompts to update

1. **`src/prompts/build.js`** (character generation)
   - Add instruction block before the schema
   - Include instruction in the narrative sections (appearance, background, personality, etc. don't mention entities yet, but hamartia/consistency might)

2. **`src/prompts/buildObjectPrompt.js`** (object generation)
   - Add to description, provenance, dramatic_weight fields

3. **`src/prompts/buildFactionPrompt.js`** (faction generation)
   - Add to description, history, dramatic_role, internal_tension fields

4. **`src/prompts/buildLocationPrompt.js`** (location generation)
   - Add to description, history, dramatic_role, signature_line fields

5. **`src/prompts/buildDialoguePrompt.js`** (dialogue generation)
   - Add to the dialogue line generation instruction
   - **Important:** When speakers are mentioned by a character in dialogue, they should be tagged as well

6. **`src/prompts/buildDocumentsPrompt.js`** (lore document generation)
   - Add to content field

7. **`src/prompts/buildLoreInterviewPrompt.js`** (interview transcript)
   - Add to the transcript lines

8. **`src/prompts/entityRegen.js`** (field regeneration)
   - Add to regen instructions so regenerated fields also include tags

9. **`src/prompts/fieldExpand.js`** (field expansion)
   - Add so expanded text includes tags

### Implementation note

The instruction does **not** change the JSON schema. The `[[...]]` markers appear *inside* string values in the JSON. The LLM returns valid JSON with marked-up text fields. No changes to `src/prompts/schema.js` needed.

---

## 4. Client-Side Tag Rendering — `<RichText>` Component

### Component signature (suggested — Claude Code decides exact props)

The component needs access to: the raw text string, the active world (for entity resolution), and the app's navigation/routing handler. How these are passed (props vs context) follows the existing pattern in the codebase.

```jsx
// Rough shape — Claude Code adapts to actual prop/context patterns in the codebase
function RichText({ text, world, onNavigate }) { ... }
```

### Parsing logic

1. Parse text for regex: `/\[\[([^\]]+)\]\]/g`
2. For each match, extract name and optional type:
   - `[[The Enchanted Apple|object]]` → name="The Enchanted Apple", type="object"
   - `[[Theron]]` → name="Theron", type=null (infer later)
3. Attempt to resolve the entity against the world's entity arrays
4. Render as either a **resolved tag** (interactive link) or **unresolved tag** (potential entity indicator)

### Resolved tag (entity found)

```jsx
<span className="rich-text-tag rich-text-tag--resolved">
  <button
    className="rich-text-tag-link"
    onClick={() => onNavigate('entityDetail', {
      entityType: entity.type,
      entityId: entity.id
    })}
    onMouseEnter={() => /* show hover preview */}
    onMouseLeave={() => /* hide hover preview */}
  >
    {entity.name}
  </button>
</span>
```

**Styling:**
- Text color: inherit from parent (usually dark/muted)
- Underline: thin dotted border-bottom, color depends on entity type (see "Visual differentiation" below)
- Cursor: pointer
- Hover state: slight color shift or background highlight

### Unresolved tag (entity not found)

```jsx
<span className="rich-text-tag rich-text-tag--unresolved">
  <button
    className="rich-text-tag-potential"
    onClick={() => /* open "Create this?" flow */}
  >
    {name}
  </button>
  <span className="rich-text-tag-type-hint">{type || '?'}</span>
</span>
```

**Styling:**
- Border: dashed 1px amber or `var(--warning-color)`
- Text color: `var(--muted)` or gray-400
- Background: light amber tint (e.g., `rgba(184, 125, 26, 0.08)`)
- Small right-aligned type badge: tiny pill with the type (or "?" if unknown)
- Cursor: pointer
- Hover state: border becomes solid, background tint slightly darker

### Visual differentiation by entity type

Color-code the underline and type badge by entity type for quick scanning:

| Entity type | Accent color | Use |
|---|---|---|
| Character | Warm brown (`#C87941`) | underline, type badge |
| Object | Amber (`#b87d1a`) | underline, type badge |
| Location | Steel blue (`#3a5f7a`) | underline, type badge |
| Faction | Sage green (`#4a6741`) | underline, type badge |
| Lore | Purple/Violet (`#7B6FAB`) | underline, type badge |

### Plain text fallback

If text contains escaped brackets `\[\[`, render them as literal `[[` (no tag).

---

## 5. Entity Resolver

### Algorithm

The resolver takes a name + optional type hint and finds the matching entity in the world. The matching priority is:

1. If a type hint is provided, search only that entity type's array
2. If no type hint, search in priority order: character → faction → location → object → lore
3. Within an array, match: exact case-insensitive first, then prefix match (useful for "Theron" matching "Theron of House Ashfall"), then substring match as fallback

The exact implementation is Claude Code's call — the logic above is the required behavior.

### Priority when multiple matches

If multiple entities have similar names (e.g., "The Enchanted Apple" and "Enchanted Apples of the Eastern Realm"):

1. Exact case-insensitive match
2. Longest prefix match (more specific name wins)
3. First substring match (arbitrary but consistent)

In practice, users should give entities distinct names to avoid this.

### Returned data

When an entity is resolved, return:

```js
{
  id: string,
  type: 'character' | 'object' | 'location' | 'faction' | 'lore',
  name: string,
  // For hover preview:
  summary: string,  // character: summary[0], object/faction/location: description first 1-2 sentences
}
```

---

## 6. Hover Preview Component

### Trigger and display

On `mouseEnter` of a resolved tag, show a floating preview card positioned near the tag. On `mouseLeave`, it disappears.

### Content

- **Type badge:** Small colored pill matching the entity's accent color
- **Name:** Entity's canonical name
- **Summary:** 1-2 sentences, entity-type-specific:
  - Character: `summary[0]` (first summary line)
  - Object: First sentence of `description`
  - Location: `signature_line` (the memorable one-liner)
  - Faction: First sentence of `description` + `internal_tension`
  - Lore: `summary` field

### Styling

- Position: floating card, absolute positioned
- Background: light / dark mode aware (`var(--bg-secondary)`)
- Border: 1px solid `var(--border-subtle)`
- Padding: 12px
- Border radius: 4px
- Max-width: 280px
- Font size: slightly smaller than body (14px)
- Z-index: above most content

### Keyboard navigation

On `onMouseLeave`, preview disappears. For accessibility, consider: if the user tabs to a tag button, show the preview until they tab away or press Escape.

---

## 7. Unresolved Entity — "Create This?" Flow

### Full UX sequence

#### 1. User clicks an unresolved tag

The click opens a confirmation popover near the tag.

#### 2. Confirmation popover appears

A small inline popover (not a modal) near the clicked tag:

```
┌─────────────────────────────────┐
│ Create "The Enchanted Apple"?   │
│                                 │
│ Type: object ▼                  │
│                                 │
│ [Cancel]  [Confirm →]           │
└─────────────────────────────────┘
```

- **Name field:** Pre-filled with extracted name, editable
- **Type dropdown:** Pre-selected from type hint, changeable
- **Buttons:** Cancel (closes popover) and Confirm

#### 3. User confirms

On confirm, the app routes to the relevant entity creation screen, passing along: the pre-filled entity name, the source text (the full prose field containing the mention), and which entity it was mentioned in (for context). Claude Code wires this into the existing routing/navigation patterns in the app.

#### 4. Routed to entity creation page

The relevant creation screen opens (CreateObjectScreen, CreateLocationScreen, etc.) with:

- **Name field:** Pre-filled with the entity name
- **Pitch:** Pre-populated with the source text (the full field containing the mention)
- **A note below the pitch:** "Referenced in: [source entity type] [source entity name]'s [field name]"

This gives the LLM full context: the entity is being created because it was mentioned in a specific piece of prose, and the LLM can read that prose to understand the context.

#### 5. LLM generates the entity

The prompt builder for this entity type should include the source context:

```
CONTEXT:
This entity was mentioned in the following prose:
"[sourceText]"

It was mentioned by: [Source entity name] ([source entity type])

Generate this entity with full knowledge of this context. Make it cohere with the mention.
```

The generated entity appears on the creation page with the rolling text animation (existing `GeneratingOverlay` pattern).

#### 6. User saves

After generation, user clicks Save (or Confirm/Regenerate). The entity is created and stored. The page may optionally navigate back to the entity that mentioned it, with the mention now resolved and rendered as a link.

---

## 8. The @ Mention System

### Two contexts: generation prompts vs. free-text editing

#### A. Generation prompt input (inside form fields like pitch textarea)

User types `@` → autocomplete dropdown appears showing all entities in the world (paginated if >20):

```
User types: "A character obsessed with the @..."

Dropdown appears:
┌──────────────────────────┐
│ Jump to entity:          │
│ ☐ Theron (character)     │
│ ☐ The Enchanted Apple... │
│ ☐ The Shadow Court (fac) │
│ ☐ Castle Ashfall (loc)   │
└──────────────────────────┘
```

Filtering: As user types more, dropdown filters by name (fuzzy or prefix match).

When user selects an entity:
- `@EntityName` is inserted at the cursor
- Dropdown closes
- Entity context is ready to be injected into the prompt

When the prompt is sent to the LLM, any @-mentioned entities are extracted from the pitch text, resolved against the world, and injected into the prompt as context blocks — so the LLM knows who/what those entities are before it generates output. Claude Code implements the extraction and injection logic following the existing prompt builder patterns in `src/prompts/`.

**What gets injected** (format: entity-type-specific summary):

- **Character:** name, role, consistency, hamartia, summary, quote
- **Object:** name, type, description, dramatic_weight, associations
- **Faction:** name, size, status, description, internal_tension
- **Location:** name, type, scale, description, signature_line
- **Lore:** title, summary, key excerpts

#### B. Free-text editing (in character detail, object detail, CharField, etc.)

In any editable prose field, user can type `@` to trigger the same autocomplete. When a user selects an entity from the dropdown:
- The text stored is `[[EntityName|type]]` (the reference syntax)
- It renders immediately as a tag via RichText

This way, users never manually type the bracket syntax; it's always autocomplete-driven.

---

## 9. Backlinks System

### Data model

No new stored field needed. Backlinks are **computed at render time** by scanning all prose fields in all other entities.

### "Referenced in" section

On each entity's detail page, at the bottom, add:

```
─────────────────────────────────────────
REFERENCED IN

[Collapsible] Referenced in 2 Characters, 1 Location

[Expanded view]
├─ Character
│  └─ Theron — in background field
│  └─ Selene — in personality field
└─ Location
   └─ Castle Ashfall — in history field
```

Each reference is clickable and navigates to the mentioning entity, auto-scrolling to the field that contains the mention.

### Component behavior

The `ReferencedIn` component:
- Computes backlinks at render time (not stored)
- If no backlinks exist, renders nothing
- If backlinks exist, shows a collapsible section grouped by entity type
- Each backlink is a clickable button that navigates to the mentioning entity and scrolls to the specific field

Claude Code implements the component following existing component patterns in the codebase.

### Backlink computation

Backlinks are computed at render time (not stored). The algorithm:

1. Collect all entities in the world across all entity types
2. For each entity (excluding the target itself), scan all prose fields for `[[...]]` tags
3. For each tag that resolves to the target entity, record: which entity mentioned it, which field, and the field's human-readable label

The prose fields to scan per entity type are:
- **Character:** appearance, background, personality, desires, fears, moralCore, hamartia, consistency, subtext, voicePattern, aristotelianNote
- **Object:** description, provenance, dramatic_weight, signature_line
- **Faction:** description, history, dramatic_role, internal_tension, motto
- **Location:** description, history, dramatic_role, signature_line
- **Lore:** content

Claude Code implements the actual utility functions — this list is the required scope, not the code.

---

## 10. Dialogue Tagging

### How it works

`DialogueWriter` renders script lines via `parseNdjson()`, which splits accumulated streaming text into `{ type: 'line', speaker, text }` objects.

Each line's `text` field is a prose string that may contain `[[...]]` references.

```jsx
function ScriptLine({ line, color, animating, onDone, onEdit }) {
  return (
    <div className="script-block">
      <span className="script-speaker" style={{ color }}>
        {line.speaker}
      </span>
      <p className="script-text" style={{ color }}>
        {animating ? (
          <Typewriter text={line.text} onDone={onDone} speed={18} />
        ) : onEdit ? (
          <EditableText value={line.text} onSave={onEdit} multiline />
        ) : (
          // NEW: Render via RichText instead of plain text
          <RichText text={line.text} world={world} onNavigate={onNavigate} />
        )}
      </p>
    </div>
  );
}
```

### Behavior

- **Existing characters mentioned in dialogue:** Resolved as links (click → navigate to character detail)
- **New characters mentioned in dialogue:** Unresolved tags (click → "Create this?" → routed to character creation with full dialogue context)
- **Other entity types (objects, locations, factions):** Same rules apply

### Example

Dialogue line generated by LLM:

```
"I last saw [[Selene|character]] at [[Castle Ashfall|location]], where she'd hidden 
the [[Crimson Seal|object]] for safekeeping. [[The Shadow Court|faction]] never 
even looked there."
```

Renders as:
- "I last saw " + [Selene] link + " at " + [Castle Ashfall] link + ", where she'd hidden the " + [Crimson Seal] link + " for safekeeping. " + [The Shadow Court] link + " never even looked there."

All mentions are interactive; unresolved ones display with the potential entity style.

---

## 11. Data Model

### No new top-level fields

The existing entity schemas need no changes. Markup lives **inline in prose fields**.

### Existing fields that will contain markup

Character:
- `appearance`, `background`, `personality`, `desires`, `fears`, `moralCore`, `hamartia`, `consistency`, `subtext`, `voicePattern`, `aristotelianNote`

Object:
- `description`, `provenance`, `dramatic_weight`, `signature_line`

Faction:
- `description`, `history`, `dramatic_role`, `internal_tension`, `motto`

Location:
- `description`, `history`, `dramatic_role`, `signature_line`

Dialogue lines:
- `text` field in dialogue line objects

Lore documents:
- `content` field

### Storage version

**No bump to `STORAGE_VERSION` needed.** The reference syntax is backward compatible. Old prose without markup renders as plain text. New prose with markup renders with tags. No migration required.

### Forging a reference into the associations array

When a user manually tags an entity in text via `@mention` autocomplete or clicks a resolved tag and "Add to associations", should the `associations` array be updated?

**Decision:** YES. Text mentions and structural associations serve different purposes, but they're not exclusive. 

**Rule:** If a mention is manually created by the user (via @ autocomplete in edit mode) or if the user explicitly adds a tag to the `associations` array, write the association to the stored `associations` field. This makes the relationship visible in the association UI and survives even if the text is edited later.

Mentions generated by the LLM do NOT automatically add to `associations` — those are "soft" derived mentions, not explicit structural links.

---

## 12. Phased Implementation

### Phase 1: MVP — Essential tagged reference flow (Weeks 1-3)

**Goal:** LLM generates tagged mentions; client renders and resolves them.

**Included:**
- `[[Entity Name|type]]` syntax in all prose generation
- RichText component with resolved/unresolved tag rendering
- Entity resolver with case-insensitive matching
- Hover preview component (simple — name + summary only)
- Unresolved tag click → "Create this?" prompt → routed to creation page with source context
- All prompt builders updated to include reference syntax instruction
- Backlinks section on entity detail pages (computed, not stored)

**Not included:**
- @ mention autocomplete in generation prompts (Phase 2)
- @ mention autocomplete in free-text editing (Phase 2)
- Advanced hover preview features (drag to canvas, quick-add to associations, etc.)
- Graph visualization
- Full-text search of entity networks

**Acceptance criteria:**
- LLM consistently outputs `[[Name|type]]` in all entity prose
- RichText correctly parses and renders both resolved and unresolved tags
- Clicking unresolved tag opens "Create this?" flow
- Backlinks section appears and correctly lists references
- Creation flow pre-populates name and source text
- All new tags are case-insensitive resolvable

### Phase 2: Mention autocomplete & manual tagging (Weeks 4-5)

**Included:**
- @ autocomplete in pitch/description fields during generation
- @ autocomplete in free-text editable fields
- Context injection for @-mentioned entities into LLM prompts
- Associations array updated when user manually creates tags
- Better preview: include related entities, association notes

**Not included:**
- Graph visualization
- Advanced filtering (backlinks filtered by mention type, etc.)

### Phase 3: Advanced features (Weeks 6+)

**Included:**
- Interactive graph visualization (force-directed layout of entities + edges)
- Search/filter within graph
- Batch tagging (user selects text, @-mentions multiple entities at once)
- Association type hints (e.g., "owns", "betrayed", "loves") surfaced during @ autocomplete
- Backlink statistics (most-referenced entities, etc.)
- Export graph as image or data

---

## 13. Component Changes & File Locations

### New components to create

1. **`src/components/RichText.jsx`**
   - Parses `[[...]]` syntax
   - Renders resolved/unresolved tags
   - Handles hover previews
   - Emits navigation events

2. **`src/components/EntityHoverPreview.jsx`**
   - Floating card displayed on hover
   - Shows type badge, name, summary

3. **`src/components/ReferencedIn.jsx`**
   - Collapsible section for entity detail pages
   - Lists backlinks grouped by entity type
   - Navigates to referencing entities

4. **`src/components/CreateEntityPrompt.jsx`** (or integrate into existing ConfirmModal)
   - Small inline popover for "Create this?" confirmation
   - Name field (editable), type dropdown

5. **`src/components/MentionAutocomplete.jsx`** (Phase 2)
   - Dropdown that appears on @ in text inputs
   - Filters entities by name
   - Handles selection

### Modified components

1. **`src/components/CharField.jsx`**
   - Render text via RichText instead of plain `{value || "—"}`
   - Import RichText and pass world, onNavigate

2. **`src/components/CharacterSheet.jsx`**
   - Add ReferencedIn section at bottom
   - Import and render ReferencedIn component

3. **`src/components/ObjectDetail.jsx`**
   - Add ReferencedIn section at bottom
   - Render description/provenance/etc. via RichText

4. **`src/components/FactionDetail.jsx`**
   - Add ReferencedIn section at bottom
   - Render via RichText

5. **`src/components/LocationDetail.jsx`**
   - Add ReferencedIn section at bottom
   - Render via RichText

6. **`src/components/DocumentViewer.jsx`**
   - Render lore document content via RichText

7. **`src/components/DialogueWriter.jsx` → `ScriptLine` sub-component**
   - Render line.text via RichText instead of plain text

8. **All prompt builders** (`src/prompts/build.js`, `buildObjectPrompt.js`, etc.)
   - Add reference syntax instruction block
   - No schema changes

### New utilities to create

1. **`src/utils/referenceParser.js`**
   - `parseReferences(text)` — extract `[[Name|type]]` tokens
   - `escapeReferences(text)` — handle `\[\[` escaping
   - `resolveEntity(world, name, typeHint)` — lookup logic

2. **`src/utils/backlinks.js`**
   - `computeBacklinks(world, entity)` — scan all entities for mentions
   - `getProseFields(entityType)` — list which fields can contain references

3. **`src/utils/entityContext.js`**
   - `formatEntityContext(entity)` — convert entity to LLM-readable context block (Phase 2)
   - `extractMentions(text)` — find @EntityName patterns (Phase 2)

---

## 14. Open Questions & Future Decisions

1. **Multiple entities with same name:** How do we handle "The Shadow Court" (faction) vs "The Shadow Court" (location)? Current resolver uses priority order, but should we show a disambiguation prompt?

2. **Partial name matching:** How fuzzy should matching be? Currently: exact → prefix → substring. Should we use Levenshtein distance for typo tolerance?

3. **Association note inheritance:** When a user clicks "Add to associations" on a reference tag, should the note field be pre-populated with context from the mention?

4. **Dialogue speaker tagging:** Should character names in the `speaker` field of dialogue lines also be tagged and resolvable? Currently only the `text` field is tagged.

5. **Recursive generation:** If user creates entity A which mentions entity B (unresolved), then creates entity B which mentions entity C (unresolved), etc., does the LLM propagate context from A → B → C? Or just one level?

6. **Performance:** Backlinks computation is O(n * m) where n = entities and m = prose fields. Should we cache results? Should we lazy-load backlinks (only compute on demand)?

7. **Bulk tagging:** Should users be able to tag multiple mentions at once (select all mentions of "Theron" in a field and batch-update)?

8. **Auto-tag on LLM generation:** When the LLM generates a new entity and references an existing one, should we automatically infer that as a soft association? Should the UI show "was mentioned in" as a reason for the association?

---

## 15. Success Metrics

Phase 1 is considered successful if:

- [ ] LLM outputs `[[Name|type]]` in >90% of entity references
- [ ] RichText component correctly resolves >95% of tags (false negatives < 5%)
- [ ] Users can create unresolved entities with < 2 clicks ("Create this?" → confirm)
- [ ] Backlinks section is visible and accurate on all entity detail pages
- [ ] No regressions in existing prose rendering or entity generation
- [ ] All prose fields (character, object, faction, location, dialogue, lore) support tagging

---

## 16. Examples

### Example 1: Character backstory with references

User creates character "Theron". LLM generates:

```
"Theron was born in [[Castle Ashfall|location]], seat of [[House Ashfall|faction]]. 
His father, [[Lord Malachi|character]], was executed by [[The Shadow Court|faction]] 
in 1997 for refusing to surrender the [[Crimson Seal|object]]. The seal is said to 
grant dominion over [[The Shattered Mountains|location]]."
```

Client renders:
- "Theron was born in " + [Castle Ashfall] link (blue, resolved)
- ", seat of " + [House Ashfall] link (green, resolved)
- ". His father, " + [Lord Malachi] link (brown, resolved)
- ", was executed by " + [The Shadow Court] link (green, resolved)
- " in 1997 for refusing to surrender the " + [Crimson Seal] link (amber, resolved)
- ". The seal is said to grant dominion over " + [The Shattered Mountains] link (blue, resolved)
- "."

(Assuming all these entities exist; if any don't, they render as unresolved with dashed borders and type badges.)

### Example 2: Dialogue with mentions

Scene: Theron and Selene meet. LLM generates:

```
Theron: I never thought I'd see you again after [[Castle Ashfall|location]].
Selene: [[The Shadow Court|faction]] has eyes everywhere. We weren't safe there.
```

Both mentions are clickable. User hovers on [Castle Ashfall] and sees:

```
LOCATION
Castle Ashfall
Seat of House Ashfall, the seat of [[House Ashfall|faction]]. 
Most strategic fortress in the north. Abandoned after the civil war.
```

### Example 3: Creating unresolved entity from dialogue

LLM generates dialogue mentioning `[[Vex|character]]` but Vex doesn't exist. User clicks on the unresolved tag. Popover appears:

```
Create "Vex"?
Type: character ▼
[Cancel] [Confirm →]
```

User confirms. Routed to CreateCharacterScreen with:

```
Pitch (pre-filled):
"I never thought I'd see you again after Castle Ashfall."
"The Shadow Court has eyes everywhere. We weren't safe there."

Note below: "Referenced in: Scene "Theron & Selene"

[Generate] [Save draft]
```

LLM generates Vex with full dialogue context, understanding that Vex is a character being referenced in a scene about Theron and Selene, with mention of The Shadow Court and Castle Ashfall.

### Example 4: Backlinks

User views Theron's character sheet. At bottom:

```
─────────────────────────────────────
REFERENCED IN

[Expanded] Referenced in 3 places:

Scenes
  └─ "Theron & Selene" — in scene summary

Objects
  └─ Crimson Seal — in dramatic_weight field

Documents
  └─ "The Curse of Castle Ashfall" — in content
```

User clicks "Crimson Seal" link and navigates to the Object detail page, scrolled to the dramatic_weight field which mentions Theron.

---

## 17. Success Narrative

When fully implemented (Phase 1), users will experience:

1. **Generation with mentions:** LLM generates character and naturally mentions 3-4 other existing entities in their background. Each mention is tagged.

2. **Immediate resolution:** User sees colored underlines on mentioned names, knows they can click them. Hover to get quick previews.

3. **Discovering connections:** User views a location's backlinks and realizes it was mentioned by 5 different characters — a connection they hadn't explicitly registered.

4. **Creating from narrative:** User reads dialogue where a character mentions a mysterious object that doesn't exist yet. Click the unresolved tag, confirm creation, and the LLM generates the object with full context about how it's supposed to be mysterious and valuable.

5. **Living world:** The world feels interconnected because the entities now *reference each other in their prose*, not just in a separate relationship matrix. The narrative *is* the network.

---

**End of document**
