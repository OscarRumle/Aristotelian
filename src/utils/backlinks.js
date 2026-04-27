/**
 * Backlink computation for the Reference Network.
 *
 * Backlinks are computed at render time (not stored).
 * Algorithm: scan all prose fields in all entities for [[...]] tags,
 * resolve each tag, and collect those that match the target entity.
 */

import { parseReferences, resolveEntity } from './referenceParser.js';

/**
 * Prose fields to scan per entity type.
 * Only fields that the LLM writes free-form narrative text into.
 */
export const PROSE_FIELDS = {
  character: [
    { key: 'appearance',       label: 'Appearance' },
    { key: 'background',       label: 'Background' },
    { key: 'personality',      label: 'Personality' },
    { key: 'desires',          label: 'Desires' },
    { key: 'fears',            label: 'Fears' },
    { key: 'moralCore',        label: 'Moral Core' },
    { key: 'hamartia',         label: 'Hamartia' },
    { key: 'consistency',      label: 'Consistency' },
    { key: 'subtext',          label: 'Subtext' },
    { key: 'voicePattern',     label: 'Voice Pattern' },
    { key: 'aristotelianNote', label: 'Aristotelian Note' },
  ],
  object: [
    { key: 'description',    label: 'Description' },
    { key: 'provenance',     label: 'Provenance' },
    { key: 'dramatic_weight', label: 'Dramatic Weight' },
    { key: 'signature_line', label: 'Signature Line' },
  ],
  faction: [
    { key: 'description',       label: 'Description' },
    { key: 'history',           label: 'History' },
    { key: 'dramatic_role',     label: 'Dramatic Role' },
    { key: 'internal_tension',  label: 'Internal Tension' },
    { key: 'motto',             label: 'Motto' },
  ],
  location: [
    { key: 'description',   label: 'Description' },
    { key: 'history',       label: 'History' },
    { key: 'dramatic_role', label: 'Dramatic Role' },
    { key: 'signature_line', label: 'Signature Line' },
  ],
  lore: [
    { key: 'content', label: 'Content' },
  ],
};

/**
 * Returns a flat list of backlink entries for the given target entity.
 *
 * Each entry: { entityType, entityId, entityName, fieldKey, fieldLabel }
 *
 * @param {object} world
 * @param {string} targetId   — id of the entity being viewed
 */
export function computeBacklinks(world, targetId) {
  if (!world || !targetId) return [];

  const results = [];

  // Iterate all entity types and their arrays
  const typeArrays = [
    { type: 'character', entities: world.characters ?? [], nameKey: 'name', fieldsOn: 'direct' },
    { type: 'object',    entities: world.objects ?? [],    nameKey: 'name', fieldsOn: 'generated' },
    { type: 'faction',   entities: world.factions ?? [],   nameKey: 'name', fieldsOn: 'generated' },
    { type: 'location',  entities: world.locations ?? [],  nameKey: 'name', fieldsOn: 'generated' },
    { type: 'lore',      entities: world.documents ?? [],  nameKey: 'title', fieldsOn: 'direct' },
  ];

  for (const { type, entities, nameKey, fieldsOn } of typeArrays) {
    const fields = PROSE_FIELDS[type] ?? [];

    for (const entity of entities) {
      if (entity.id === targetId) continue; // skip self

      for (const { key, label } of fields) {
        const text = fieldsOn === 'generated'
          ? entity.generated?.[key]
          : entity[key];

        if (!text) continue;

        const segments = parseReferences(text);
        for (const seg of segments) {
          if (seg.kind !== 'tag') continue;
          const resolved = resolveEntity(world, seg.name, seg.typeHint);
          if (resolved && resolved.id === targetId) {
            results.push({
              entityType: type,
              entityId: entity.id,
              entityName: entity[nameKey] ?? '',
              fieldKey: key,
              fieldLabel: label,
            });
            break; // one entry per field is enough; avoid duplicates per field
          }
        }
      }
    }
  }

  // Also scan explicit associations arrays
  const assocTypeArrays = [
    { type: 'character', entities: world.characters ?? [], nameKey: 'name' },
    { type: 'object',    entities: world.objects ?? [],    nameKey: 'name' },
    { type: 'faction',   entities: world.factions ?? [],   nameKey: 'name' },
    { type: 'location',  entities: world.locations ?? [],  nameKey: 'name' },
  ];
  for (const { type, entities, nameKey } of assocTypeArrays) {
    for (const entity of entities) {
      if (entity.id === targetId) continue;
      for (const assoc of entity.associations ?? []) {
        if (assoc.id === targetId) {
          const alreadyFound = results.some(
            (r) => r.entityId === entity.id && r.fieldKey === 'associations'
          );
          if (!alreadyFound) {
            results.push({
              entityType: type,
              entityId: entity.id,
              entityName: entity[nameKey] ?? '',
              fieldKey: 'associations',
              fieldLabel: 'Connections',
            });
          }
          break;
        }
      }
    }
  }

  return results;
}

/**
 * Group backlinks by entity type for display.
 * Returns: { [entityType]: [backlink, ...] }
 */
export function groupBacklinks(backlinks) {
  const groups = {};
  for (const bl of backlinks) {
    if (!groups[bl.entityType]) groups[bl.entityType] = [];
    groups[bl.entityType].push(bl);
  }
  return groups;
}
