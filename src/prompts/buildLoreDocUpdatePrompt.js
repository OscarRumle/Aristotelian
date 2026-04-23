export function buildLoreDocUpdatePrompt(world, doc, transcript) {
  const qaBlock = transcript
    .map((t, i) => `Q${i + 1}: ${t.question}\nA: ${t.answer}`)
    .join("\n\n");

  return `You are updating a lore document by incorporating new information from an interview.

WORLD: ${world.name}

ORIGINAL DOCUMENT — "${doc.title}":
${doc.content}

NEW INTERVIEW ANSWERS:
${qaBlock}

Rewrite the document to incorporate the new information. Rules:
- Preserve all original content that is still accurate
- Add new details from the interview answers where they naturally fit
- Where the interview answers revise or contradict the original, update the original text
- Keep the same document voice and structure
- The result should read as one coherent document, not as original + appended sections

Also write an updated 1–2 sentence summary.

Return ONLY valid JSON. No preamble. No markdown fences.
{"title":"${doc.title}","summary":"","content":""}`;
}
