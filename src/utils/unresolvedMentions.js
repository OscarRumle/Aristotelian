/**
 * Surface unresolved [[...]] mentions across the world so the user can
 * see and resolve "loose ends" — entities that are referenced in prose
 * but don't yet exist as entities.
 */

import { parseReferences, resolveEntity } from "./referenceParser.js";
import { PROSE_FIELDS } from "./backlinks.js";

const ENTITY_ARRAYS = [
  { type: 'character', key: 'characters', nameKey: 'name', fieldsOn: 'direct' },
  { type: 'object',    key: 'objects',    nameKey: 'name', fieldsOn: 'generated' },
  { type: 'faction',   key: 'factions',   nameKey: 'name', fieldsOn: 'generated' },
  { type: 'location',  key: 'locations',  nameKey: 'name', fieldsOn: 'generated' },
  { type: 'lore',      key: 'documents',  nameKey: 'title', fieldsOn: 'direct' },
];

/**
 * Scan one prose value, return unresolved tags with normalised metadata.
 * Each entry: { name, typeHint, raw }
 */
export function unresolvedInText(world, text) {
  if (!text) return [];
  const segments = parseReferences(text);
  const out = [];
  for (const s of segments) {
    if (s.kind !== 'tag') continue;
    const r = resolveEntity(world, { id: s.id, name: s.name, typeHint: s.typeHint });
    if (r) continue;
    out.push({ name: s.name, typeHint: s.typeHint ?? null, raw: s.raw });
  }
  return out;
}

/**
 * Count unresolved mentions across all prose fields of one entity.
 * Returns total count.
 */
export function countUnresolvedForEntity(world, entity, entityType) {
  if (!world || !entity) return 0;
  const fields = PROSE_FIELDS[entityType] ?? [];
  const onGenerated = entityType === 'object' || entityType === 'faction' || entityType === 'location';
  let count = 0;
  for (const { key } of fields) {
    const text = onGenerated ? entity.generated?.[key] : entity[key];
    if (!text) continue;
    count += unresolvedInText(world, text).length;
  }
  return count;
}

/**
 * Walk every entity in the world and collect unresolved mentions, deduplicated
 * by (lowercased name + typeHint). Each entry includes one "first source" so
 * the user can navigate to the field that mentions it.
 *
 * Returns:
 *   [
 *     {
 *       name, typeHint, count,
 *       sources: [{ entityType, entityId, entityName, fieldKey, fieldLabel }, ...]
 *     }
 *   ]
 *
 * sources is capped at 5 per unresolved-name to keep payloads small.
 */
export function collectUnresolvedAcrossWorld(world) {
  if (!world) return [];
  const map = new Map(); // key: `${typeHint||'?'}::${nameLower}` → entry

  for (const { type, key, nameKey, fieldsOn } of ENTITY_ARRAYS) {
    const fields = PROSE_FIELDS[type] ?? [];
    const arr = world[key] ?? [];
    for (const entity of arr) {
      for (const { key: fk, label } of fields) {
        const text = fieldsOn === 'generated' ? entity.generated?.[fk] : entity[fk];
        if (!text) continue;
        const unresolved = unresolvedInText(world, text);
        for (const u of unresolved) {
          const k = `${u.typeHint ?? '?'}::${u.name.toLowerCase().trim()}`;
          if (!map.has(k)) {
            map.set(k, {
              name: u.name,
              typeHint: u.typeHint,
              count: 0,
              sources: [],
            });
          }
          const e = map.get(k);
          e.count += 1;
          if (e.sources.length < 5) {
            e.sources.push({
              entityType: type,
              entityId: entity.id,
              entityName: entity[nameKey] ?? '',
              fieldKey: fk,
              fieldLabel: label,
            });
          }
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
