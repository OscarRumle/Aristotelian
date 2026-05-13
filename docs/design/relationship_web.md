# Relationship Web

## What it is

A visual graph showing the dramatic connections between characters in a world. Each node is a character. Each edge is a named relationship with a type, a generated description, and an Aristotelian observation about why that connection is dramatically significant.

The feature lives inside a world, accessed from the World dashboard as a tool card. The back button always returns to the World dashboard.

The tool card on the dashboard shows the total count of existing connections (e.g. "8 connections").

---

## The Aristotelian principle

The central design decision: connections are generated from hamartias, not biographies.

When a user selects two characters and generates a connection, the prompt asks how their fatal flaws interact — not simply what their relationship is. This keeps the web dramatically useful rather than descriptive.

A loyalty connection isn't just "she trusts him." It's "she trusts him completely, and his hamartia — loyalty as self-erasure — means he has never once questioned whether that trust is deserved." The flaw is woven in.

The six built-in connection types are Aristotelian framings:

| Type | Directionality | What it means |
|---|---|---|
| Conflict | Bidirectional | Their natures cannot coexist — hamartias in direct opposition |
| Dependency | Directional | One's weakness is the other's power (A depends on B) |
| Loyalty | Bidirectional | A bond the story will test — and probably break |
| Mirror | Bidirectional | The same flaw, different masks |
| Debt | Directional | An obligation A owes B that shapes every scene they share |
| Catalyst | Directional | A triggers B's fall |

A seventh option — **Custom** — lets the user write their own connection text (see below).

For directional types (Dependency, Debt, Catalyst), the user specifies which character is A and which is B during the type selection step. The direction is visualised on the edge with a subtle arrowhead. Bidirectional types have no arrowhead.

The LLM output always includes a `note`: a single Aristotelian observation about why this connection is dramatically significant. This is rendered in italic beneath the main description in the review panel.

---

## Visual design

The Relationship Web must use the app's existing design system — `src/styles.css` — without introducing its own colour scheme. Typography, spacing tokens, border treatments, surface colours, and the serif/sans pairing all come from the established system. The only intentional exception is the graph stage itself, which uses a near-black background (`--dk-bg` or equivalent dark surface token) to give the web an atmospheric, stage-like quality. This contrast between the dark graph and the light panel below is a deliberate design choice, not an inconsistency.

The reference for all visual decisions is `Aristotelian Style Guide.html` in the workspace root.

### Graph stage
The stage is a scalable SVG canvas that fills its container. Characters are nodes positioned across the stage. Connections are drawn as lines between them. The stage is pannable and zoomable (see Navigation below). The stage background is dark; everything else — panel, header, controls — uses the standard app surfaces.

### Nodes
Each character is a circle. Size reflects dramatic role: Lead is largest, Deuteragonist slightly smaller, Supporting smaller still. Node interiors show the character's initials. Name and role label appear beneath. The hover state lifts the node slightly (scale transform) and reveals a small focus icon. The selected state adds an animated ring that pulses outward and fades.

### Edges
Each edge is coloured by connection type using the app's semantic colour palette — not bespoke hex values. Edges sit at reduced opacity by default so the web stays readable as it grows. Two small particles travel bidirectionally and continuously along each edge, slow and ambient, suggesting ongoing dramatic tension rather than a single event. Directional edges carry a subtle arrowhead near the target node.

### Animation principles
The web should feel alive at all times — not just during interaction, but at rest. Ambient particle flow on edges, the soft pulse of selected rings, smooth draw-in on new connections, and micro-transitions on every state change all contribute to this. Every visible state change should have a transition. Nothing should snap or pop without intention. Animations should be subtle — they support the feeling of the web, they don't perform it.

Specific moments requiring animation:
- Node hover: subtle scale up, focus icon appears
- Node selection: ring pulse (outward expand + fade, looping)
- Pending line (two characters selected, not yet confirmed): dashed line between them with animated dash flow
- Generation in progress: pending line speeds up its animation to signal activity
- Connection confirmed: new edge draws itself from node A to node B
- Edge hover: edge brightens, connection title appears as a label
- Edge flash: clicking an already-connected pair briefly brightens it and shows a tooltip
- Focus mode: unfocused nodes and edges fade to near-invisible, focused subgraph brightens
- Panel state transitions: each phase slides/fades in
- Zoom/pan: smooth inertia on both

---

## Node positioning

Each character stores their position (`x`, `y`) as part of their data on the world object. This means positions persist across sessions and are personal to each world.

When the web is first opened for a world, characters that have no stored positions are laid out automatically using a simple force-directed algorithm that spaces them evenly and avoids overlap.

