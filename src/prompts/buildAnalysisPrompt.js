/**
 * Build the prompt for post-dialogue structural analysis.
 * Non-streaming — returns a plain-text prose paragraph.
 */
export function buildAnalysisPrompt(world, participants, pitch, lines) {
  const castBlock = participants
    .map((c) => `- ${c.name} (${c.role || "character"}): hamartia — ${c.hamartia || "unspecified"}`)
    .join("\n");

  const dialogueBlock = lines
    .map((l) =>
      l.type === "stage" ? l.text : `${l.speaker}: "${l.text}"`
    )
    .join("\n");

  return `You are a dramaturg. Analyze the following dramatic exchange through an Aristotelian structural lens.

Write 150–250 words of flowing prose (no headers, no bullet points) covering:
1. Who held dramatic power at the start vs. the end of the exchange
2. What each character revealed vs. deliberately concealed
3. How each character's hamartia was active — or, if dormant, why that's dramatically notable
4. What the exchange cost each character, even if invisibly

Be specific to this dialogue. Do not summarize events. Say what the scene did dramatically. The tone is a sharp, honest dramaturg — not a grammar checker.

World: ${world.name}

Characters:
${castBlock}

Pitch: ${pitch || "(none)"}

Dialogue:
${dialogueBlock}`;
}
