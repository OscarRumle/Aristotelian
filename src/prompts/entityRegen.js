export function buildEntityRegenPrompt(world, entity, entityType, fieldKey, currentValue, feedback = null) {
  return `Regenerate one field for an existing ${entityType}.

WORLD: ${world.name} — ${world.description}

${entityType.toUpperCase()}: ${JSON.stringify(entity)}

FIELD: "${fieldKey}"
CURRENT VALUE: ${currentValue}

TASK: Regenerate only the "${fieldKey}" field. Stay consistent with all other fields and the world's tone.${feedback ? `\nFEEDBACK: ${feedback}` : ""}

Return ONLY the new value as a plain string. No JSON. No labels.`;
}
