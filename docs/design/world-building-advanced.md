# Feature Spec — Advanced World Building
**Status:** Design complete, not yet implemented
**Added:** 2026-04-23

---

## Overview

The current World creation flow is a single pitch input. This feature adds an **Advanced mode** that takes richer inputs, runs a structured AI interview, and generates organized reference documents for the world. The interview is grounded in Aristotelian dramatic theory — not as decoration, but as the actual analytical framework guiding the questions.

Simple mode is unchanged.

---

## Two Modes Side by Side

| | Simple | Advanced |
|---|---|---|
| Entry | World name + pitch | World name + pitch + structured fields + file uploads |
| Interview | None | Short (5Q) or Long (20Q), user's choice |
| Output | World created with pitch as description | World created + set of topic documents |
| Who it's for | Quick worldbuilding, casual use | Writers/designers with existing lore or wanting serious depth |

---

## Advanced Mode — Full Flow

### Step 1: Basic Info (same as Simple)
- World name
- Pitch / short description

### Step 2: Extended Inputs
Optional structured fields. Each helps the LLM understand the world and generates better interview questions. Suggested fields:

- **Genre** — Fantasy / Sci-Fi / Historical / Contemporary / Horror / Mixed (pill select)
- **Tone** — Tragic / Comic / Mixed (reuse existing STYLE_OPTIONS)
- **Time period or era** — free text (e.g. "far future", "Renaissance-equivalent", "timeless")
- **Scale** — what's the scope? (A city / A nation / A world / A cosmos) — pill select
- **Existing IP or inspiration** — free text (e.g. "similar to Dune but underwater")
- **What makes this world distinctive** — free text, short

### Step 3: File Upload (optional)
User can upload existing lore documents, world bibles, maps, character sheets, images, or any reference material. The LLM ingests all of it before generating interview questions. Supported: text documents, PDFs, images.

Upload UI should feel lightweight — a dropzone, not a form. Label it: "Drop any existing lore, notes, or images."

### Step 4: Interview Length Choice
After inputs are submitted, a simple choice appears:

> "Ready to interview your world. How deep should we go?"
> - **Short** — 5 focused questions (~5 minutes)
> - **Long** — 20 questions, full diagnostic (~20 minutes)

No other options. User picks one, interview begins.

### Step 5: The AI Interview
Conversational, in-app. Not a form — a real exchange.

**Structure:** Two phases, run in sequence.

**Phase 1 — Gap Filling (⅓ of questions)**
Claude identifies what's underspecified given the inputs and uploaded content. If the user mentioned a theocracy but said nothing about religious structure, Claude asks about that. These questions are specific to what's missing — not generic.

**Phase 2 — Aristotelian Pressure (⅔ of questions)**
Claude applies Aristotelian analytical lenses to deepen what exists. Questions are drawn from these frameworks:

- **Mimesis** — Does the world's internal logic hold? Where are the rules that must be respected?
- **Probability and Necessity** — What events are inevitable given this world's structure? What could never happen?
- **Hamartia at world scale** — What is the world's structural flaw or contradiction? What seeds its own undoing?
- **The Polis** — Who holds power? What does this society reward and punish? What is justice in this world?
- **The Possible** — What kinds of stories can happen here? What's outside the range of possibility?

**Question format (every question):**
- A plain English question
- Three answer options (A, B, C)
- One option is marked **"Aristotle's pick"** — the choice that best serves dramatic structure and internal world coherence
- Always a free-text option: "Tell me in your own words"

The recommended option reflects classical dramatic logic — not what's most common, not what Claude thinks is coolest, but what Aristotle's framework would prescribe for a world that generates compelling stories and coherent characters.

**Example question:**
> Every world has a structural contradiction at its core — a tension that can never be fully resolved, only managed. In your world, what is it?
>
> **A** — The scarcity of a resource everyone needs (power, water, land, magic)
> **B** ⭐ *Aristotle's pick* — A fundamental conflict between two legitimate goods (freedom vs. order, tradition vs. progress, individual vs. collective) — no side is wrong, both are necessary
> **C** — An unjust hierarchy that benefits those at the top but damages everyone below

### Step 6: Output Generation
After the interview, the LLM synthesizes all inputs + interview answers into a set of named topic documents. These appear on the world page.

---