When a new character is created elsewhere in the app and the user opens the Relationship Web, that character appears at a default unoccupied position on the stage — typically placed near the centre or in open space, not stacked on top of existing nodes.

Users can drag nodes to rearrange them. Dragging saves the new position immediately. This is a key part of making the web feel owned and intentional rather than auto-generated.

When a character is deleted from the world, their node is removed from the web and their connections are also removed from `world.relationships`.

---

## Navigation (zoom and pan)

For worlds with many characters the web can become dense. The stage supports:

- **Pinch to zoom** (trackpad/touch) and **scroll to zoom** (mouse wheel)
- **Drag to pan** on the background (not on nodes or edges)
- A **fit to screen** button that resets the view to show all nodes

Zoom level and pan position are preserved while the user is in the web view but reset to fit-to-screen on each new visit. Filters and focus state also reset to default on each visit (see Filtering below).

---

## Interaction flow

### Creating a connection

```
idle
  → click character A
      → first: shows A's name + hamartia, hint to select another
      → (or double-click A → enters focus mode for A)

  → click character B (no existing edge)
      → type: both characters shown with hamartias, type grid, direction selector
        (for directional types), Generate button

  → click character B (already connected)
      → edge detail panel: shows existing connection title, type, description, note
        with options to Edit or Delete

  → select type (or Custom) → Generate enabled

  → Generate →
      → gen: pending line speeds up, spinner + "Reading the hamartias…"
      → review: type tag, title, description, Aristotelian note
          → Confirm & save → confirmed → write-back → quick-add prompt
          → Try again → type (same pair, clear type selection)

  → Cancel (at any point before confirm) → idle

  → click background (during first or type phase) → idle
```

### After confirming — quick-add path

After a connection is confirmed, the panel shows the confirmation state and then offers a **"Connect another →"** shortcut that keeps character A pre-selected and returns to the first phase, ready for the user to pick another character. This removes the need to click A again when adding multiple connections in one session. Dismissing the prompt or waiting returns to idle as normal.

### Editing an existing connection

Clicking on an existing edge opens the edge detail panel:

- Connection type tag, title, description, and Aristotelian note displayed in full
- Two actions: **Edit** and **Delete**

Clicking Edit re-enters the review state with the existing content pre-filled. The user can change the type, regenerate, or amend the text manually. Confirming an edit runs the write-back step again for both characters, appending or updating the relevant fields rather than duplicating.

Clicking Delete opens the deletion confirmation (see below).

---

## Panel states

The panel below the graph is a state machine. It changes fully at each phase.

| Phase | Content |
|---|---|
| idle | Atmospheric hint (see below) |
| first | Selected character's name, hamartia, hint to select a second |
| type | Both characters side by side with hamartias, type grid (including Custom), direction selector for directional types, Generate button |
| gen | Spinner, "Reading the hamartias…" |
| review | Type tag, connection title, main description, italic Aristotelian note. Buttons: Try again / Confirm & save |
| confirmed | Checkmark + confirmation message + "Connect another →" quick-add prompt |
| edge detail | Full connection details (type, title, description, note) for an existing edge. Buttons: Edit / Delete |
| edit | Same as review, with existing content pre-filled |

### Idle state hint

The idle state is the first impression of the feature. It should communicate what the web actually does for a story — not just how to operate it. Something in the register of: *"Every character carries a flaw. Map how those flaws pull against each other."* Followed by the operational hint: "Click any character to begin." The exact copy should match the voice of the rest of the app.

---

## Empty and first-run states

**No characters yet:** If a world has no characters, the stage shows a short message explaining what the web is for, with a link to create the first character. No graph is rendered.

**One character, no connections:** The single node appears centred on the stage. The panel hint acknowledges this: something like "Add more characters to start mapping the forces between them."

**Characters exist, no connections:** All nodes are visible. The idle hint is prominent. This is the intended entry state for a new world — the web is ready, it just hasn't been used yet.

---

## Connection type selection

The type grid shows seven options: the six built-in types plus **Custom** as the last option.

Selecting a built-in type enables the Generate button. For directional types (Dependency, Debt, Catalyst), a direction selector appears beneath the type grid — a simple toggle showing "A → B" or "B → A" with both character names labelled. The selected type and direction are passed to the LLM as constraints.

Selecting **Custom** reveals a freetext input instead of enabling Generate directly. The user writes their own description of the connection. Once the input has content, three options appear beneath it:

- **Stay as written** — use the text exactly as entered, skip generation
- **Refine** — send the text to the LLM for polish and tightening, keep the user's intent
- **Expand** — send the text to the LLM to deepen it: more dramatic texture, more hamartia engagement

This is the same freetext treatment used across the rest of the app's creation tools.

