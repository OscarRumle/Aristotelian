import { REFERENCE_SYNTAX_INSTRUCTION } from "./referenceInstruction.js";

/**
 * Generate a single sentence weaving a newly-added association into a chosen
 * prose field. The sentence must include a [[id|Name|type]] tag for the target
 * so the connection is also visible in the source's prose.
 *
 * Inputs:
 *   world          — the active world (for tone)
 *   sourceEntity   — the entity whose field will be appended to
 *   sourceType     — entity type of source ("character" | "object" | ...)
 *   fieldKey       — which prose field to extend
 *   fieldLabel     — human-readable label (e.g. "Background")
 *   currentValue   — existing prose in that field (for tone-matching)
 *   target         — { id, kind, name, relation? } association entry
 */
export function buildAssociationProsePrompt({
  world,
  sourceEntity,
  sourceType,
  fieldKey,
  fieldLabel,
  currentValue,
  target,
}) {
  const sourceName = sourceEntity?.name ?? sourceEntity?.title ?? '?';
  const targetName = target?.name ?? '?';
  const targetKind = target?.kind ?? 'character';
  const targetId = target?.id ?? '';
  const relation = target?.relation ? ` (${target.relation})` : '';

  return `You are extending one prose field of an existing ${sourceType} with a single sentence that introduces a newly-established connection.

WORLD: ${world.name} — ${world.description ?? ''}

${sourceType.toUpperCase()}: ${sourceName}
FIELD: "${fieldLabel}" (${fieldKey})
EXISTING TEXT (match its tone and tense; do not rewrite):
"""
${currentValue ?? ''}
"""

NEW CONNECTION to weave in:
  ${sourceName} ↔ ${targetName} (${targetKind})${relation}

TASK: Write ONE sentence that natural-sounds like a continuation of the existing field. It MUST mention ${targetName} using the id-anchored 3-part reference syntax: [[${targetId}|${targetName}|${targetKind}]]. Do not summarise, do not repeat what the field already says, do not include labels or quotes. Plain prose. One sentence only.

${REFERENCE_SYNTAX_INSTRUCTION}
Return ONLY the sentence as plain prose. No JSON, no labels, no quotes around it.`;
}
