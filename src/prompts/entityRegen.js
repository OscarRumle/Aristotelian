import { REFERENCE_SYNTAX_INSTRUCTION, buildEntityIdListing } from "./referenceInstruction.js";
import { getLensFraming } from "./lensFraming.js";

export function buildEntityRegenPrompt(world, entity, entityType, fieldKey, currentValue, feedback = null) {
  const lens = entity && "lens" in entity ? entity.lens : "hamartia";
  const lensFraming = getLensFraming(lens);

  return `Regenerate one field for an existing ${entityType}.

WORLD: ${world.name} — ${world.description}

${entityType.toUpperCase()}: ${JSON.stringify(entity)}

FIELD: "${fieldKey}"
CURRENT VALUE: ${currentValue}

${lensFraming ? lensFraming + "\n\n" : ""}TASK: Regenerate only the "${fieldKey}" field. Stay consistent with all other fields and the world's tone.${feedback ? `\nFEEDBACK: ${feedback}` : ""}

${buildEntityIdListing(world)}
${REFERENCE_SYNTAX_INSTRUCTION}
Return ONLY the new value as a plain string. No JSON. No labels.`;
}
