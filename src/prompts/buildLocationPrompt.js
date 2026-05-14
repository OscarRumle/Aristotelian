import { REFERENCE_SYNTAX_INSTRUCTION, buildEntityIdListing } from "./referenceInstruction.js";
import { getLensFraming } from "./lensFraming.js";

/**
 * Builds the system prompt for location generation.
 * formState: { pitch, name, type, scale, status, access, typeSpecificFields, associations, lens }
 * associations: [{ kind: "character"|"faction", id, note }]
 */
export function buildLocationPrompt(world, formState) {
  const { pitch, name, type, scale, status, access, typeSpecificFields = {}, associations = [], mentionContext, lens } = formState;

  const lines = [];

  lines.push(`You are a narrative location designer for a world-building tool. Your job is to give a place its full story — not just what it is, but the tension or meaning it carries.`);
  lines.push(``);

  lines.push(`WORLD: ${world.name}`);
  lines.push(world.description || "");
  lines.push(``);

  lines.push(`LOCATION INPUT:`);
  lines.push(`Pitch: ${pitch}`);
  if (type)   lines.push(`Type: ${type}`);
  if (name)   lines.push(`Name: ${name}`);
  if (scale)  lines.push(`Scale: ${scale}`);
  if (status) lines.push(`Status: ${status}`);
  if (access) lines.push(`Access: ${access}`);
  lines.push(``);

  const typeFieldEntries = Object.entries(typeSpecificFields).filter(([, v]) => v);
  if (typeFieldEntries.length > 0) {
    lines.push(`TYPE-SPECIFIC DETAILS:`);
    for (const [k, v] of typeFieldEntries) {
      lines.push(`${k}: ${v}`);
    }
    lines.push(``);
  }

  const charAssocs    = associations.filter((a) => a.kind === "character");
  const factionAssocs = associations.filter((a) => a.kind === "faction");

  lines.push(`ASSOCIATIONS:`);
  if (charAssocs.length === 0 && factionAssocs.length === 0) {
    lines.push(`None specified.`);
  } else {
    for (const a of charAssocs) {
      const char = (world.characters ?? []).find((c) => c.id === a.id);
      if (!char) continue;
      const summary = char.summary?.[0] ?? "";
      const notePart = a.note ? ` ${a.note}` : "";
      lines.push(`Character: ${char.name}${summary ? ` — ${summary}` : ""}${notePart}`);
    }
    for (const a of factionAssocs) {
      const faction = (world.factions ?? []).find((f) => f.id === a.id);
      if (!faction) continue;
      const notePart = a.note ? ` ${a.note}` : "";
      lines.push(`Faction: ${faction.name}${notePart}`);
    }
  }
  lines.push(``);

  const lensFraming = getLensFraming(lens === undefined ? "hamartia" : lens);
  if (lensFraming) {
    lines.push(lensFraming);
    lines.push(``);
  }

  lines.push(`FIELD INSTRUCTIONS:`);
  lines.push(`- "name": A specific, evocative name. Not generic. If the user supplied a name, use it exactly.`);
  lines.push(`- "type": Use the user-supplied type, or infer from context.`);
  lines.push(`- "description": 2–3 sentences. Sensory and specific — not "a dark castle" but what makes this particular place feel the way it does. Sight, sound, smell, texture.`);
  lines.push(`- "history": One compact paragraph. What happened here. How it became what it is. What it used to be.`);
  lines.push(`- "dramatic_role": What conflict or meaning does this place carry? Who wants it, who fears it, who is defined by it? 2–3 sentences.`);
  lines.push(`- "signature_line": One evocative sentence that captures the place — not a quote, more like a caption or epitaph. The single most interesting thing about being here.`);
  lines.push(``);

  if (mentionContext) lines.push(mentionContext);
  const idListing = buildEntityIdListing(world);
  if (idListing) lines.push(idListing);
  lines.push(REFERENCE_SYNTAX_INSTRUCTION);
  lines.push(`Return ONLY valid JSON. No preamble. No markdown fences.`);
  lines.push(`{"name":"","type":"","description":"","history":"","dramatic_role":"","signature_line":""}`);

  return lines.join("\n");
}
