import { REFERENCE_SYNTAX_INSTRUCTION } from "./referenceInstruction.js";

export function buildRegenPrompt(world, character, fieldKey, feedback = null) {
  return `Regenerate one field for an existing character.
WORLD: ${world.name} — ${world.description}
CHARACTER: ${JSON.stringify(character)}
TASK: Regenerate only the "${fieldKey}" field. Stay consistent with all other fields. Apply Aristotle's framework.${feedback ? `\nFEEDBACK: ${feedback}` : ""}
${REFERENCE_SYNTAX_INSTRUCTION}
Return ONLY the new value as a plain string. No JSON. No labels.`;
}