## World Page — Document Organization

Documents are generated from the interview and displayed as a clean document library on the world page. Not a single blob — separate named docs by topic.

**Standard document set** (generated as relevant — not all worlds need all of these):

| Document | Contains |
|---|---|
| **World Primer** | One-page summary of the world — what it is, tone, scale. Generated from the pitch + inputs. Always present. |
| **Power & Conflict** | Who rules, how power is held, what the structural tensions are, what the world's hamartia is |
| **Society & Culture** | Social hierarchy, values, what the community rewards and punishes, daily life |
| **History & Myth** | Origin story, key events, how the world got to where it is, what people believe about their past |
| **Geography & Setting** | Physical world, key locations, how space shapes society |
| **Rules of the World** | Magic systems, technology, physics, what's possible and impossible — the laws the world operates by |
| **Interview Transcript** | Full record of the interview Q&A, preserved for reference |

Not all documents are generated for every world — Claude only creates a doc if the interview produced enough content to fill it meaningfully. A Short (5Q) interview may only generate 2-3 docs. A Long (20Q) may generate the full set.

Documents are displayed on the world page as cards — title, short summary, click to read in full. The user can read them but cannot edit them in-app (editing is a future feature). They are the world's "lore bible."

---

## How World Docs Feed into Character Generation

This is the payoff. When generating a character in an Advanced world, the LLM receives not just the pitch but the full set of world documents as context. This means:

- A character's hamartia is shaped by the world's hamartia
- A character's psychology reflects the society's values and contradictions
- Dialogue and speech modes match the world's culture
- The "Likeness to Truth" Aristotelian requirement is evaluated against the world's established rules

Characters generated in an Advanced world should feel meaningfully different from characters generated in a Simple world. The world docs are the context.

---

## Implementation Notes

**Prompt architecture:**
The interview prompt needs:
1. World inputs (name, pitch, all structured fields)
2. Parsed content from uploaded files
3. Phase instruction (gap-fill or Aristotelian pressure)
4. Question count remaining

The recommended option labeling requires the LLM to generate answers *with* a designated "Aristotle's pick" — this should be in the JSON schema for each question. Something like:
```json
{
  "question": "...",
  "options": [
    { "key": "A", "text": "...", "subtext": "...", "recommended": false },
    { "key": "B", "text": "...", "subtext": "...", "recommended": true },
    { "key": "C", "text": "...", "subtext": "...", "recommended": false }
  ]
}
```

**State additions needed:**
- `world.mode: 'simple' | 'advanced'`
- `world.documents: [{ id, title, content, generatedAt }]`
- `world.interviews: [{ id, startedAt, length: 'short'|'long', transcript: [{ question, answer, phase }] }]`
- `world.uploadedFiles: [{ name, type, content }]`

**Storage:** Bump `STORAGE_KEY` version if world schema changes. Add migration.

**File upload:** The artifact/Vite environment may need a server-side route to handle file parsing — especially PDFs. Plan for this before implementing upload UI.

---

## What This Feature Is Not

- Not automatic — follow-up interviews are always user-initiated from the world page, never auto-triggered
- Not editable docs — documents are read-only in-app (editing is future scope)
- Not auto-triggered — the interview is always user-initiated, never automatic
- Not available in Simple mode — Simple mode stays exactly as it is

---

## Open Questions — Resolved

1. **File upload + PDF parsing** — Placeholder upload UI only for now. No PDF parsing needed yet. Implement the dropzone visually but don't build server-side parsing. Mark as future scope.

2. **Document length and content** — Generated docs should contain exactly and only what was provided: synthesized from uploaded file content + interview answers. No invented elaboration. If the user uploaded a lore doc and answered 5 questions, the output is a refined, organized version of exactly that material — nothing more. Document length follows naturally from the depth of input.

3. **Partial interviews** — Generate docs from whatever was answered. Don't block on incomplete interviews.

4. **Re-running the interview** — YES, users can run additional interview sessions from the world page at any time. Each follow-up interview reads the existing master world document and asks questions that haven't been covered yet — it should avoid repeating ground already in the doc. The follow-up interview is always Short (5Q) or Long (20Q), user's choice, same as the initial one. Update the spec's flow description and state model to reflect this: `world.interviews: []` (array of sessions, not a single transcript).
