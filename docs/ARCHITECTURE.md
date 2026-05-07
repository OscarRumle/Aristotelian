<!-- generated-by: gsd-doc-writer -->
# Architecture

Aristotelian is a browser-based React application for creating fictional worlds and generating characters using Aristotle's dramatic framework (Goodness, Appropriateness, Likeness to Truth, Consistency, and Hamartia). Users define a world, then generate characters within it via the Anthropic API. All state persists locally in `localStorage` using a versioned storage schema.

---

## System Overview

The application runs entirely in the browser. There is no backend server beyond the Vite dev proxy, which forwards Anthropic API calls to avoid exposing the API key in the browser at development time. In production the API key must be injected at the proxy or deployment layer. The primary data flow is:

1. User creates a World (name, description, genre, inspirations)
2. User configures character inputs (role, style, seed pitch)
3. The app builds a prompt via `src/prompts/build.js` and streams the response from `claude-sonnet-4-6` through `src/api/claude.js`
4. The streaming JSON is parsed in real time to advance the `GeneratingOverlay` phase display
5. The completed character JSON is stored in the active world's `characters` array and persisted to `localStorage`

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│                                                             │
│  main.jsx → Root.jsx                                        │
│               │                                             │
│               ├── GlobalNav  (theme, route links)           │
│               │                                             │
│               ├── LandingPage / PlansPage  (public pages)   │
│               │                                             │
│               └── App.jsx  (all world + character state)    │
│                     │                                       │
│                     ├── WorldHub / WorldDetail              │
│                     │     └── tabs: Characters, Scenes,     │
│                     │           Objects, Factions,          │
│                     │           Locations, Lore             │
│                     │                                       │
│                     ├── CreateWorldScreen / CreateWorldAdv  │
│                     │                                       │
│                     ├── CreateCharacterScreen               │
│                     │     └── prompts/build.js              │
│                     │           └── api/claude.js  ────────►│ Anthropic API
│                     │                                       │
│                     ├── CharacterSheet  (tabs: overview,    │
│                     │     psychology, dialogue, etc.)       │
│                     │     └── CharField (per-field regen)   │
│                     │                                       │
│                     ├── SceneDetail / DialogueWriter        │
│                     │                                       │
│                     ├── ObjectDetail / FactionDetail        │
│                     │     / LocationDetail / LoreExpand     │
│                     │                                       │
│                     └── GeneratingOverlay  (streaming UI)   │
│                           └── useGeneratingProgress         │
│                                                             │
│  storage.js  ←──────── App.jsx (auto-save on worlds change) │
│  (localStorage)                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Character generation (primary flow)

1. `CreateCharacterScreen` collects user inputs (role, style, pitch, optional seed fields).
2. On submit, `App.jsx` calls `handleStartGenerating`, creating a new `AbortController` and setting `generating = true`.
3. `buildPrompt(world, existingChars, inputs, targetLead)` in `src/prompts/build.js` assembles the full system prompt: world context → existing cast → role instruction → style instruction → Aristotle framework → user seed → JSON schema.
4. `callClaudeStreaming` in `src/api/claude.js` opens an SSE stream to `/api/anthropic/v1/messages` (proxied to `https://api.anthropic.com`). Each chunk is decoded from the SSE envelope and accumulated.
5. Each chunk triggers `onChunk(accumulated)` back in `App.jsx`, which sets `genAccumulated`.
6. `useGeneratingProgress(generating, genAccumulated)` watches for `PHASES[i].streamMarker` substrings in the accumulated text and advances the overlay phase after a minimum of `MIN_PHASE_MS = 4000ms`.
7. On stream completion, `handleGenerated(char)` appends the parsed character to the active world and navigates to the `CharacterSheet` view.

### Storage persistence

`App.jsx` runs a `useEffect` on `worlds` that calls `saveWorlds(worlds)` on every state change. `storage.js` wraps `localStorage` with a versioned envelope `{ __version: 8, worlds: [...] }`. A `migrate()` function handles all previous schema versions (v2 through v8) on load.

### Reference network

Prose fields across all entity types (characters, objects, factions, locations, lore) support `[[Entity Name|type]]` markup. `src/utils/referenceParser.js` parses these tags into typed segments. `src/utils/backlinks.js` scans all entities at render time to build a reverse-reference (backlink) list for the currently viewed entity. No backlink data is persisted — it is always computed fresh.

---

## Key Abstractions

