<!-- generated-by: gsd-doc-writer -->
# Aristotelian

A creative tool for writers, game designers, and storytellers that uses Aristotle's Poetics to generate psychologically coherent, dramatically compelling characters.

## What it does

Most character creation tools are descriptive — appearance, backstory, personality traits. Aristotelian is structural. It asks what a character does under pressure, what their fatal flaw is, and what the logic of their choices reveals about who they are.

Characters are generated inside **Worlds** — named fictional settings that provide context, tone, and constraints. You define the world, pitch a character concept, and the app processes your ideas through Aristotle's four requirements (Goodness, Appropriateness, Likeness to Truth, Consistency) plus **Hamartia** — the fatal error that emerges from the character's greatest strength.

The result is a full character sheet covering identity, psychology, Aristotelian analysis, and dialogue voice — all coherent with your world's logic.

## Prerequisites

- Node.js >= 18
- An Anthropic API key

## Installation

```bash
git clone <repository-url>
cd aristotelian
npm install
```

## Quick start

1. Copy your Anthropic API key — you will be prompted for it on first run.
2. Start the development server:

```bash
npm run dev
```

3. Open the URL shown in your terminal (default: `http://localhost:5173`).
4. Create a World, then generate your first Character.

## Usage

**Create a World**

Give your setting a name and description. The world provides the tonal and narrative constraints the AI uses when generating characters. Use the Advanced interview flow for richer, more detailed world-building.

**Generate a Character**

From a world, pitch a character concept — a sentence or a few notes. Select a dramatic role (Lead, Deuteragonist, Supporting, Minor, Ensemble) and style (Tragic, Comic, Mixed). The app streams a full character sheet through six generation phases.

**Review and edit**

The character sheet has four tabs: Identity, Psychology, Aristotelian analysis, and Dialogue. Every field can be regenerated individually. The Aristotelian tab surfaces the four Poetics requirements and the character's hamartia.

**Cast analysis**

With multiple characters in a world, run Cast Analysis to surface ensemble dynamics and hamartia collisions across the full roster.

**Dialogue**

Pick two characters and generate a scripted dialogue scene — voices are grounded in each character's speech mode (Ethos, Pathos, Logos) as defined by Aristotle's rhetoric.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

## Philosophy

The Aristotelian framework comes from five reference guides in `docs/philosophy/`:

- `Aristotle_Character_Guide.md` — Four requirements + Hamartia theory
- `Aristotle_Role_Guide.md` — Structural function of each dramatic role
- `Aristotle_Style_Guide.md` — How style frames the hamartia's consequences
- `Aristotle_Dialogue_Guide.md` — Speech modes: Ethos, Pathos, Logos
- `Aristotle_Comedy_Guide.md` — Six comic types and gap theory
- `Aristotle_World_Guide.md` — World-building as character generator

## Stack

- React 18 + Vite
- Anthropic API (`claude-sonnet-4-20250514`), called directly from the browser
- `window.storage` for session persistence
- No external UI libraries
