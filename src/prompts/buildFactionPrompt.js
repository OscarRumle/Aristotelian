/**
 * Builds the system prompt for faction generation.
 * formState: { pitch, name, type, size, status, age, typeSpecificFields, associations }
 * associations: [{ kind: "character"|"location", id, note }]
 */
export function buildFactionPrompt(world, formState) {
  const { pitch, name, type, size, status, age, typeSpecificFields = {}, associations = [] } = formState;

  const lines = [];

  lines.push(`You are a narrative faction designer for a world-building tool. Your job is to give a faction its full story — not just what it is, but the contradiction at its heart.`);
  lines.push(``);

  lines.push(`WORLD: ${world.name}`);
  lines.push(world.description || "");
  lines.push(``);

  lines.push(`FACTION INPUT:`);
  lines.push(`Pitch: ${pitch}`);
  if (type)   lines.push(`Type: ${type}`);
  if (name)   lines.push(`Name: ${name}`);
  if (size)   lines.push(`Size: ${size}`);
  if (status) lines.push(`Status: ${status}`);
  if (age)    lines.push(`Age: ${age}`);
  lines.push(``);

  const typeFieldEntries = Object.entries(typeSpecificFields).filter(([, v]) => v);
  if (typeFieldEntries.length > 0) {
    lines.push(`TYPE-SPECIFIC DETAILS:`);
    for (const [k, v] of typeFieldEntries) {
      lines.push(`${k}: ${v}`);
    }
    lines.push(``);
  }

  const charAssocs     = associations.filter((a) => a.kind === "character");
  const locationAssocs = associations.filter((a) => a.kind === "location");

  lines.push(`ASSOCIATIONS:`);
  if (charAssocs.length === 0 && locationAssocs.length === 0) {
    lines.push(`None specified.`);
  } else {
    for (const a of charAssocs) {
      const char = (world.characters ?? []).find((c) => c.id === a.id);
      if (!char) continue;
      const summary = char.summary?.[0] ?? "";
      const notePart = a.note ? ` ${a.note}` : "";
      lines.push(`Character: ${char.name}${summary ? ` — ${summary}` : ""}${notePart}`);
    }
    for (const a of locationAssocs) {
      const loc = (world.locations ?? []).find((l) => l.id === a.id);
      if (!loc) continue;
      const notePart = a.note ? ` ${a.note}` : "";
      lines.push(`Location: ${loc.name}${notePart}`);
    }
  }
  lines.push(``);

  lines.push(`FIELD INSTRUCTIONS:`);
  lines.push(`- "name": A specific, evocative name. Not generic. If the user supplied a name, use it exactly.`);
  lines.push(`- "type": Use the user-supplied type, or infer from context.`);
  lines.push(`- "description": 2–3 sentences. What this faction is, how it presents itself publicly. What someone would say about them at a dinner party.`);
  lines.push(`- "history": One compact paragraph. How it came to be, key moments, what shaped it. Ground it in the world's specifics.`);
  lines.push(`- "dramatic_role": Why this faction matters to the story. What conflict does it embody? What does it want, and what does that cost the world? 2–3 sentences.`);
  lines.push(`- "internal_tension": The contradiction at the faction's heart — what it believes about itself versus what it actually does or represents. This is the most important field. The religious order that tortures in the name of mercy. The guild that claims to protect workers while exploiting them. Name this gap explicitly.`);
  lines.push(`- "motto": A phrase, creed, or saying — real or unspoken — that captures their self-image. One sentence or less.`);
  lines.push(``);

  lines.push(`Return ONLY valid JSON. No preamble. No markdown fences.`);
  lines.push(`{"name":"","type":"","description":"","history":"","dramatic_role":"","internal_tension":"","motto":""}`);

  return lines.join("\n");
}
