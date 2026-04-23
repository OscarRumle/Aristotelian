export function buildDocumentsPrompt(world, extendedInputs, allInterviews) {
  const inputsBlock =
    extendedInputs
      ? Object.entries(extendedInputs)
          .filter(([, v]) => v?.trim?.())
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n") || "None provided."
      : "None provided.";

  const transcriptBlock = allInterviews
    .map((session, i) => {
      const label = session.length === "short" ? "5 questions" : "20 questions";
      const qas = session.transcript
        .map((t, j) => `Q${j + 1}: ${t.question}\nA: ${t.answer}`)
        .join("\n\n");
      return `--- Interview Session ${i + 1} (${label}) ---\n${qas}`;
    })
    .join("\n\n");

  return `You are synthesizing a world-building lore bible from interview transcripts.

WORLD: ${world.name}
PITCH: ${world.description}

INPUTS:
${inputsBlock}

INTERVIEW TRANSCRIPTS:
${transcriptBlock}

Generate named world documents from this material.

CRITICAL RULES:
- Include ONLY information that was actually provided in the inputs or interview answers
- Do NOT invent, embellish, or extrapolate beyond what was given
- If a topic was not discussed, do NOT generate a document for it (except World Primer and Interview Transcript, which are always present)
- Document length follows from content depth: a 5-question interview may produce 2–3 short documents

DOCUMENT TYPES — generate only those with sufficient content from the transcript:
- "World Primer": ALWAYS generate. One-page summary: what the world is, tone, scale, distinctive qualities. From pitch + inputs.
- "Power & Conflict": Who rules, how power is held, structural tensions, the world's hamartia.
- "Society & Culture": Social hierarchy, values, what the community rewards and punishes, daily life.
- "History & Myth": Origin story, key events, how the world reached its current state.
- "Geography & Setting": Physical world, key locations, how space shapes society.
- "Rules of the World": Magic, technology, physics — what is possible and impossible, and the cost of violations.
- "Interview Transcript": ALWAYS generate. Full verbatim record of all Q&A from all sessions.

For each document:
- "title": use one of the exact titles above
- "summary": 1–2 sentences describing what this document contains (shown as preview text on the card)
- "content": the full document text

Also include a top-level "tagline" field: 1–2 sentences capturing the world's tone, setting, and atmosphere. Specific — uses the actual details, not generic phrases.

Return ONLY valid JSON. No preamble. No markdown fences.
{"tagline":"","documents":[{"title":"","summary":"","content":""}]}`;
}