The review step is identical regardless of whether the connection was generated or written — the user sees the final text, the type tag, and the Aristotelian note (generated connections) or optionally no note (stay-as-written) before confirming.

---

## Write-back to character sheets

**This is a core behaviour of the feature.** When a connection is confirmed, the connection details are woven into the relevant text fields on each character's sheet — not stored as a separate "Relationships" section.

The LLM is responsible for this step. After the user confirms, a second prompt runs: given the confirmed connection description, determine which fields on each character's sheet it belongs in (description, history, dramatic role, etc.) and write the new detail into those fields in a way that reads as part of the existing text, not as an appended note.

The write-back happens immediately after confirm and runs in the background. The confirmation message reflects this: "Connection saved and written to both characters."

### Write-back failure

If the write-back LLM call fails, the connection is still saved to `world.relationships` — the web is not affected. However, the character sheets will not have been updated. In this case:

- The confirmation message changes to: "Connection saved. Couldn't write to character sheets — tap to retry."
- The edge detail panel for that connection shows a subtle indicator (e.g. a warning icon) and a retry option
- Retrying runs only the write-back step, not the full generation

This ensures the connection is never lost, only the character sheet enrichment.

### On edit

When an existing connection is edited and confirmed, the write-back runs again. The LLM receives both the original and updated connection text and determines what to amend in the character sheet fields — appending changes rather than rewriting from scratch.

### On deletion

When a connection is deleted, its entry in `world.relationships` is removed. The details previously written to character sheets are not automatically reversed — those fields are considered authored content. This is made explicit in the deletion confirmation.

---

## Deleting a connection

The delete action is available from the edge detail panel.

Clicking delete replaces the panel content with a confirmation state — not a modal. The confirmation clearly states:

- Which connection is being deleted (both character names + type + title)
- That the edge will be removed from the web
- That any details written to the characters' text fields will remain and must be removed manually if desired

Two buttons: **Delete connection** and **Cancel**. Cancel returns to the edge detail panel.

---

## Visual filtering

As a world grows, the web can become dense. Filtering controls what the user sees without affecting stored data. All filters are visual-only — filtered-out edges and nodes still exist and reappear when cleared.

Filter controls live in a compact bar above the graph stage, styled as part of the canvas header.

**By connection type** — a chip for each type. Active chips show that type; deactivating hides it. All types shown by default.

**By character (focus mode)** — double-clicking a node, or clicking the focus icon on node hover, enters focus mode for that character. In focus mode: only edges connected to that character remain fully visible; all other nodes and edges dim significantly. Clicking elsewhere or the same node again exits focus mode. This is visually distinct from the selection state used during connection creation.

**Show unconnected** — a toggle that highlights characters who have no connections. Useful for spotting gaps. Highlighted nodes get a subtle visual treatment (e.g. slightly brighter ring or dashed border) to draw the eye without disrupting the rest of the web.

### Filter persistence

Filter settings (type filters, show-unconnected toggle) are saved to the world object and persist between visits. This means if a user was reviewing only conflicts the last time they used the web, that view is waiting for them on return. Zoom level and pan position reset to fit-to-screen on each visit; filters do not.

A **Clear filters** action is available in the filter bar whenever any filter is active.

---

## LLM output schema

```
{
  type: one of the six built-in types, or "custom",
  direction: "a_to_b" | "b_to_a" | "bidirectional",
  title: a short dramatic name for this connection,
  description: 2–3 sentences grounded in both characters' hamartias,
  note: one sentence — the Aristotelian observation about dramatic significance
}
```

For custom connections, the `note` is still generated for Refine and Expand paths. For "Stay as written," the note is optional.

---

## State management

Connections live on the world object alongside all other asset arrays:

```
world.relationships = [
  { id, a, b, type, direction, title, description, note, writeback_status }
]
```

Where `a` and `b` are character IDs, `direction` is one of `"a_to_b"`, `"b_to_a"`, or `"bidirectional"`, and `writeback_status` tracks whether the character sheet write-back succeeded (`"ok"`, `"pending"`, `"failed"`).

Character positions are stored directly on the character object as `x` and `y`. Filter settings are stored on the world object as `world.relationship_filters`.

Names resolve at render time throughout — if a character is renamed, their connections and node labels update automatically.

All mutations follow the same immutable `.map()` pattern as characters, objects, factions, and locations.

---

## What this is not

This is not a social graph tool. The web is not for mapping every possible relationship between characters — it's for mapping the ones that matter dramatically. Users should feel invited to be selective. The idle state hint should reinforce this: the web gains meaning from curation, not completeness.

This is also not a replacement for the character sheet. The write-back behaviour extends the character sheet; it doesn't compete with it. The web is for building and exploring dramatic structure; the character sheet is for depth on any individual.
