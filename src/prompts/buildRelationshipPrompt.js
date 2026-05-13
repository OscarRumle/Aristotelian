// Builds the system prompt for Relationship Web connection generation.
// The connection must be grounded in how each character's hamartia engages
// with the other's — not in their biography. Aristotelian framing.

function characterBlock(c, label) {
  const lines = [`${label}: ${c.name} (${c.role || "character"})`];
  if (c.hamartia) {
    lines.push(`Hamartia: ${c.hamartia}`);
  } else {
    if (c.personality) lines.push(`Personality: ${c.personality}`);
    const summary = Array.isArray(c.summary) ? c.summary[0] : c.summary;
    if (summary) lines.push(`Summary: ${summary}`);
  }
  if (c.moralCore) lines.push(`Moral core: ${c.moralCore}`);
  return lines.join("\n");
}

export function buildRelationshipPrompt(world, charA, charB, type, direction) {
  const a = characterBlock(charA, "CHARACTER A");
  const b = characterBlock(charB, "CHARACTER B");

  const directionLine = type.directional
    ? direction === "b_to_a"
      ? `DIRECTION: ${charB.name} → ${charA.name}`
      : `DIRECTION: ${charA.name} → ${charB.name}`
    : `DIRECTION: bidirectional`;

  const directionPayload = type.directional ? (direction || "a_to_b") : "bidirectional";

  const missingHamartia = !charA.hamartia || !charB.hamartia
    ? `\nNOTE: At least one of these characters has no hamartia set yet. Lean on the other character's hamartia and the available personality/summary fields. Keep the connection plausible and dramatically active without inventing major new biography.`
    : "";

  return `You are a dramatic analyst trained in Aristotle's Poetics.

WORLD: ${world.name}
${world.description || ""}

${a}

${b}

CONNECTION TYPE: ${type.label} — ${type.description}
${directionLine}${missingHamartia}

INSTRUCTIONS
- The description must be grounded in BOTH characters' hamartias — how those specific flaws engage. The connection lives in the present interaction, not in backstory.
- The connection must be dramatically useful, not merely descriptive. It should be something a writer could put on stage.
- The note is one Aristotelian sentence: why this connection matters to the story. Treat it like a stage direction for the reader.
- The title is a short, vivid phrase — 2–6 words, not a full sentence. No quotation marks.
- The description is 2–3 sentences. Concrete. No throat-clearing.

OUTPUT
Return ONLY valid JSON. No preamble, no markdown fences, no commentary.
{"type":"${type.id}","direction":"${directionPayload}","title":"","description":"","note":""}
`;
}
