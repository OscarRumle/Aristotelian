import { parseReferences, resolveEntity } from "./referenceParser.js";

/**
 * Resolve all [[...]] tags in text and format them as an LLM context block.
 * Returns an empty string if no tags resolve, so callers can skip injection.
 */
export function buildMentionContext(world, text) {
  if (!text || !text.includes("[[")) return "";

  const segments = parseReferences(text);
  const resolved = [];

  for (const seg of segments) {
    if (seg.kind !== 'tag') continue;
    const entity = resolveEntity(world, seg.name, seg.typeHint);
    if (!entity) continue;
    if (resolved.some((e) => e.id === entity.id)) continue;
    resolved.push(entity);
  }

  if (resolved.length === 0) return "";

  const lines = ["REFERENCED ENTITIES — mentioned in the user's pitch:"];
  for (const e of resolved) {
    lines.push(`- ${e.name} (${e.type}): ${e.summary || "no description available"}`);
  }
  lines.push("Generate this entity coherently with the above context.");
  return lines.join("\n");
}
