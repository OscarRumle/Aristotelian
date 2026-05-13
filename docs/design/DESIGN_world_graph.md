# 3D World Graph — Design Document

> **⚠ DEPRECATED — superseded by [relationship_web.md](relationship_web.md).**
> This document describes an earlier, broader 3D graph spanning all entity types
> using the social/historical/physical/mystical relation taxonomy. It has been
> replaced by the 2D character-only **Relationship Web**, which uses
> hamartia-driven Aristotelian connection types (Conflict / Dependency / Loyalty
> / Mirror / Debt / Catalyst). Kept here for historical context only — do not
> implement from this document.

## 1. Vision & Overview

The World Graph is a visual map of relationships within a world. It transforms world-building from a linear list of entities (characters, factions, locations, objects, lore) into a living, interconnected network.

### Why this matters

Aristotelian drama is fundamentally about relationships. A character's hamartia doesn't exist in a vacuum — it emerges in collision with other characters, their choices, and the world's structure. The same is true for objects (who made them, who wants them, who cursed them), locations (what happens there, what lives there, who controls it), and factions (how they compete, where their interests collide).

The current app models these entities as separate pages. A user can create a character, a location, a faction — but the **relationships** between them are mostly invisible. The user has to keep them in their head, or scribble them on paper outside the app.

The World Graph makes relationships **first-class citizens**. It shows:
- **Explicitly forged connections** — relationships the user deliberately designed (romantic rivals, sworn enemies, master and student)
- **Organic text mentions** — references buried in character backgrounds, lore documents, dialogue ("she was trained by the monks of the Eastern Temple" automatically surfaces a connection between character and location)
- **Connection types with meaning** — Social (family, alliance, rivalry), Historical (trained by, defeated, witnessed), Physical (contains, owns, destroyed), Mystical (cursed, blessed, bound to)

This is not just a visualization. The graph is the interface for forging new relationships — a place to say "I want there to be a connection between these two things, and I want to explore what that means." After forging, the user is invited to generate content (scenes, lore, dialogue) that explores that relationship.

The World Graph is the bridge between isolated entities and dramatic structure.

---

## 2. Access & Global Toggle

### Where it lives

The graph toggle is a dedicated button in the top bar, in `GlobalNav.jsx`. It sits alongside the theme toggle and user menu.

**Button label:** A simple icon (node/graph symbol) with tooltip "World Graph (G)" on hover.

**Keyboard shortcut:** `G` (global, no modifier required). On Mac, `Cmd+G` also works.

### Behavior when toggled

- **Graph opens:** Slides in from the left side, covering approximately 65% of the left viewport width. The current entity page (character sheet, object detail, etc.) compresses to the right side, becoming an "inspector" panel (~35% width).
- **Graph closes:** Slides out to the left. Inspector panel expands back to full width (normal app behavior).
- **Animation:** 300ms ease-out slide. The graph canvas and inspector appear simultaneously (not sequentially).

### Toggle state persistence

The toggle state persists across navigation. If you open the graph while viewing a Character, then navigate to a Faction in the WorldDetail view, the graph stays open — the inspector just changes to show the Faction instead.

### Disabled / hidden states

- **No active world:** Toggle is **hidden** from GlobalNav entirely. It only appears once a user enters a World.
- **Viewport too narrow:** Below ~900px width, the graph **hides automatically** (mobile not supported in v1). The toggle remains visible but clicking it shows a toast: "Graph works best on desktop. Minimum width: 900px."

---

## 3. Split-Screen Layout

### Dimensions

```
┌─────────────────────────────────────────────────────┐
│                    GlobalNav (fixed)                │
├──────────────────────┬────────────────────────────┤
│                      │                            │
│   Graph Canvas       │    Inspector Panel         │
│   (65% width)        │    (35% width)             │
│                      │                            │
│                      │  ┌──────────────────────┐  │
│                      │  │ Entity Page Content  │  │
│                      │  │ (scrollable)         │  │
│                      │  │                      │  │
│                      │  │ Character sheet /    │  │
│                      │  │ Object detail /      │  │
│                      │  │ Location detail /    │  │
│                      │  │ World overview       │  │
│                      │  │                      │  │
│                      │  └──────────────────────┘  │
│                      │                            │
└──────────────────────┴────────────────────────────┘
```

### Canvas panel (left, 65%)

