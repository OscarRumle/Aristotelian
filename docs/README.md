# Docs — Aristotle Character Forge

Navigation index for everything in this folder. Read `docs/backlog/BACKLOG_01.md` and `../CLAUDE.md` first if you're new to the project.

---

## Root-level files (not in docs/)

| File | Purpose |
|---|---|
| `CLAUDE.md` | **Start here.** Full codebase context for Claude Code. Architecture, key constants, prompt system, what not to touch. |
| `aristotelian-3.jsx` | Original single-file artifact. Read-only reference. Do not edit. |
| `src/` | The actual web app (Vite + React). This is what gets built and run. |

---

## This folder

### `backlog/BACKLOG_01.md`
All open bugs, polish tasks, and feature requests with enough implementation detail for Claude Code to act on them directly. **This is the work queue.**

### `Design Doc.md`
Full product spec: all screens, all fields, generation flow, data model. Good reference when implementing new features or checking intended behaviour.

### `design/`
Detailed feature specs for larger features. Read these before implementing anything non-trivial.

| File | Contents |
|---|---|
| `world-building-advanced.md` | Full spec for Advanced World Building — inputs, AI interview, topic docs, Aristotelian framework |

### `philosophy/`
The Aristotle guides. These are the theoretical source of truth that the prompt system is based on. The content is condensed and hardcoded into the JSX / prompt modules — the guides are reference, not runtime.

| File | Contents |
|---|---|
| `Aristotle_World_Guide.md` | **World-building framework** — Mimesis, Probability & Necessity, The Polis, World Hamartia, Telos, Unity, The World as Character Generator. The LLM interview is based on this. |
| `Aristotle_Character_Guide.md` | Four requirements (Goodness, Appropriateness, Likeness to Truth, Consistency) + Hamartia theory |
| `Aristotle_Role_Guide.md` | Lead / Deuteragonist / Supporting / Minor / Ensemble — structural function of each role |
| `Aristotle_Style_Guide.md` | Tragic / Comic / Mixed — how style frames the hamartia's consequences |
| `Aristotle_Dialogue_Guide.md` | Speech modes: Ethos, Pathos, Logos. Subtext and voice. |
| `Aristotle_Comedy_Guide.md` | Six comic types, gap theory, affectionate vs. contemptuous framing |

