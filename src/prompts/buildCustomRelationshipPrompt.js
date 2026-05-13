// Build the system prompt for the Custom relationship type's Refine and
// Expand paths. Takes the user's own description and either tightens it
// (refine) or deepens it with Aristotelian texture (expand).

function characterBlock(c, label) {
  const lines = [`${label}: ${c.name} (${c.role || "character"})`];
  if (c.hamartia) lines.push(`Hamartia: ${c.hamartia}`);
  if (c.moralCore) lines.push(`Moral core: ${c.moralCore}`);
  return lines.join("\n");
}

export function buildCustomRelationshipPrompt(world, charA, charB, userText, mode) {
  const refine = mode === "refine";

  const taskBlock = refine
    ? `TASK — REFINE
- Tighten and polish the user's text. Improve clarity, rhythm, and word choice.
- Keep the user's intent and voice. Do not invent new beats they did not write.
- Surface what is already there; do not add ideas they didn't include.
- 2–3 sentences in the description. Keep it concrete.
- The note is one Aristotelian sentence about why this connection is dramatically significant.`
    : `TASK — EXPAND
- Deepen the user's text. Add dramatic texture and engage more explicitly with each character's hamartia.
- Keep the user's intent and voice. Build on what they wrote — don't replace it.
- Make the dramatic stakes visible. What does this connection cost the story?
- 3–4 sentences in the description. Concrete, grounded in the present.
- The note is one Aristotelian sentence about why this connection is dramatically significant.`;

  return `You are a dramatic analyst trained in Aristotle's Poetics, helping a writer ${refine ? "polish" : "deepen"} a connection they wrote themselves.

WORLD: ${world.name}
${(world.description || "").slice(0, 600)}

${characterBlock(charA, "CHARACTER A")}

${characterBlock(charB, "CHARACTER B")}

USER'S CONNECTION (as written):
${userText.trim()}

${taskBlock}

OUTPUT
Return ONLY valid JSON. No preamble, no markdown fences, no commentary.

{"type":"custom","direction":"bidirectional","title":"","description":"","note":""}

- title: 2–6 words, vivid, no quotation marks.
- description: the ${refine ? "refined" : "expanded"} text.
- note: one Aristotelian sentence on dramatic significance.
`;
}
