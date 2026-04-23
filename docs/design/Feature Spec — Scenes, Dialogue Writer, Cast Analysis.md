# Feature Spec: Scenes, Dialogue Writer & Cast Analysis

**Status:** Draft  
**Date:** 2026-04-23  
**Scope:** Three interconnected features. Scene is the container. Dialogue Writer is the first thing that lives in it. Cast Analysis is a separate World-level tool.

---

## 1. Scene System

### What it is

A Scene is a named folder that lives inside a World, alongside the Characters list. It holds creative work product — dialogues first, other elements later (notes, conflict maps, reversal plans, etc.).

### Navigation hierarchy

```
World
├── Characters tab   (existing)
└── Scenes tab       (new)
    └── Scene: "The Tavern Confrontation"
        ├── Dialogue: "First meeting"
        └── Dialogue: "The betrayal"
```

### Scene creation

- Button: **+ New Scene** in the Scenes tab
- Required: scene name (free text)
- Optional: brief description / setup note
- Scene card in the list shows: name, description snippet, count of dialogues inside

### Scene card UI

Similar visual language to Character cards. Clicking opens the scene. Inside a scene, a tab bar shows **Dialogues** (and later other content types as they're built).

---

## 2. Dialogue Writer

### Entry point

Inside a scene: **+ New Dialogue** button.

---

### Step 1 — Character Selection

A modal/panel with:

- Character list grouped under role-type headers: **Lead**, **Deuteragonist**, **Supporting**, **Minor**, **Ensemble**
- Each character shows name + one-line summary
- Minimum 2 characters required; no hard maximum (practical limit ~5)
- A separate section below the cast list: **World characters available for mention** — shows all characters in the world not selected as participants. These are not speakers; they exist so the LLM knows it can reference them naturally in dialogue (e.g. the hero and his friend discussing the villain).

---

### Step 2 — Pitch & Options

Below the character selection:

**Pitch field** (large textarea)
> *What's this scene about? What do you imagine happening? Any context, conflict, tone, or specific beats you want.*

**Options row:**
- **Mood:** `Tense` · `Playful` · `Aftermath` · `First Meeting` (pill selector, single-select)
- **Hamartia drive toggle:** `Let hamartias collide` — when on, the LLM is instructed to make each character's core flaw structurally active in this exchange. This is the tool's core thesis; it should be prominent.
- **Length:** Short (6–10 exchanges) — default, not exposed as a setting for now

**Generate button** → opens the Dialogue View.

---

### Step 3 — Dialogue View

#### Layout

Two-tab view inside the scene:

- **Dialogue tab** — the chat UI
- **Analysis tab** — dramatic summary (generated alongside dialogue, revealed when tab is clicked)

#### Chat UI — Dialogue tab

iMessage/WhatsApp style. Rounded bubbles. Character name + color chip above each bubble.

**Alternation rule:** Lines alternate left/right regardless of who is speaking. The visual rhythm of left/right creates the feel of a real exchange even with 3+ characters.

**Character colors:** Auto-assigned from a predefined dramatic palette on first use. User can click a character's color chip to change it. Colors persist per character across all scenes in the world.

**Stage directions:** Always generated. Rendered between dialogue bubbles in italics, neutral/muted color, no bubble — just inline text. e.g. *She doesn't answer. Picks up her glass.*

**Streaming:** Text rolls in line by line. Each line streams character by character (typewriter effect). Stage directions appear at natural pause points. The generation should feel like watching it happen, not like content loading.

**Non-present characters:** The LLM is always given the full world cast and told these characters may be referenced or discussed naturally. No special UI needed — it's a prompt-layer concern.

---

#### Direction & Controls bar (bottom of Dialogue tab)

**Direction field** — free text input. Placeholder: *Give direction...*

**Target dropdown** — who the direction applies to:
- `@everyone` (default)
- `@[CharacterName]` — one entry per character in the scene

Direction examples a user might write:
- *@everyone — slow this down, let the silence breathe*
- *@Mira — she's about to break. Push her closer to it*
- *@everyone — more subtext. They're not saying what they mean*

**Action buttons:**
- **Regenerate** — same pitch + options + any direction entered, generates a fresh take from the top
- **Continue** — picks up from the last line and generates more exchanges (direction applies)
- **Clear** — wipes the dialogue, returns to blank with pitch/options intact

**Save** — saves the dialogue to the scene. Dialogue gets a name (auto-generated from first line, user can rename). Multiple saved dialogues can exist in one scene.

---

### Analysis tab

Generated in parallel with the dialogue (or immediately after). Contains:

**What shifted** — a brief dramatic analysis of the exchange:
- Who held power at the start vs. end
- What was revealed vs. deliberately concealed
- How each character's hamartia was active (or dormant, and why that's notable)
- What the exchange cost each character, even if invisibly

This is not a summary of events. It's a structural read of what the scene did dramatically. Keep it sharp — 150–250 words.

---

## 3. Cast Analysis

### What it is

A World-level tool that reads the existing character ensemble and gives the writer a structural diagnosis.

### Entry point

A button in the Characters tab: **Analyse Cast** — visible once 2+ characters exist in the world.

### What it generates

A structured report covering:

**Dramatic function map**
Who serves what function in the ensemble. Not roles (Lead/Supporting) but dramatic purpose: who creates pressure on the lead, who reflects them, who exists to be deceived, who carries the theme. Flags if two characters are doing the same job.

**Hamartia collision map**
Which hamartias interact, and how. Does Character A's flaw activate Character B's? Are any hamartias isolated — powerful in theory but with no one in the cast to collide with? Are any hamartias redundant (two characters with structurally similar errors)?

**What's missing**
Based on the world description and existing cast, what dramatic function is absent? e.g. *There's no character positioned to witness the lead's reversal and carry its meaning forward.* Or: *The lead has no one to love — the world has antagonism and loyalty but no genuine tenderness, which limits the cost of the hamartia.*

**Thematic coherence**
What theme the ensemble is collectively exploring — stated or implied. Whether it's coherent or pulling in conflicting directions.

### Output format

Displayed in a panel or modal — not a chat message. Clean structured sections. Not a character card; more like a director's notes document.

### Tone

Honest and specific. The analysis should feel like a dramaturg talking to a writer, not a grammar checker flagging issues. It says what would make the story stronger, not just what's present.

---

## Open questions / future

- **Scene mood/location field** — a brief physical/contextual grounding for the scene (e.g. *a crowded marketplace, neither character can speak freely*). Would influence both dialogue generation and stage directions.
- **Export** — plain text clipboard copy of a saved dialogue. Low priority but obvious eventual need.
- **Scene notes** — a freeform text area inside a scene, separate from dialogues. For the writer's own thinking.
- **Reversal/recognition planner** — generate the specific moment of peripeteia and anagnorisis for a Lead character. Natural fit as a Scene content type once Scene infrastructure exists.
- **Conflict map** — visual graph of hamartia relationships across the cast. Companion to Cast Analysis.
