export function buildFieldExpandPrompt(entityType, entity, world, fieldKey, mode, direction = "") {
  const currentValue = entity[fieldKey];
  const directionClause = direction.trim()
    ? `Direction from the user: "${direction.trim()}"`
    : `No direction given — use your judgment about what would enrich this content.`;

  const modeInstruction = mode === "vertical"
    ? `VERTICAL EXPAND: Write more about the same subject already present. Add depth, texture, and specificity to what is already described. Do not introduce new topics.`
    : `HORIZONTAL EXPAND: Introduce entirely new content adjacent to what is already described. The new content should not overlap with the existing text — it should open up new ground within the same world/entity context.`;

  return `You are expanding one field of an existing ${entityType}.

WORLD: ${world.name}
${world.description}

${entityType.toUpperCase()}: ${JSON.stringify(entity)}

FIELD: "${fieldKey}"
CURRENT VALUE:
${currentValue}

${modeInstruction}

${directionClause}

Write ONLY the new content to append. Do not repeat or summarize the existing text. Do not include labels, headers, or preamble. Plain prose only.`;
}
