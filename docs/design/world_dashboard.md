# World page — dashboard redesign

## The problem with the current design

The World page currently works as a character list with a couple of extra buttons at the bottom. Characters and Scenes live in two tabs, "Create character" is the primary action, and everything else (world docs, continue interview, analyse cast) gets squeezed into the footer as secondary buttons.

This worked when Characters was the only real feature. It breaks as soon as you add a third or fourth capability. There's nowhere sensible to put Factions, Objects, or Lore without turning the bottom bar into a menu — which is bad navigation design.

The deeper problem is conceptual: the current layout implies that the World page *is* the Characters list. It should be the other way around — Characters should be one tool inside the World.

---

## The core idea

**Treat the World page as a dashboard.**

The world is the container. Everything else — characters, scenes, dialogue, factions, objects, world interviews — is a tool or asset that belongs to it. The World page should make that explicit: you land here, see what's in your world, and choose what to work on.

This mirrors how users actually think about their worlds. They don't have "a character app with some scenes tacked on." They have a world with people, places, events, and history — and they want to build and explore all of it from one place.

The WorldAnvil model is the right reference point here: a structured wiki where everything in the world is an asset type, and you can create, link, and browse across all of them.

---

## Layout structure

### 1. Header

The world name, description, genre tags, and world-level actions (view world docs, settings, delete) sit at the top on every visit. This is orientation — the user should always know where they are and what world they're in.

World docs moves out of its current standalone section and becomes a secondary button in the header. It's reference material, not a primary action.

### 2. Tools grid

A card grid of capabilities the user can enter. Each tool card has:

- A name and one-line description
- A count of existing assets (e.g. "5 characters", "3 scenes") — at a glance, you know the state of your world
- A click target that opens that tool's full view

The tools grid is where the scalability lives. Adding Factions, Objects, or Lore is just adding a new card. No nav restructuring, no new tabs, no redesign.

Tools that aren't built yet appear as dimmed "coming soon" cards. This communicates the roadmap without cluttering the active UI, and it sets the user's expectation that the world will grow.

**Current tools:**
- Characters — create and view characters using the Aristotelian framework
- Scenes — write dramatic scenes with characters in conflict
- World interview — deepen the world through guided questions

**Planned tools (dimmed):**
- Factions — define groups, allegiances, and power structures
- Objects — artifacts, places, and significant things
- Lore — history, myths, and world-building documents

### 3. Library

A unified, searchable asset list at the bottom of the dashboard. All asset types in one place, filterable by category tab (All / Characters / Scenes / Factions / Objects / etc.).

This is the wiki view. Rather than clicking into Characters and then into Scenes separately, the Library gives you a single cross-type view of everything in your world. You can search across all assets, spot gaps, and jump directly to any item.

The Library replaces the current Characters/Scenes tab switcher in WorldDetail. Instead of two tabs that only show one type at a time, the Library shows everything and lets the user filter down.

---

## Navigation model

```
Hub (all worlds)
  └── World dashboard
        ├── Tool: Characters
        │     ├── Character view (individual)
        │     └── New character (generate)
        ├── Tool: Scenes
        │     ├── Scene view (individual)
        │     └── New scene
        ├── Tool: World interview
        └── Library (cross-type asset browser)
```

The World dashboard is the root of the world. All navigation within a world goes through it. The back button on any tool view returns here, not to the hub.

This also means users can switch between tools without losing their place — go from a character back to the dashboard, then open a scene, without losing context.

---

## Scalability principles

**Every new feature is a new tool card.** The tools grid requires zero structural change to accommodate new capabilities. Factions gets a card, Objects gets a card, a future "Timeline" feature gets a card. The layout absorbs them.

**Every new asset type is a new Library tab.** The Library tab row grows with asset types. "All" always works as the default, so new types don't break existing navigation.

**Tool cards communicate world state.** The asset count on each card means the dashboard itself is informative — you can see at a glance that you have 5 characters and 0 factions, which naturally guides what to work on next.

**Coming-soon cards are part of the product.** Showing planned tools in a dimmed state isn't a placeholder, it's intentional. It helps users understand the scope of the tool and creates pull toward features still being built.

---

## What changes in the implementation

The main work is in `WorldDetail.jsx`:

- Remove the Characters/Scenes tab switcher as the primary UI pattern
- Add the Tools grid as the primary section
- Move the Library (previously the Characters/Scenes tab content) to the bottom as a unified component
- Move the "World Documents" conditional section into the header as a secondary action button
- Move "Continue Interview" and "Analyse Cast" into the World Interview tool card, or into the header actions — they shouldn't live in the footer

The bottom bar simplifies significantly: the primary call-to-action moves to whichever tool the user enters, not to the world dashboard itself. The dashboard is for orientation and navigation, not for triggering generation directly.

---

## What this is not

This is not a sidebar-nav redesign. A persistent left sidebar is the right move eventually, but it adds layout complexity before the feature set justifies it. The dashboard card grid achieves the same scalability goal without changing the fundamental layout structure of the app.

This is also not WorldAnvil. The goal is a clean, focused dashboard — not a full wiki editor with infoboxes, categories, and relationship graphs. The Library is a simple asset list, not a linked wiki. Richer linking and cross-referencing is a future problem.
