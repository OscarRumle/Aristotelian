# /Learn — Session Skill Reflection

You are doing a reflective pass over this session to decide whether anything worth capturing as a reusable skill was discovered or developed.

## What to do

### Step 1: Reconstruct what happened

Scan the conversation history and any files touched. Build a mental model of:
- What problem was being solved
- What approach was taken
- What worked, what didn't, and what the winning move was
- Whether any non-obvious technique, pattern, or workflow emerged

### Step 2: Apply the skill test

Ask yourself these questions honestly:

1. **Is this reusable?** Would this pattern apply to future work on this project, or is it totally one-off?
2. **Is it non-obvious?** Would the next Claude instance know to do this without being told, or would it likely default to a worse approach?
3. **Is it Claude-actionable?** Can this be written as instructions Claude can follow, not just general knowledge?
4. **Does it save real time or quality?** Would having this skill prevent mistakes or wasted effort?

If the answer to most of these is yes → write a skill. If not → say so and stop.

### Step 3a: If no skill is warranted

Say clearly:
> Nothing skill-worthy this session. [1-2 sentence reason.]

Don't pad it. Don't suggest vague future possibilities.

### Step 3b: If a skill is warranted

Draft a SKILL.md and save it to:
```
.claude/skills/<skill-name>/SKILL.md
```

Use this format:

```markdown
---
name: skill-name
description: [Trigger description — when should Claude use this? Be specific. Include context cues that would appear in a real prompt.]
---

# [Skill Title]

[1-2 sentence summary of what this skill does and why it exists.]

## When to use this

[Specific conditions. What user request or project state triggers this? What are the near-miss cases that should NOT trigger it?]

## How to do it

[Step-by-step instructions. Be concrete. Include commands, patterns, file locations specific to this project if relevant.]

## Why this works

[Brief explanation of the insight — what naive approach does this replace and why is this better?]

## Example

[One concrete example: input → output or before → after. Keep it tight.]

## Pitfalls

[What goes wrong if you don't follow this? What edge cases to watch for?]
```

### Step 4: Report

Tell the user:
- What you decided (skill or no skill)
- If a skill: the file path, skill name, and a one-line summary of what it captures
- If a skill: ask if they want to adjust anything before treating it as final

## Tone

Be honest and direct. Don't write a skill just to seem productive. A false positive (writing a useless skill) is worse than a false negative — it pollutes the skills directory and wastes future context.
