/**
 * Neighborhood utility — for create-from-mention prompts.
 *
 * When the user creates entity B from a mention inside entity A's prose,
 * the LLM gets richer context if it sees (a) the source field's text and
 * (b) entities adjacent to A — what A is connected to in associations and
 * what other entities A's prose already references.
 *
 * Output is intentionally compact (id, name, type, one-line summary).
 */

import { parseReferences, resolveEntity } from "./referenceParser.js";
import { PROSE_FIELDS } from "./backlinks.js";

function getEntity(world, type, id) {
  switch (type) {
    case 'character': return (world.characters ?? []).find((e) => e.id === id) ?? null;
    case 'object':    return (world.objects ?? []).find((e) => e.id === id) ?? null;
    case 'faction':   return (world.factions ?? []).find((e) => e.id === id) ?? null;
    case 'location':  return (world.locations ?? []).find((e) => e.id === id) ?? null;
    case 'lore':      return (world.documents ?? []).find((e) => e.id === id) ?? null;
    default:          return null;
  }
}

function summarise(entity, type) {
  if (!entity) return '';
  const gen = entity.generated ?? entity;
  switch (type) {
    case 'character':
      return entity.summary?.[0] ?? entity.consistency ?? '';
    case 'object':
    case 'faction':
      return gen.description?.split(/[.!?]/)[0] ?? '';
    case 'location':
      return gen.signature_line || (gen.description?.split(/[.!?]/)[0] ?? '');
    case 'lore':
      return entity.summary ?? (entity.content?.split(/[.!?]/)[0] ?? '');
    default:
      return '';
  }
}

/**
 * Returns up to ~12 neighbors of the given source entity:
 *   - explicit associations on the source
 *   - entities whose [[...]] references appear in the source's prose fields
 *
 * @returns {Array<{ id, type, name, summary, via: 'association'|'prose' }>}
 */
export function neighborhoodOf(world, sourceType, sourceId) {
  if (!world || !sourceType || !sourceId) return [];
  const source = getEntity(world, sourceType, sourceId);
  if (!source) return [];

  const seen = new Set([sourceId]);
  const out = [];

  // 1. Explicit associations
  for (const a of source.associations ?? []) {
    if (seen.has(a.id)) continue;
    const e = getEntity(world, a.kind, a.id);
    if (!e) continue;
    seen.add(a.id);
    const name = a.kind === 'lore' ? e.title : e.name;
    out.push({ id: a.id, type: a.kind, name: name ?? '', summary: summarise(e, a.kind), via: 'association' });
  }

  // 2. Prose-mentioned entities (scan source's own prose fields).
  const fields = PROSE_FIELDS[sourceType] ?? [];
  const onGenerated = sourceType === 'object' || sourceType === 'faction' || sourceType === 'location';
  for (const { key } of fields) {
    const text = onGenerated ? source.generated?.[key] : source[key];
    if (!text) continue;
    const segs = parseReferences(text);
    for (const s of segs) {
      if (s.kind !== 'tag') continue;
      const r = resolveEntity(world, { id: s.id, name: s.name, typeHint: s.typeHint });
      if (!r) continue;
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push({ id: r.id, type: r.type, name: r.name, summary: r.summary ?? '', via: 'prose' });
    }
  }

  return out.slice(0, 12);
}

/**
 * Format a `CONTEXT — Created from a mention` block for inclusion in any
 * entity-creation prompt. Returns '' when refContext is missing.
 *
 * refContext shape: { name, sourceText, sourceName, sourceType, sourceFieldKey, sourceId }
 */
export function buildSourceMentionContext(refContext, world) {
  if (!refContext) return '';
  const { name, sourceText, sourceName, sourceType, sourceFieldKey, sourceId } = refContext;
  const lines = [];
  lines.push(`CONTEXT — Created from a mention:`);
  lines.push(`This entity ("${name ?? '?'}") was first mentioned inside another entity's prose.`);
  if (sourceName && sourceType) {
    lines.push(`Source: ${sourceName} (${sourceType})${sourceFieldKey ? ` — field "${sourceFieldKey}"` : ''}`);
  }
  if (sourceText) {
    const trimmed = sourceText.length > 1200 ? sourceText.slice(0, 1200) + '…' : sourceText;
    lines.push('');
    lines.push('Source field text (read for context — make the new entity cohere with it):');
    lines.push('"""');
    lines.push(trimmed);
    lines.push('"""');
  }

  if (sourceId && sourceType && world) {
    const neighbors = neighborhoodOf(world, sourceType, sourceId);
    if (neighbors.length > 0) {
      lines.push('');
      lines.push("Source's known neighbors (entities the source is already connected to):");
      for (const n of neighbors) {
        const sum = n.summary ? ` — ${n.summary}` : '';
        lines.push(`  - [${n.type}] ${n.id} ${n.name}${sum}`);
      }
    }
  }

  return lines.join('\n') + '\n';
}
