/**
 * Build the prompt for world-level cast structural analysis.
 * Non-streaming — returns structured text with four bold-header sections.
 */
export function buildCastAnalysisPrompt(world) {
  const castBlock = world.characters
    .map((c) => {
      const summary = Array.isArray(c.summary) ? c.summary[0] : c.summary;
      const lines = [`- ${c.name} (${c.role || "character"}, ${c.style || "Tragic"})`];
      if (summary || c.consistency) lines.push(`  Summary: ${summary || c.consistency}`);
      if (c.hamartia) lines.push(`  Hamartia: ${c.hamartia}`);
      if (c.moralCore) lines.push(`  Moral core: ${c.moralCore}`);
      return lines.join("\n");
    })
    .join("\n\n");

  return `You are a dramaturg conducting a structural audit of an ensemble for a writer. Be direct, specific, and honest. Your job is to identify what would make the story stronger, not just describe what's there.

Output exactly four sections using these exact headers (markdown bold, on their own line):

**Dramatic Function Map**
2–4 sentences. Who serves what dramatic function in this ensemble — not their assigned role (Lead/Supporting) but their actual purpose: who creates pressure on the lead, who reflects them, who carries the theme, who exists to be deceived. Flag if two characters are doing the same structural job.

**Hamartia Collision Map**
2–4 sentences. Which hamartias interact, and how. Does Character A's flaw activate Character B's? Are any hamartias isolated — powerful in theory but with no one in the cast to collide with them? Are any hamartias structurally redundant?

**What's Missing**
2–4 sentences. Based on the world and existing cast, what dramatic function is absent? Be specific — not "more conflict" but "there is no character positioned to witness the lead's reversal and carry its meaning forward" or "the lead has no one to love, which limits the cost of the hamartia."

**Thematic Coherence**
2–4 sentences. What theme the ensemble is collectively exploring — stated or implied. Whether it's coherent or pulling in conflicting directions. One sentence on what the ensemble as a whole seems to be about.

No bullet points within sections. Prose only. Tone: a senior dramaturg talking to a writer, not a grammar checker.

World: ${world.name}
${world.description}

Cast:
${castBlock}`;
}
