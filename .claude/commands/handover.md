# /handover — Session Handover Document

Write a handover document for the current session. The audience is the next Claude Code instance picking up this project cold. It should be able to read this document and be fully oriented without reading any other files first.

## Save location

Save the document to:
```
HANDOVER.md
```
(in the project root — overwrite the previous one, this is always the current handover)

## What to include

Write in dense, structured prose. No fluff. Every sentence should carry information a new Claude instance needs.

---

### 1. Project snapshot (2-3 sentences)

What is this project? What does it do? What's the tech stack? Don't explain Aristotle or philosophy — explain the software.

### 2. What we did this session

Chronological summary of what was worked on. Be specific:
- What feature or problem was the focus
- What files were touched and how
- What decisions were made and why (especially non-obvious ones)
- What approaches were tried and abandoned, and why

If multiple things were done, use a brief numbered list.

### 3. Current state

Where things stand right now:
- What's working
- What's incomplete or broken
- Any known bugs, regressions, or rough edges introduced this session
- State of any in-progress work that wasn't finished

Be honest. Don't hide problems.

### 4. Critical context

Things the next Claude needs to know that aren't obvious from reading the code:
- Architectural decisions that constrain future work
- Why something was done a non-obvious way
- Known traps or gotchas in this codebase
- Constraints (no routing library, window.storage not localStorage, single-file architecture, etc.)
- Any user preferences or style decisions that should be preserved

### 5. Next steps

What should be done next, in priority order. Be specific:
- Name the feature, bug, or task
- Note where in the codebase to start
- If there's a clear implementation direction, sketch it briefly

### 6. Open questions

Decisions that are unresolved or that the user hasn't weighed in on yet. Things to ask about or investigate before proceeding.

---

## Format rules

- Write for Claude, not for humans. Dense is good. Skip pleasantries.
- Use headers and short paragraphs. No bullet walls.
- Include file names and function names wherever they're relevant.
- If referencing a key function or constant, name it exactly as it appears in code.
- Keep the whole document under 600 lines. If it's getting long, compress — don't pad.
- Start the document with the date and session summary in a single line, e.g.:
  `**Handover — 2026-04-22 | Session: [one-line description of what this session focused on]**`

## After saving

Tell the user:
- The file was saved
- One-sentence summary of what the handover captures
- Offer to add anything they think is missing
