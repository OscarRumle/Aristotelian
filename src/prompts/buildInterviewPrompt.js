export function buildInterviewPrompt(world, extendedInputs, existingDocs, count) {
  const gapCount = Math.ceil(count / 3);
  const aristCount = count - gapCount;

  const inputsBlock =
    extendedInputs
      ? Object.entries(extendedInputs)
          .filter(([, v]) => v?.trim?.())
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n") || "None provided."
      : "None provided.";

  const existingBlock =
    existingDocs && existingDocs.length > 0
      ? `\nEXISTING WORLD DOCUMENTS (already covered — do not repeat this ground):\n${existingDocs
          .filter((d) => d.title !== "Interview Transcript")
          .map((d) => `--- ${d.title} ---\n${d.content}`)
          .join("\n\n")}`
      : "";

  return `You are an expert in Aristotelian dramatic theory conducting a world-building interview.

WORLD: ${world.name}
${world.description}

ADDITIONAL INPUTS:
${inputsBlock}${existingBlock}

Generate exactly ${count} interview questions about this world. Structure them in two phases:

PHASE 1 — GAP FILLING (${gapCount} question${gapCount !== 1 ? "s" : ""}):
Identify what is underspecified or missing given the inputs above. Ask targeted questions about gaps in the world's logic, society, or rules — specific to THIS world, not generic.

PHASE 2 — ARISTOTELIAN PRESSURE (${aristCount} question${aristCount !== 1 ? "s" : ""}):
Apply Aristotle's five analytical lenses to deepen what exists. Use each lens at least once across the ${aristCount} questions:
- mimesis: Does the world's internal logic hold? What rules must apply universally, including to protagonists?
- necessity: What events are inevitable given this world's structure? What is already in motion?
- polis: Who holds power and how? What does this society reward and punish? What is justice here?
- world_hamartia: What is the world's structural flaw or contradiction — two legitimate goods in irresolvable conflict?
- possible: What kinds of stories can happen here? What is structurally impossible even if you wanted it?

For EACH question:
- Write a plain English question targeting the specific gap or lens
- Write THREE answer options (A, B, C): brief label + 1-2 sentence dramatic explanation
- Mark exactly ONE option as "recommended: true" — Aristotle's pick: the choice that best serves dramatic structure and internal world coherence. Not the most common choice. The structurally strongest one.

Return ONLY valid JSON. No preamble. No markdown fences.
{"questions":[{"question":"","phase":"gap","lens":null,"options":[{"key":"A","text":"","subtext":"","recommended":false},{"key":"B","text":"","subtext":"","recommended":true},{"key":"C","text":"","subtext":"","recommended":false}]}]}`;
}