- `.graph-canvas-container` — flex container, background color `var(--bg)` (`#F4EDE4` warm cream, matching the app's light mode body background)
- Canvas element fills the container
- Contains a filter sidebar (see **section 7**)
- No overflow; canvas handles all interaction

### Inspector panel (right, 35%)

- `.graph-inspector` — scrollable flex column
- Shows the entity page for the currently selected node (or world overview if no node selected)
- The inspector **is** the real entity page, not a read-only copy
  - User can edit character name, regenerate fields, make changes
  - All changes are saved to the world state immediately
  - No duplicate logic from the main entity page
- **Back button** in inspector header returns to world overview without deselecting the graph node
  - This allows the user to look at a character detail, then click back to see the world graph again with that character still visible/highlighted
- Inspector has its own scroll context (separate from the canvas)

### Resize handle

Between the two panels is a draggable resize handle (`.graph-resize-handle`):
- Appears as a 6px vertical line, slightly darker than background
- On hover: cursor changes to `col-resize`, background brightens
- Drag to adjust the split (min 50% graph / 50% inspector, max 75% graph / 25% inspector)
- Position is saved to `window.storage` under a new key: `graphSplit` (stores width percentage)
- On load: restores saved split percentage, or defaults to 65/35

---

## 4. Node System

### Node types and visual encoding

Each entity type has a distinct color, applied as a radial gradient on the sphere:

| Type | Color | Hex | Role |
|---|---|---|---|
| Character | Amber | `#B8956A` | Protagonist, people, agency |
| Faction | Sage | `#7B9E80` | Groups, allegiances, power |
| Location | Muted Grey | `#9A8C85` | Places, settings, significance |
| Object | Dust | `#C4806A` | Artifacts, talismans, significance |
| Lore | Slate | `#6B7FA8` | Documents, history, knowledge |

Colors are defined in `src/constants.js` as a new constant `GRAPH_NODE_COLORS`:
```javascript
export const GRAPH_NODE_COLORS = {
  character: "#B8956A",
  faction: "#7B9E80",
  location: "#9A8C85",
  object: "#C4806A",
  lore: "#6B7FA8",
};
```

### Node size

Node radius is proportional to connection count (both strong and weak edges):
- **Min radius:** 8px (orphan node, no connections)
- **Max radius:** 28px (heavily connected hub)
- Formula: `radius = 8 + (connectionCount / maxConnections) * 20`
  - `maxConnections` = the highest connection count in the graph at any moment
  - Nodes dynamically rescale as connections are added/removed

### Visual style — light mode

The graph renders on a **light mode canvas** matching the app's default aesthetic:

- Canvas background: `var(--bg)` (`#F4EDE4` warm cream)
- Node colors use the palette defined in `GRAPH_NODE_COLORS` — these are warm, muted tones that read clearly on the light background
- Text labels: `var(--dark)` (`#2B2018`)
- Rings and outlines: `var(--dark)` or `var(--amber)` (not white — white disappears on a cream background)
- The graph should feel like part of the same warm, parchment-toned aesthetic as the rest of the app, **not** a dark-mode sci-fi network graph

The prototype (`world-graph-prototype.html`) was built with a dark background as a standalone proof-of-concept. The real implementation uses light mode. Claude Code should derive the exact glow, shadow, and opacity values that look right against the light canvas.

### Node states and visuals

#### Default
- Colored sphere with subtle radial gradient (lighter center, darker rim)
- Opacity: 1.0
- Outline: none
- Shadow: soft drop shadow (~2px blur, `rgba(43,32,24,0.12)`) — using dark base, not black

#### Hovered
- Scale: 1.15x current size
- Glow halo: color-matched to node type, softened for light mode (lower blur and opacity than dark mode equivalent)
- Opacity: 1.0
- Cursor: pointer
- Tooltip: entity name appears 8px above node, dark text on light/surface pill

#### Inspected (left-click selected)
- Outline: 3px `var(--dark)` ring (or amber `var(--amber)` — Claude Code decides which reads best)
- Scale: 1.0 (no scale change)
- Inspector panel updates to show this entity's detail page
- Outline persists until another node is inspected or graph is cleared

#### Ctrl-highlighted (Ctrl+LMB)
- Self: distinct glow, node-color-matched
- Connected nodes: full opacity
- All other nodes: dimmed to 0.3 opacity
- Effect persists until Ctrl+LMB on the same node again (toggle off) or Escape

#### Shift-selected (for connection forging)
- Outline: 3px `var(--amber)` ring
- Scale: pulsing animation (1.0 → 1.15 → 1.0 over 800ms loop)
- Glow halo: amber-tinted, softened for light mode
- Selected for forging — waiting for second node selection

#### Focus mode (two nodes shift-selected)
- Self (both selected nodes): amber ring + pulsing scale
- All other nodes: dimmed to 0.15 opacity
- All edges except those touching the two selected nodes: dimmed to 0.1 opacity
- Creates a tight focus on just the two nodes and the connection being forged

### Node placement algorithm

See section 6 (Force-Directed Layout) for details on how nodes are positioned. Node state changes (hover, selection) do **not** move nodes — they only change visual properties.

---

## 5. Edge System

### Strong edges (explicitly forged)

**Appearance:**
- Solid line, 2px width
- Color-coded by connection category:
  - Social: amber (`#B8956A`)
  - Historical: dust (`#C4806A`)
  - Physical: sage (`#7B9E80`)
  - Mystical: slate (`#6B7FA8`)
- Opacity: 0.35 default, 0.65 on hover/selection
- Endpoints slightly rounded (2px stroke-linecap round)

**Interaction:**
- On hover: opacity increases to 0.65, glow halo appears around the line (6px blur, line color, 0.5 opacity)
- RMB on hovering edge: opens connection forge dialog (only if two nodes are shift-selected)
- Floating label on hover: edge subtype appears in a small dark box (e.g., "Rival", "Contains", "Cursed by")
  - Label is positioned at the midpoint of the line, offset 8px perpendicular to the line direction
  - Font size 10px, padding 4px 6px, rounded corners, background `rgba(0,0,0,0.8)`, text white

### Weak edges (text mentions / reference network)

**Appearance:**
- Dashed line, 1.5px width, 4px dash / 3px gap
- Color-coded by connection type where known, grey otherwise
  - If the mention includes a type tag (see Reference Network section), use appropriate category color
  - If type is unknown, use neutral grey (`#999999`)
- Opacity: 0.12 default, 0.35 on hover/selection
- Slightly lighter than strong edges (visual hierarchy)

**Interaction:**
- On hover: opacity increases to 0.35, tooltip appears with source
  - Tooltip text: "Mentioned in [Entity Name]'s [field name]"
    - Example: "Mentioned in Lady Seris's background"
    - Example: "Mentioned in The Fall of House Dravec's lore"
  - Tooltip position: centered on line, offset 8px perpendicular

**Toggle-able:** User can toggle weak edges on/off via the filter panel (see section 7).

### Edge labels

Edge type labels are drawn at the midpoint of each edge:
- **Font:** 10px, weight 600, sans-serif
- **Background:** Dark box with white text (as described above)
- **Appear on:** Hover of the edge line
- **Disappear on:** Mouse leave
- **Examples:**
  - "Rival" (Social subtype)
  - "Master" (Historical subtype)
  - "Contains" (Physical subtype)
  - "Bound to" (Mystical subtype)

---

## 6. Force-Directed Layout

### Algorithm (vanilla JS, no external physics library)

The layout engine runs a simple force-directed simulation. The exact constants below are **starting points** — Claude Code should tune them until the layout looks natural and settles cleanly. What matters is the behavior, not the specific numbers.

1. **Repulsion force**: Every node repels every other node (inverse square law)
   - Prevents node overlap
   - Strength tunable — start around k=50

2. **Attraction force** (along edges): Connected nodes attract
   - Pulls connected nodes together without collapsing them on top of each other
   - Tunable rest length (the ideal distance between connected nodes)

3. **Centering force**: Slight pull toward the graph center
   - Prevents nodes from drifting to infinity

4. **Boundary constraint**: Nodes repel from the outer sphere boundary
   - Keeps the globe shape intact even as nodes cluster internally

5. **Euler integration** with velocity damping — standard approach for this kind of simulation.

6. **Iteration and settling:**
   - Run for enough iterations on initial open that it feels instant
   - Then continue at 60fps until stable
   - After settling completes, simulation **freezes** (no more automatic updates)
   - User can manually re-run via a "Re-settle" button in the filter panel

### View Modes

The user can switch between four layout modes. Transition between modes is animated: node positions lerp over 600ms.

#### 1. Cluster (default)
- Uses force-directed simulation (described above)
- Nodes cluster by connection density
- Heavily connected nodes move toward center, orphans toward periphery
- Most organic and spatially meaningful

#### 2. Sphere
- Fibonacci sphere distribution (uniform spacing)
- Node positions are computed deterministically based on index
- Good for overview: all nodes visible, equally spaced
- No clustering — pure even distribution

#### 3. Type
- Nodes arranged in a 2D ring by entity type
- Character nodes: top arc
- Faction nodes: right arc
- Location nodes: bottom arc
- Object nodes: left arc
- Lore nodes: center or mixed
- Within each arc, nodes are sorted by connection count (hubs first)
- Good for auditing: "Do I have enough Factions?"

#### 4. Constellation
- Nodes sized by connection count (radius scale 1.0 → 3.0)
- Positioned by influence: central hubs near the center, peripheral/orphan nodes toward the outside
- Like a power map or influence visualization
- Shows immediately which entities are the "weight" in your world

**Mode switching:** Animated transition between layouts, user can switch via numbered keys (1/2/3/4) or a radio button set in the filter panel.

---

## 7. Interaction Model

### Mouse

#### Drag
- **Rotate the graph:** Click and drag on empty canvas space
- **Controls:** Standard 3D trackball rotation
  - Horizontal drag → rotate around Y-axis (pitch)
  - Vertical drag → rotate around X-axis (yaw)
- **Implementation:** Store rotation as a 3×3 matrix or Euler angles, apply to canvas transformation before drawing
- **No gimbal lock:** Use quaternion or matrix rotation (confirmed in prototype)

#### Scroll
- **Zoom in/out:** Mouse wheel / trackpad two-finger scroll
- **Bounds:** Min zoom 0.5x, max zoom 3.0x
- **Center point:** Zoom toward mouse cursor (standard behavior)

#### Left-click (LMB)

**On node:**
- Inspect node → inspector navigates to that entity's detail page
- Node gets white outline ring
- Previous inspected node (if any) loses outline

**On empty space:**
- Clear inspection (inspector shows world overview)
- No node outline

#### Ctrl + Left-click (Ctrl+LMB)

**On node:**
- **First Ctrl+LMB:** Highlight this node + all connected nodes, dim rest
- **Second Ctrl+LMB on same node:** Clear highlight (toggle off)
- **Ctrl+LMB on different node:** Switch highlight to new node

#### Shift + Left-click (Shift+LMB)

**On node:**
- **First Shift+LMB:** Select node for forging (amber ring, pulsing)
  - HUD appears near node: "Shift+click another node to connect"
- **Second Shift+LMB:** Select second node for forging
  - Focus mode activates: both nodes bright, dashed pending line between them, everything else dim
  - Inspector shows forge panel (step 1 of connection forging)

**Escape to cancel:** If one node is shift-selected, pressing Escape clears it and returns to normal mode.

#### Right-click (RMB)

**On a pending connection line** (when two nodes are shift-selected):
- Opens the connection forge dialog (forging step 1)
- If RMB clicked on empty space or on a node, nothing happens (no context menu)

### Keyboard

#### G
- Toggle graph open/closed

#### Escape
- Clear all selections (inspected node, Shift-selected nodes, Ctrl highlights)
- Close any open dialogs (forge dialog, filter panel, etc.)
- Return to default view

#### F
- Fit: Zoom and pan to show all nodes in view
- Smooth animation over 600ms
- Useful after zooming far in; users may click F to get overview again

#### 1 / 2 / 3 / 4
- Switch view modes (1=Cluster, 2=Sphere, 3=Type, 4=Constellation)
- Animated transition over 600ms

#### Arrow keys (optional, v2)
- Pan the camera (useful if mouse is far away)
- Do not implement in v1, but document as future

### Filter panel (left sidebar within graph container)

A vertical sidebar sits above the canvas, collapsed by default. Click a chevron icon to expand/collapse.

**Filters:**

1. **Entity type toggles** (checkboxes)
   - Character ☑
   - Faction ☑
   - Location ☑
   - Object ☑
   - Lore ☑
   - When unchecked: nodes of that type and their edges vanish from the graph

2. **Edge type toggles** (checkboxes)
   - Strong edges ☑
   - Weak edges ☑ (checked by default)
   - When "Weak edges" unchecked: dashed lines vanish, orphans who have only text mentions become more visible

3. **Connection category filters** (checkboxes, tree structure)
   - Social ☑
     - (subtype bullets listed, not individual toggles)
   - Historical ☑
   - Physical ☑
   - Mystical ☑
   - When unchecked: edges of that category fade out

4. **Special filters**
   - ☐ Show orphans only (nodes with zero connections)
     - When checked: only show orphaned entities
   - ☐ Show hubs only (nodes with 5+ connections)
     - When checked: only show highly connected entities

5. **Search**
   - Text input: "Search entities…"
   - Filters nodes by partial name match (case-insensitive)
   - Matching nodes: bright
   - Non-matching nodes: dimmed (but still visible and interactive)

**Buttons:**
- **Re-settle** — Re-run the force simulation for the current layout (useful if user got a weird configuration)
- **Reset view** — Fit all visible nodes to view

---

## 8. Connection Forging Flow

This is the core interaction that turns the graph from a visualization into a world-building tool. The flow is split into distinct steps, with clear UI feedback at each stage.

### Step 0: Initial Selection

1. **User Shift+LMB on Node A**
   - Node A gets amber ring + pulsing scale
   - HUD appears near Node A: "Shift+click another node to connect"
   - Inspector is NOT updated yet (stays on previous entity or world overview)
   - User can move mouse away; the HUD stays

### Step 1: Second Selection (Focus Mode)

2. **User Shift+LMB on Node B (different node)**
   - Node B gets amber ring + pulsing scale
   - Focus mode: everything except A and B dims to ~0.15 opacity
   - A **dashed pending line** animates from A to B
   - HUD updates: "Right-click the line to forge"
   - Inspector panel shows the **forge panel** (not the entity detail page)
     - Forge panel displays:
       - Node A name (bold)
       - Node B name (bold)
       - Arrow icon between them
       - Text: "Choose a connection type below to forge a relationship"

### Step 2: Category Selection

3. **User RMB on the pending line** (or user scrolls in inspector to step 2)
   - Forge dialog appears in inspector or as a modal
   - **Step 1 panel:** Category grid (2×2)
     ```
     ┌─────────────────────────┐
     │ Social    │  Historical │
     ├───────────┼─────────────┤
     │ Physical  │  Mystical   │
     └─────────────────────────┘
     ```
   - Each category card shows:
     - Icon (custom SVG or emoji, e.g. 👥 for Social)
     - Name (bold)
     - One-line description
       - Social: "Relationships, bonds, emotions"
       - Historical: "Lineage, events, causality"
       - Physical: "Ownership, containment, location"
       - Mystical: "Curses, blessings, magic, fate"
   - **User clicks a category**

### Step 3: Subtype Selection

4. **Category selected, show subtypes**
   - Forge panel updates to show subtypes for that category
   - **List of radio buttons** (only one can be selected):
     ```
     Social subtypes:
     ◉ Ally         Shared goals, mutual support
     ○ Rival        Competition, opposition
     ○ Family       Blood, marriage, kinship
     ○ Love         Romance, desire, attraction
     ○ Mentor       Teaching, guidance, wisdom
     ○ Betrayed by  Trust broken, wounded
     ○ Oath-bound   Sworn, contract, binding promise
     
     Historical subtypes:
     ◉ Trained by   Student of, learned from
     ○ Caused       The other entity is consequence of this one
     ○ Witnessed    Was present for, saw happen
     ○ Descended from  Bloodline, inheritance
     ○ Built by     Created, crafted, constructed
     ○ Destroyed    Ruined, ended, unmade
     ○ Prophesied   Fated, destined, foretold
     
     Physical subtypes:
     ◉ Contains     Inside, held by, houses
     ○ Owned by     Possession, property
     ○ Located in   At, situated within
     ○ Made from    Material, substance
     ○ Guarded by   Protected, defended
     
     Mystical subtypes:
     ◉ Cursed by    Afflicted, hexed, bound
     ○ Blessed by   Favored, protected, enhanced
     ○ Bound to     Linked, tethered, entwined
     ○ Haunted by   Visited, observed by spirit
     ○ Empowered by  Given strength, magic, ability
     ```
   - First option is pre-selected (smart default based on node types)
   - **User selects a subtype and clicks "Forge Connection"**

### Step 4: Connection is Written

5. **Forge button clicked**
   - Connection is written to both entities' `associations` arrays:
     ```javascript
     // Entity A gets:
     associations: [
       {
         kind: "character|faction|location|object|lore",  // Type of Entity B
         id: B.id,
         note: "",
         connectionCat: "Social",        // NEW
         connectionSub: "Ally",           // NEW
       }
     ]
     // Entity B gets reciprocal entry
     ```
   - Graph updates: new strong edge appears between A and B (solid line, category color)
   - Both nodes fade out of focus mode (full opacity restored)
   - **Content generation card appears** (see step 6)

### Step 5: Content Generation Prompt

6. **User is offered content generation**
   - A card appears in the inspector:
     ```
     ┌──────────────────────────────────┐
     │ Generate Content for Connection? │
     │                                  │
     │ Ally: [Entity A] ↔ [Entity B]    │
     │                                  │
     │ You can generate a scene, a      │
     │ dialogue, or lore to explore     │
     │ this relationship.               │
     │                                  │
     │ [Choose content type ▼]          │
     │ [Generate] [Skip]                │
     └──────────────────────────────────┘
     ```
   - Dropdown shows content types appropriate for the connection category:
     - Social → Scene | Dialogue | Lore
     - Historical → Lore | Scene
     - Physical → Location detail | Object detail
     - Mystical → Lore | Scene
   - **If user clicks "Skip"**: Connection is saved, card closes, graph shows the new edge, inspector shows world overview
   - **If user selects a content type and clicks "Generate"**: Continue to step 7

### Step 6: Content Generation Route

7. **User is routed to creation screen**
   - If user selected "Scene":
     - Route to `SceneDetail` with mode="create"
     - Pre-fill: both entity names, their descriptions, context about the connection
     - Scene prompt is seeded with: "Write a scene between [Entity A] and [Entity B] that explores their [connection subtype] relationship. [Entity A brief desc]. [Entity B brief desc]."
   - If user selected "Dialogue":
     - Route to `DialogueWriter` with mode="create"
     - Pre-fill: Entity A and Entity B speakers, world context
     - Dialogue prompt seeded with the connection type
   - If user selected "Lore":
     - Route to document creation (create new `LoreDocument`)
     - Pre-fill: title field with "[Entity A] and [Entity B]: [connection subtype]"
     - Prompt seeded with: "Write a lore piece about the [connection subtype] between [Entity A] and [Entity B]."
   - If user selected "Location detail" or "Object detail":
     - Navigate to the corresponding entity's detail page (if it exists) or creation page (if creating new)
     - Pre-fill with context from the connected entities

---

## 9. Inspector Panel Behavior

The inspector panel is the right side of the split-screen layout. Its behavior changes based on what is selected in the graph.

### Default state (no node selected)

- Shows **World Overview**:
  - World name, tagline, description
  - Stats grid:
    - X characters
    - Y scenes & dialogues
    - Z objects, factions, locations
    - W lore documents
  - Quick-action buttons: "New Character", "New Scene", etc. (same buttons from WorldDetail)

### Node selected (single LMB inspect)

- Shows the **entity detail page** for that node's entity
- If the entity is a Character:
  - Shows `CharacterSheet` component (full editable form)
  - User can edit any field, regenerate sections, etc.
- If the entity is an Object:
  - Shows `ObjectDetail` component
- If the entity is a Faction:
  - Shows `FactionDetail` component
- If the entity is a Location:
  - Shows `LocationDetail` component
- If the entity is a Lore Document:
  - Shows `DocumentDetail` or read-only view

**All edits are saved immediately to world state.** No duplicate component logic — the inspector uses the same component as the full-width view.

### Back button behavior

Inspector header has a "Back" button (←) that:
- Clears the inspected node (node outline disappears from graph)
- Inspector returns to world overview
- **Graph node is NOT deselected** — if user clicks back then clicks a different node, the previous node is no longer outlined, but the graph state is clean

### Scroll context

- Inspector content scrolls independently of canvas
- Canvas scroll/wheel is zoom (not scroll)
- Inspector scroll is normal document scroll

---

## 10. Data Model Changes

### Extend `associations` array format

Currently, `Object`, `Faction`, and `Location` entities have an `associations` array:
```javascript
associations: [
  {
    kind: "character",      // "character" | "faction" | "location" | "object" | "lore"
    id: "abc-123",
    note: "Optional user note"
  }
]
```

Extend to include connection metadata:
```javascript
associations: [
  {
    kind: "character",
    id: "abc-123",
    note: "Optional user note",
    connectionCat: "Social",        // NEW: "Social" | "Historical" | "Physical" | "Mystical"
    connectionSub: "Ally"            // NEW: subtype string (see section 8 for full list)
  }
]
```

**Backward compatibility:** New fields are optional. Old associations without `connectionCat` / `connectionSub` are valid (the fields are simply absent until the user forges via the graph).

### Characters: replace `relationships` with `associations`

Currently, Characters have a `relationships` array that is rarely used:
```javascript
relationships: []
```

This should become the same format as `associations` (so characters can have forged connections in the graph). Rename the field to `associations` to match the pattern:

```javascript
// BEFORE
relationships: []

// AFTER
associations: [
  {
    kind: "character",
    id: "def-456",
    connectionCat: "Social",
    connectionSub: "Rival"
  }
]
```

### LoreDocuments: add `associations` array

`LoreDocument` entities currently do not have associations. Add an empty array:
```javascript
associations: []
```

Same format as above. Lore can be connected to characters, objects, locations, factions, or other lore.

### Scenes and Dialogues: add `associations` array

Both `Scene` and `Dialogue` entities should have associations (a scene can reference locations, characters involved, objects used):
```javascript
associations: []
```

### World-level: add `graphLayout` field

Store the settled node positions so the force simulation is restored between sessions:

```javascript
// In World object
graphLayout: {
  positions: {
    "char-abc": { x: 100, y: 50, z: 30 },
    "faction-def": { x: -80, y: 120, z: -40 },
    // ...
  },
  viewMode: "Cluster",  // Which layout mode was active when saved
  zoom: 1.0,
  rotation: { x: 0, y: 0, z: 0 }  // Euler angles or quaternion
}
```

On graph open, if `graphLayout` exists, load those positions instead of re-settling. This gives users a persistent canvas state.

### Storage version bump

Increment `STORAGE_VERSION` in `src/constants.js` (current is v8 → v9).

Add migration in `src/storage.js` that:
- Renames `character.relationships` to `character.associations`
- Adds empty `associations: []` to any entity type that doesn't already have it (objects, factions, locations, documents, scenes)

Claude Code should follow the existing migration pattern in `src/storage.js` — look at how previous version migrations are structured and match that style exactly.

---

## 11. Relationship to Reference Network

### What is the Reference Network?

The Reference Network is a system for linking entities via text mentions. When a user writes in a character's background:

> "She was trained by the monks of the Eastern Temple."

The app can tag `[[Eastern Temple|location]]` to mark this as a reference. The app automatically surfaces this as a **weak edge** in the graph.

### Weak edges come from two sources

1. **Explicitly forged connections** → **strong edges** (solid lines)
   - User shapes these via the graph UI
   - Written to `associations` array
   - Intentional, designed relationships

2. **Text mentions** via `[[Entity Name|type]]` tags → **weak edges** (dashed lines)
   - Discovered at render time from the Reference Network
   - Not written to `associations` (they live in prose)
   - Organic, emergent relationships

### Graph rendering

When rendering the graph:

1. **Load all strong edges** from `associations` arrays
2. **Scan all text fields** (character background, lore documents, object description, etc.) for `[[...]]` tags
3. **Create weak edges** for each tag that resolves to an entity in the graph
4. **Render both** (solid + dashed lines visible, unless user toggles weak edges off)

The graph is therefore a **live summary of both designed and discovered relationships**.

### Example

- User creates Character A and writes in background: "I was raised by [The Archivist], an ancient lore keeper."
- If the Archivist is tagged as `[[The Archivist|character]]`, the graph automatically shows a dashed weak edge from A to The Archivist
- Later, user forges a strong "Mentor" connection via the graph
- Now both strong (solid) and weak (dashed) edges appear between them
- The solid line shows intentional design; the dashed line shows the textual foundation

---

## 12. Phased Implementation

### Phase 1 (MVP) — Graph Integration & Forging

**Scope:** Get the existing prototype into the app, wired to state, with basic forging.

**Components to build:**

- `WorldGraph.jsx` — Main container component
  - Manages canvas element, mouse/keyboard listeners
  - Owns layout state, selection state, filter state
  - Calls force simulation engine
  - Renders canvas

- `GraphCanvas.js` (or `graphRenderer.js`) — Pure rendering
  - Takes current state (nodes, edges, selections) and draws to canvas
  - Handles 3D projection, gradients, glow effects

- `GraphForceSimulation.js` — Force-directed layout engine
  - Vanilla JS, no Three.js
  - Runs iteration loop, settles nodes
  - Returns settled positions

- `GraphFilterPanel.jsx` — Sidebar with toggles and search
  - Filter checkboxes (entity types, edge types, categories)
  - Search input
  - Mode selector buttons

- `GraphForgeDialog.jsx` — Connection forging steps
  - Step 1: Category selection (2×2 grid)
  - Step 2: Subtype selection (radio list)
  - Buttons to confirm/cancel

- Updates to `App.jsx`:
  - Add `graphOpen` state to track toggle
  - Add `graphSelectedNode` and `graphShiftSelected` state
  - Pass down callbacks for node selection, edge forging

- Updates to `GlobalNav.jsx`:
  - Add graph toggle button (when in a world)

- Updates to `WorldDetail.jsx`:
  - Render graph + inspector layout when graph is open
  - Pass current view (character, object, etc.) to inspector

**What's included:**
- Graph toggle (G key, button in GlobalNav)
- Canvas interaction (drag rotate, scroll zoom, LMB inspect, Shift+click forging, RMB on edge)
- Force-directed layout (Cluster mode)
- Category/subtype selection for forging
- Strong edges written to `associations`
- Basic filter panel (entity type toggles)
- Node size proportional to connections
- Color-coded nodes and edges

**What's NOT included (Phase 2+):**
- Content generation from connections
- Weak edges from Reference Network (if ref network not yet built)
- All four view modes (only Cluster in Phase 1)
- graphLayout persistence
- Connection editing (forged connections are permanent)
- Advanced filters (hubs-only, orphans-only)

### Phase 2 — Enhanced Layout & Persistence

**Scope:** Richer visualization, saved state.

**Add:**
- Sphere, Type, and Constellation view modes
- graphLayout persistence (positions, zoom, rotation saved between sessions)
- Advanced filters (orphans only, hubs only)
- Connection editing UI (edit or delete forged connections)
- Re-settle button

### Phase 3 — Content Generation

**Scope:** Turn connection forging into a content generation trigger.

**Add:**
- Post-forge content generation card
- Route to Scene, Dialogue, Lore creation with pre-filled context
- Type-appropriate content suggestions (Social → Scene/Dialogue, Historical → Lore, etc.)

### Phase 4 — Reference Network Integration

**Scope:** Weak edges from text mentions.

**Add:**
- Scan `[[...]]` tags in entity text fields
- Render weak edges (dashed lines)
- Weak edge tooltips (show source mention)
- Toggle weak edges on/off
- Full graph showing both designed and organic relationships

---

## 13. Technical Implementation Notes

### Canvas rendering approach

- **Canvas element** in the DOM, with `ref` to the HTMLCanvasElement
- **2D context** (`ctx = canvas.getContext('2d')`)
- **3D projection:** Custom matrix math (already prototyped)
  - Nodes stored in 3D (x, y, z)
  - Project to 2D screen via 3×3 rotation matrix + perspective divide
  - No external 3D library (confirmed by product owner)
- **Continuous render loop:** `requestAnimationFrame` during animation/interaction, stop when settled
- **Hit detection:** Ray casting or bounding box tests for nodes on click

### State management

- All graph state lives in `App.jsx` as React state (per codebase pattern — no Redux or global context)
- Graph state includes: open/closed toggle, selected node(s), shift-selected pair (for forging), filter settings, current layout mode
- Claude Code decides the exact state variable names and structure — follow the existing patterns in `App.jsx`

### Performance considerations

- Canvas renders at 60fps during interaction (drag, scroll)
- Pause rendering when settled (no updates = no render)
- Lazy compute: edges from references only on graph open (not every frame)
- Debounce window resize (recalculate canvas size only after 200ms pause)
- Node size capped at reasonable max (28px) to prevent massive nodes overwhelming canvas

### Mobile & responsive

- **v1 minimum width:** 900px
- Below 900px: graph toggle hidden, or shows "Not supported on mobile"
- Resize handle only works on desktop (disabled on mobile)
- Touch events: optional in Phase 2 (one-finger drag to rotate, two-finger pinch to zoom)

---

## 14. File Structure (suggested — Claude Code decides final organisation)

The graph will likely need the following, but exact module boundaries and file names are up to Claude Code based on what fits the existing `src/` structure:

- A main container component (`WorldGraph.jsx` or similar) — manages the canvas, event listeners, selection state, and layout state
- A rendering module — pure canvas drawing logic (3D projection, node/edge rendering, gradients)
- A physics module — force-directed simulation (separate from rendering, easy to test)
- A filter panel component — sidebar with toggles and search
- A forge dialog component — connection forging steps

Files that need changes: `App.jsx` (graph state, toggle), `GlobalNav.jsx` (graph button), `WorldDetail.jsx` (split-screen layout), `constants.js` (add `GRAPH_NODE_COLORS` and connection type definitions), `storage.js` (migration), `styles.css` (graph layout classes).

---

## 15. Success Criteria

A successful Phase 1 implementation:

- [ ] Graph toggle appears in GlobalNav when user is in a world
- [ ] Toggling graph open slides in left panel, inspector appears on right (65/35 split)
- [ ] Nodes render with correct colors for each entity type
- [ ] Node size correlates with connection count
- [ ] User can drag to rotate, scroll to zoom, LMB to inspect a node
- [ ] Inspecting a node shows its detail page in the inspector panel
- [ ] User can Shift+LMB two nodes to begin forging
- [ ] Forging UI allows category and subtype selection
- [ ] After forge, connection is saved to both entities' `associations`
- [ ] Graph re-renders with new strong edge visible
- [ ] Force simulation settles nodes into clusters in ~3 seconds
- [ ] Escape clears all selections
- [ ] Storage migration handles v8→v9 gracefully
- [ ] Graph state persists in window.storage
- [ ] Responsive resize handle between panels works smoothly
- [ ] Filter panel toggles entity types (nodes disappear when unchecked)
- [ ] Back button in inspector returns to world overview without losing graph selection

---

## Appendix A: Connection Types (Full Reference)

### Social Category

| Subtype | Description | Example |
|---|---|---|
| Ally | Shared goals, mutual support | "Prince Aldric and the Duchess are allies in the succession war" |
| Rival | Competition, opposition | "Seris and Vaunt are rivals for the throne" |
| Family | Blood, marriage, kinship | "Lord Dravec is Aldric's father" |
| Love | Romance, desire, attraction | "Kael harbors secret love for Meron" |
| Mentor | Teaching, guidance, wisdom | "The Archivist was Seris's teacher" |
| Betrayed by | Trust broken, wounded | "Kael was betrayed by his closest friend" |
| Oath-bound | Sworn, contract, binding promise | "The Guard Captain swore an oath to protect the Queen" |

### Historical Category

| Subtype | Description | Example |
|---|---|---|
| Trained by | Student of, learned from | "Aldric was trained by the Master-at-Arms" |
| Caused | The other entity is consequence of this one | "The siege caused the city's fall" |
| Witnessed | Was present for, saw happen | "Seris witnessed the burning of the Archive" |
| Descended from | Bloodline, inheritance | "The current King descended from the ancient line of Dravec" |
| Built by | Created, crafted, constructed | "The Cathedral was built by the master mason Thorne" |
| Destroyed | Ruined, ended, unmade | "The plague destroyed the village of Millbrook" |
| Prophesied | Fated, destined, foretold | "Kael was prophesied to be the downfall of the realm" |

### Physical Category

| Subtype | Description | Example |
|---|---|---|
| Contains | Inside, held by, houses | "The Tower of Ashes contains the Eternal Flame" |
| Owned by | Possession, property | "The Sword of Kings is owned by Prince Aldric" |
| Located in | At, situated within | "The Archivist dwells in the Hidden Library" |
| Made from | Material, substance | "The Crown is made from starsilver ore" |
| Guarded by | Protected, defended | "The Treasury is guarded by the Royal Guard" |

### Mystical Category

| Subtype | Description | Example |
|---|---|---|
| Cursed by | Afflicted, hexed, bound | "The Shadowborn are cursed to walk only at night" |
| Blessed by | Favored, protected, enhanced | "Meron is blessed by the Old Gods" |
| Bound to | Linked, tethered, entwined | "The Lich King is bound to the Obsidian Throne" |
| Haunted by | Visited, observed by spirit | "The Ruin is haunted by the ghosts of the fallen" |
| Empowered by | Given strength, magic, ability | "The Sorcerer is empowered by an ancient grimoire" |

---

## Appendix B: CSS Class Reference

**Graph container and layout:**
- `.graph-split-container` — Main split-screen container (flex row)
- `.graph-canvas-container` — Left panel with canvas (65% width)
- `.graph-inspector` — Right panel with entity detail (35% width)
- `.graph-resize-handle` — Draggable divider between panels

**Canvas and interaction:**
- `.graph-canvas` — The HTMLCanvasElement
- `.graph-canvas-overlay` — Invisible overlay for mouse event capture

**Filter panel:**
- `.graph-filter-panel` — Sidebar container
- `.graph-filter-group` — Grouping for related toggles
- `.graph-filter-toggle` — Individual checkbox + label

**Forge dialog:**
- `.graph-forge-dialog` — Modal or inspector panel section
- `.graph-forge-step` — Current step in the forging flow
- `.graph-forge-category-grid` — 2×2 grid of categories
- `.graph-forge-subtype-list` — Radio button list of subtypes

---

## Appendix C: Keyboard Shortcut Reference

| Key | Action |
|---|---|
| `G` | Toggle graph open/closed |
| `Escape` | Clear selections; close dialogs |
| `F` | Fit all visible nodes to view |
| `1` | Switch to Cluster layout (Phase 2) |
| `2` | Switch to Sphere layout (Phase 2) |
| `3` | Switch to Type layout (Phase 2) |
| `4` | Switch to Constellation layout (Phase 2) |

---

## Appendix D: Example Connection Forge Walkthrough

### Scenario: Forging a "Rival" connection

1. **User is viewing the WorldDetail page with graph open.**
   - Graph shows nodes for 5 characters, 2 locations, 1 faction
   - User can see "Aldric" (amber node, center-left) and "Seris" (amber node, right)

2. **User Shift+clicks on Aldric**
   - Aldric node gets 3px amber ring + pulsing animation
   - HUD appears near Aldric: "Shift+click another node to connect"

3. **User Shift+clicks on Seris**
   - Seris node gets 3px amber ring + pulsing animation
   - Everything else dims to 0.15 opacity
   - Dashed line animates from Aldric to Seris
   - HUD updates: "Right-click the line to forge"
   - Inspector panel switches from world overview to forge panel
     - Shows: "Aldric ↔ Seris — Choose a connection type"

4. **User RMB on the dashed line**
   - Forge dialog appears (or focus is set to inspector forge panel)
   - Step 1: Category selection grid visible
     ```
     ┌─────────────────────────┐
     │ 👥 Social    │ 📜 Historical │
     │ Relationships │ Lineage,    │
     │               │ causality   │
     ├─────────────────────────┤
     │ 📍 Physical  │ ✨ Mystical   │
     │ Ownership,  │ Magic,      │
     │ containment │ curses      │
     └─────────────────────────┘
     ```

5. **User clicks "Social"**
   - Dialog updates to show Social subtypes
   - Radio list appears:
     ```
     ◉ Ally        (Shared goals, mutual support)
     ○ Rival       (Competition, opposition)
     ○ Family      (Blood, marriage, kinship)
     ○ Love        (Romance, desire, attraction)
     ○ Mentor      (Teaching, guidance, wisdom)
     ○ Betrayed by (Trust broken, wounded)
     ○ Oath-bound  (Sworn, contract, binding promise)
     ```

6. **User clicks "Rival"**
   - Rival is now selected (radio filled)

7. **User clicks "Forge Connection"**
   - Dialog closes
   - Connection is written:
     ```javascript
     // Aldric.associations += { kind: "character", id: "seris-id", connectionCat: "Social", connectionSub: "Rival" }
     // Seris.associations += { kind: "character", id: "aldric-id", connectionCat: "Social", connectionSub: "Rival" }
     ```
   - Graph updates: solid amber line appears between Aldric and Seris
   - Both nodes fade to normal opacity
   - Focus mode ends
   - Content generation card appears: "Generate content for this connection?"
     - Dropdown shows: "Scene | Dialogue | Lore"
     - User can select and generate, or skip

8. **User clicks "Skip"**
   - Card closes
   - Graph shows the new solid edge persisting
   - Inspector returns to world overview
   - Relationship is saved; no content generated

---

## Appendix E: Glossary

- **Strong edge**: Explicitly forged connection, solid line, written to `associations`
- **Weak edge**: Text mention via `[[...]]` tag, dashed line, discovered at render time
- **Node**: Visual representation of an entity (character, faction, location, object, lore)
- **Edge**: Visual line connecting two nodes, representing a relationship
- **Forging**: Process of creating a new connection between two entities via the graph UI
- **Focus mode**: Visual state when two nodes are Shift-selected, everything else dims
- **Euler integration**: Simple numerical method for simulating forces and motion
- **Rest length**: Target distance for attraction forces along edges
- **Inspector**: Right panel showing entity detail page or world overview
- **Split-screen**: Layout where graph takes 65% left, inspector takes 35% right
