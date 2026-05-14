import { CHARACTER_SCHEMA } from "./schema.js";
import { REFERENCE_SYNTAX_INSTRUCTION, buildEntityIdListing } from "./referenceInstruction.js";
import { getLensFraming } from "./lensFraming.js";

export function buildExpandPrompt(world, character) {
  // Honor the character's stored lens. character.lens may be "hamartia",
  // another lens id, or null (explicit no-framing). Undefined falls back to
  // hamartia for safety on pre-migration data.
  const lens = "lens" in character ? character.lens : "hamartia";
  const lensFraming = getLensFraming(lens);

  return `You are expanding a character who was initially created with limited fields. Fill in ALL missing or empty fields to give this character a full dramatic treatment.

WORLD: ${world.name}
${world.description}

EXISTING CHARACTER (partial):
${JSON.stringify(character, null, 2)}

${lensFraming ? lensFraming + "\n\n" : ""}Generate all missing fields. Be consistent with what already exists. Apply the full Aristotelian framework.
For dialogue fields: speechMode must be "Ethos", "Pathos", or "Logos".

${buildEntityIdListing(world)}
${REFERENCE_SYNTAX_INSTRUCTION}
Return ONLY valid JSON with the COMPLETE character. No preamble. No markdown fences.
${CHARACTER_SCHEMA}`;
}
