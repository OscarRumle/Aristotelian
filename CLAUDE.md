# Aristotelian — Claude Code Context

Users create **Worlds** (named fictional settings), then generate **Characters** within them. Each character is built using Aristotle's four requirements (Goodness, Appropriateness, Likeness to Truth, Consistency) plus Hamartia — the fatal error that emerges from the character's greatest strength.

---

## Navigation — start here

| I need to... | Go to |
|---|---|
| Work on any UI component | [src/CLAUDE.md](src/CLAUDE.md) → [src/components/CLAUDE.md](src/components/CLAUDE.md) |
| Change a prompt / AI output | [src/CLAUDE.md](src/CLAUDE.md) → [src/prompts/CLAUDE.md](src/prompts/CLAUDE.md) |
| Fix streaming / overlay animation | [src/CLAUDE.md](src/CLAUDE.md) → [src/hooks/CLAUDE.md](src/hooks/CLAUDE.md) |
| Change world or character state logic | `src/App.jsx` — state mutations live here |
| Add or change CSS | `src/styles.css` — search for the component's CSS class prefix |
| Understand the Aristotle framework | `docs/philosophy/` — 5 guides |
| See open bugs and features | `docs/backlog/BACKLOG_01.md` |
| Understand a planned feature | `docs/design/` — feature specs |

---

## Stack

- **React + Vite** — multi-file component architecture in `src/`
- **Anthropic API** — `claude-sonnet-4-20250514`, called directly from the browser via fetch
- **window.storage** — persistence layer (NOT localStorage — artifact runtime requires window.storage)
- **No external libraries** — useState/useEffect/useRef only

---

## Key constants — where things live

| Constant | File | What it is |
|---|---|---|
| `PHASES` | `src/constants.js` | 6 generation phases, each with streamMarker + verbs for overlay |
| `PHIL` | `src/constants.js` | Philosophy tooltip strings shown on [?] clicks |
| `ROLE_OPTIONS` | `src/constants.js` | Lead / Deuteragonist / Supporting / Minor / Ensemble |
| `STYLE_OPTIONS` | `src/constants.js` | Tragic / Comic / Mixed |
| `STORAGE_KEY` | `src/storage.js` | `"aristotelian-worlds-v2"` — bump if schema changes |
| Character JSON schema | `src/prompts/schema.js` | Full field list returned by the LLM |

---

## State mutations (all in `src/App.jsx`)

- `addWorld(w)` — appends to worlds array
- `addCharacter(c)` — appends to active world's characters
- `updateCharacter(c)` — replaces character by id in active world

Key navigation state:
- `activeCharTab` / `setActiveCharTab` — controlled tab for CharacterSheet (passed as `charTab` + `onTabChange` props). Resets to `"overview"` via `useEffect` whenever `activeCharId` changes. **Do not add local tab state to CharacterSheet — it lives in App.jsx.**

All use immutable `.map()` patterns. No external state library.

---

## CSS design system — color tokens

`src/styles.css` uses a four-level text color hierarchy. **Never use `--faint` for readable interactive text** — it fails WCAG AA contrast (~2.1:1).

| Token | Use for |
|---|---|
| `--dark` | Headings, primary content, active states |
| `--label` | Interactive labels, tabs, back buttons, field labels, nav links, card CTAs |
| `--muted` | Secondary body text, descriptions, role lines |
| `--faint` | Decorative only — dividers, placeholders, ambient rules |

Dark mode equivalent for `--label` is `--dk-muted`. See `.claude/skills/accessibility-token-hierarchy/SKILL.md` for full details.

---

## What NOT to do

- Don't add a routing library — `useRoute.js` handles navigation intentionally
- Don't switch from `window.storage` to localStorage
- Don't change `STORAGE_KEY` without bumping the version string (breaks existing user data)
- Don't remove `MIN_PHASE_MS = 4000` — it makes the overlay legible, not just fast
- Don't split src/ files into a monorepo or add a bundler without discussion
- Don't use `--faint` for any text the user must read — use `--label` instead
- Don't add local `tab` state to `CharacterSheet` — tab state lives in `App.jsx` as `activeCharTab`

---

## What to work on next

1. **Comic generation** — `src/prompts/build.js` comic style instruction is thin; `docs/philosophy/Aristotle_Comedy_Guide.md` has the full framework to inject
2. **Export** — PDF character sheet / markdown clipboard copy
3. **Scene generation** — two characters + world → dramatic scene with hamartias in collision
4. **Doc-driven prompts** — build script to regenerate PHIL + role/style instructions from the philosophy guides
