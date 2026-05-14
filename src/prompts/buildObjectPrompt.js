import { REFERENCE_SYNTAX_INSTRUCTION, buildEntityIdListing } from "./referenceInstruction.js";
import { getLensFraming } from "./lensFraming.js";

/**
 * Builds the system prompt for object generation.
 * formState: { pitch, name, type, rarity, era, condition, typeSpecificFields, associations, lens }
 * associations: [{ kind: "character", id, note }]
 */
export function buildObjectPrompt(world, formState) {
  const { pitch, name, type, rarity, era, condition, typeSpecificFields = {}, associations = [], mentionContext, lens } = formState;

  const lines = [];

  lines.push(`You are a narrative object designer for a world-building tool. Your job is to give an object its full story — not just what it is, but what it means.`);
  lines.push(``);

  lines.push(`WORLD: ${world.name}`);
  lines.push(world.description || "");
  lines.push(``);

  lines.push(`OBJECT INPUT:`);
  lines.push(`Pitch: ${pitch}`);
  if (type)   lines.push(`Type: ${type}`);
  if (name)   lines.push(`Name: ${name}`);
  if (rarity) lines.push(`Rarity: ${rarity}`);
  if (era)    lines.push(`Era: ${era}`);
  if (condition) lines.push(`Condition: ${condition}`);
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
  const factionAssocs  = associations.filter((a) => a.kind === "faction");
  const locationAssocs = associations.filter((a) => a.kind === "location");
  lines.push(`ASSOCIATIONS:`);
  if (charAssocs.length === 0 && factionAssocs.length === 0 && locationAssocs.length === 0) {
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
    for (const a of locationAssocs) {
      const loc = (world.locations ?? []).find((l) => l.id === a.id);
      if (!loc) continue;
      const notePart = a.note ? ` ${a.note}` : "";
      lines.push(`Location: ${loc.name}${notePart}`);
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
  lines.push(`- "description": 2–3 sentences. Physical reality first — what it looks like, feels like, smells like. Then one sentence on what it communicates about the world.`);
  lines.push(`- "provenance": Who made it, where, when, and under what circumstances. One compact paragraph. Ground it in the world's specifics.`);
  lines.push(`- "dramatic_weight": Why this object matters to the story. What it enables, prevents, or represents. Who wants it and why. If associations were provided, use them to ground this field. 2–3 sentences.`);
  lines.push(`- "signature_line": One sentence — the single most interesting thing about this object. Could be a caption, inscription, or label.`);
  lines.push(``);

  if (mentionContext) lines.push(mentionContext);
  const idListing = buildEntityIdListing(world);
  if (idListing) lines.push(idListing);
  lines.push(REFERENCE_SYNTAX_INSTRUCTION);
  lines.push(`Return ONLY valid JSON. No preamble. No markdown fences.`);
  lines.push(`{"name":"","type":"","description":"","provenance":"","dramatic_weight":"","signature_line":""}`);

  return lines.join("\n");
}
