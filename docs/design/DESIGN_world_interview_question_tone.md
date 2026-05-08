# Feature Spec: World Interview — Question & Option Tone

**Status:** Draft  
**Date:** 2026-05-08  
**Scope:** Redesigning how interview questions and A/B/C options are written. The Aristotelian framework stays fully visible — lens labels, phase indicators, and the "Aristotle's pick" badge all remain. What changes is the language: questions and options should be casual, direct, and punchy rather than academic and dense.

---

## The Problem

The current interview produces questions that read like philosophy seminar prompts. They front-load theoretical preamble before getting to the actual question, use academic vocabulary the user may not know, and frame everything as an intellectual test rather than a creative conversation. Here's a real example:

> *"Hamartia in a world is the point where two legitimate goods are in irresolvable conflict — not a villain versus a hero, but a genuine structural tragedy. In this world, survival requires belonging to something, but belonging to something requires accepting its violence. What is the specific form that contradiction takes?"*

The A/B/C options have the same problem — dense, thesis-style writing that makes reading them feel like work.

This is a prompt design problem. The `buildInterviewPrompt` instructs the LLM to write "plain English questions" but the surrounding context is so academically framed that the LLM can't help mirroring it.

---

## What Stays the Same

- **Lens labels** — each question still displays its lens (mimesis, necessity, polis, hamartia, possible) or phase (gap filling)
- **"★ Aristotle's pick"** badge on the recommended option
- **The Aristotelian analytical logic** — the *thinking* behind the questions remains rigorous. Only the surface language changes.
- **Question structure** — each question still has three options with a label and explanation
- **JSON schema** — no field changes; this is entirely a language/tone change

---

## The Target Voice

**Casual. Direct. World-specific. No preamble.**

The LLM is a sharp collaborator who has read everything about this world and wants to understand it better — not a professor testing the user's knowledge of dramatic theory. It speaks plainly and gets to the point fast.

The question should feel like something a smart, opinionated friend would ask after reading your world document. Not like a definition followed by a question.

**Tone markers:**
- Short sentences
- No definitions or theory explanations before the question itself
- Uses "you" and "your world" — personal, not abstract
- Can be a little provocative or unexpected, but not performatively edgy
- Contractions are fine ("what's", "who's", "doesn't")
- The question itself is the first thing — no lead-in paragraph

---

## Before & After Examples

These examples use a real question generated for a post-collapse world where survival depends on belonging to violent organisations.

---

### Hamartia question

**Before:**
> *Hamartia in a world is the point where two legitimate goods are in irresolvable conflict — not a villain versus a hero, but a genuine structural tragedy. In this world, survival requires belonging to something, but belonging to something requires accepting its violence. What is the specific form that contradiction takes?*

**After:**
> *In your world, you can't survive alone — you need to be part of something. But every group that keeps you safe has done things you'd rather not think about. Where does that tension actually show up?*

---

### Hamartia options (full before & after)

**Before:**

> **A — Loyalty Versus Conscience**
> The organizations that keep people safe also commit atrocities to do it. To belong is to be complicit. To refuse complicity is to be unprotected. There is no position outside this dilemma — even the civilians who claim neutrality benefit from the violence done on their behalf and know it.

> **B — Protection Versus Legibility** ★ Aristotle's pick
> To be protected you must be known — to an organization, a network, a community. But to be known is to be a target, to have a location, a weakness, a name someone can give up under pressure. The world's deepest flaw is that safety and invisibility are mutually exclusive, and every attempt to achieve both accelerates the destruction of one.

> **C — Memory Versus Function**
> The old world had laws, institutions, rights — and those things failed completely and catastrophically. The people who remember them are paralyzed by the gap between what was promised and what is. The people who never knew them are free to build something functional but brutal. Progress requires forgetting, and forgetting requires betraying everyone the old world made promises to.

**After:**

> **A — You Can't Be Clean and Protected**
> The people keeping you safe are the same people doing the atrocities. Staying in means being complicit. Getting out means being unprotected. There's no neutral — even bystanders benefit and know it.

> **B — Being Known Is a Vulnerability** ★ Aristotle's pick
> To be protected you need to be known — by a network, an organization, someone with reach. But being known means being findable. Your name, your location, your weaknesses are now on a list somewhere.

> **C — Progress Requires Betrayal**
> People who remember how things were supposed to work are stuck in it. People who grew up after the collapse are free to build something — but only because they never made the old promises. Moving forward means leaving the old world's debts behind.

---

### Polis question

**Before:**
> *In Aristotle's conception of the polis, power is not merely exercised but legitimated — it requires a story about why some people give orders and others follow them. In this world, who holds power, and what is the narrative that justifies their position?*

**After:**
> *Who actually runs things here — and what story do they tell to make that seem okay?*

---

### Mimesis question

**Before:**
> *Mimesis demands internal consistency: the rules of this world must apply universally, including to the protagonist. What rule in this world, if followed to its logical conclusion, would destroy the person the audience is meant to care about?*

**After:**
> *What's a rule in this world that applies to everyone — including the main character? What happens when they can't get out of it?*

---

## Rules for Question Writing

These should be added as explicit instructions in `buildInterviewPrompt`:

**Do:**
- Lead with the question — no preamble, no definition, no "In Aristotle's framework..."
- Make it specific to this world — use details from the world inputs, not generic placeholders
- Use casual, direct language — contractions, short sentences, conversational register
- Make it feel like curiosity, not examination
- One question per question — no multi-part questions separated by commas

**Don't:**
- Define the lens before asking the question (e.g. "Hamartia is the point where..." → just ask)
- Use academic vocabulary the user has to decode: "legitimated", "irresolvable", "structural coherence", "mimetic logic"
- Write long questions — if a question takes more than two sentences, it's too long
- Use passive voice
- Make the user feel like they're being tested

---

## Rules for Option Writing

**Label (the option title):**
- Short — two to five words
- Plain English — no theoretical terminology
- Describes the *situation or tension*, not the Aristotelian concept
- Examples: "Safety Means Being Known", "Loyalty Buys You In", "Memory as Paralysis"

**Explanation (the subtext):**
- Two sentences maximum
- Written in present tense, as a description of how this actually plays out in the world
- Specific — reads like it's about *this* world, not a general dramatic principle
- Conversational register — same tone as the question
- Does not explain why it's the "correct" dramatic choice — just describes the reality it represents

---

## Prompt Change Summary

The core change is adding a **tone instruction block** to `buildInterviewPrompt` and updating the per-question and per-option writing instructions. Specifically:

The current instruction reads:
> *"Write a plain English question targeting the specific gap or lens"*

This should be expanded to something like:
> *"Write the question in casual, direct language — no preamble, no theoretical definitions, no academic framing. Lead with the question itself. Make it specific to this world. Two sentences maximum. Sound like a smart collaborator who's curious, not a professor who's testing."*

And for options:
> *"Write the option label in plain English (2–5 words). Write the explanation in two sentences max, present tense, specific to this world, conversational register. Do not explain the Aristotelian significance — just describe what this choice means for the world."*

The lens labels and the "recommended" flag logic remain unchanged.

---

## Scope Notes

This change applies to both `buildInterviewPrompt.js` (main world creation interview) and `buildLoreInterviewPrompt.js` (lore expansion interview) — same problem, same fix.

The generated question text is stored in the interview transcript as-is, so this is a forward-only change. Existing worlds keep their existing question phrasing; new interviews get the new tone.