| Abstraction | File | Purpose |
|---|---|---|
| `PHASES` | `src/constants.js` | 6 streaming phases with `streamMarker` and animated `verbs`. Drive the overlay UI. |
| `CHARACTER_SCHEMA` | `src/prompts/schema.js` | The JSON schema string injected into every character generation prompt. Single source of truth for character fields. |
| `ROLE_INSTRUCTIONS` | `src/prompts/schema.js` | Per-role prompt instructions (Lead, Deuteragonist, Supporting, Minor, Ensemble). |
| `STYLE_INSTRUCTIONS` | `src/prompts/schema.js` | Per-style prompt instructions (Tragic, Comic, Mixed) including full comic type taxonomy. |
| `callClaudeStreaming` | `src/api/claude.js` | SSE streaming wrapper. Decodes Anthropic event stream, accumulates text, tracks token usage. |
| `callClaude` | `src/api/claude.js` | Non-streaming wrapper for expand, regen, analysis, and dialogue calls. |
| `useGeneratingProgress` | `src/hooks/useGeneratingProgress.js` | Drives overlay animation by scanning the live accumulated JSON for phase markers. |
| `useRoute` | `src/hooks/useRoute.js` | Hash-based routing (no router library). Exposes `route` and `navigate`. |
| `migrate` | `src/storage.js` | Forward-migrates stored world data across schema versions v2–v8. |
| `parseReferences` | `src/utils/referenceParser.js` | Parses `[[Name|type]]` markup into typed segments for the reference network. |
| `computeBacklinks` | `src/utils/backlinks.js` | Scans all world entities at render time to find references pointing at a given entity. |

---

## Directory Structure Rationale

```
src/
├── App.jsx              — Root component; owns all application state
├── Root.jsx             — Entry wrapper: auth gate, theme provider, top-level routing
├── main.jsx             — Vite entry point (mounts Root)
├── landing.jsx          — Separate entry for the landing page HTML
├── constants.js         — PHASES, PHIL tooltips, ROLE_OPTIONS, STYLE_OPTIONS,
│                          entity type options. Hardcoded framework content.
├── storage.js           — localStorage wrapper with schema versioning + migration
├── util.js              — Shared helpers (role classification, JSON extraction)
├── styles.css           — All CSS; organized by component, four-level color token system
│
├── api/
│   └── claude.js        — Anthropic API calls: streaming and non-streaming, token tracking
│
├── components/          — All React UI components (views, overlays, shared widgets)
│
├── context/
│   └── AuthContext.jsx  — Auth state and login modal
│
├── hooks/
│   ├── useGeneratingProgress.js  — Phase animation during streaming
│   ├── useMentionInput.js        — @mention autocomplete input behavior
│   ├── useRoute.js               — Hash-based navigation
│   └── useTheme.js               — Dark/light theme toggle
│
├── pages/
│   ├── LandingPage.jsx  — Public landing page
│   └── PlansPage.jsx    — Pricing/plans page
│
├── prompts/             — LLM prompt builders (one function per prompt type)
│
└── utils/
    ├── backlinks.js      — Reverse-reference computation for the reference network
    ├── entityContext.js  — Shared entity context helpers
    └── referenceParser.js — [[...]] markup parsing and entity resolution
```

### `components/` layout

The `components/` directory contains all views and shared widgets. Major view components follow the naming convention `{Entity}Detail.jsx` for entity detail pages and `Create{Entity}Screen.jsx` for creation flows. Shared primitives include `CharField.jsx` (an editable field with per-field regeneration), `RichText.jsx` (renders `[[...]]` reference markup), `MentionAutocomplete.jsx` (the `@mention` input overlay), and `AssociationsPanel.jsx` / `ReferencedIn.jsx` (the reference network UI).

### `prompts/` layout

Each file exports a single `build*` function. `build.js` handles the main character generation prompt. Other files handle expand (filling partial characters), regen (single-field replacement), cast analysis, dialogue generation, world-building interview, and lore document generation. The character JSON schema in `schema.js` is shared by `build.js`, `expand.js`, and `regen.js`.

---

## Vite Proxy

During development, all requests to `/api/anthropic/*` are proxied to `https://api.anthropic.com` with the `x-api-key` and `anthropic-version` headers injected from environment variables (`ANTHROPIC_API_KEY`, `ANTHROPIC_VERSION`). The model used for all generation is `claude-sonnet-4-6`.

```
ANTHROPIC_API_KEY=...   # required — set in .env
ANTHROPIC_VERSION=...   # optional — defaults to "2023-06-01"
```

In production, the proxy must be replicated at the hosting layer, or the API calls must be routed through a server that injects the key. <!-- VERIFY: production API proxy configuration -->
