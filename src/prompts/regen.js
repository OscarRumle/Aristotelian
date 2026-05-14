import { REFERENCE_SYNTAX_INSTRUCTION, buildEntityIdListing } from "./referenceInstruction.js";
import { getLensFraming } from "./lensFraming.js";

export function buildRegenPrompt(world, character, fieldKey, feedback = null) {
  // Field regen reads the character's stored lens silently — no UI exposed
  // at the field level. Spec: a Recognition-generated character regens its
  // fields through Recognition; we don't drift back to Hamartia mid-character.
  const lens = "lens" in character ? character.lens : "hamartia";
  const lensFraming = getLensFraming(lens);

  return `Regenerate one field for an existing character.
WORLD: ${world.name} — ${world.description}
CHARACTER: ${JSON.stringify(character)}
${lensFraming ? lensFraming + "\n" : ""}TASK: Regenerate only the "${fieldKey}" field. Stay consistent with all other fields. Apply Aristotle's framework.${feedback ? `\nFEEDBACK: ${feedback}` : ""}
${buildEntityIdListing(world)}
${REFERENCE_SYNTAX_INSTRUCTION}
Return ONLY the new value as a plain string. No JSON. No labels.`;
}
