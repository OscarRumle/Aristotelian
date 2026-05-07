export const REFERENCE_SYNTAX_INSTRUCTION = `
REFERENCE SYNTAX:
When you mention an existing entity (character, object, location, faction, or lore document)
in any prose field, wrap it in TRIPLE-PART double brackets with id, display name, and entity type:

  [[abc123|Entity Name|character]]
  [[def456|Entity Name|object]]
  [[ghi789|Entity Name|location]]
  [[jkl012|Entity Name|faction]]
  [[mno345|Entity Name|lore]]

The id is the canonical identifier shown in this prompt's "EXISTING ENTITIES" listings —
copy it verbatim. The display name should match the entity's current name.

Rules:
- Include this syntax EVERY TIME you mention a named entity that exists in this world.
- Do NOT use this syntax for invented, hypothetical, or background entities that haven't been defined.
- Always include all three parts: id, name, and type, separated by pipes.
- Do NOT escape the brackets with backslashes — write them literally.
- If you cannot find the id for an entity in the listings below, use the legacy 2-part form
  [[Entity Name|type]] and the client will resolve by name. Prefer the id form when available.

Example:
  "She carried the [[obj_xy12|Enchanted Apple|object]] across the [[loc_pq45|Shattered Mountains|location]]
   to deliver it to [[chr_ab78|Lord Malachi|character]] of the [[fac_cd91|Shadow Court|faction]]."

This markup is invisible to the user — the client renders it as interactive links.
`;

/**
 * Render an "EXISTING ENTITIES" block listing all entities in the world the
 * LLM may reference, with their canonical ids. Used by every prompt builder.
 *
 * Format:
 *   EXISTING ENTITIES (use the id when emitting [[id|Name|type]]):
 *     character:
 *       - abc123 — Theron (Lead)
 *       - def456 — Selene (Deuteragonist)
 *     faction:
 *       - ghi789 — The Shadow Court
 *     ...
 */
export function buildEntityIdListing(world) {
  if (!world) return '';
  const lines = ['EXISTING ENTITIES (use the id when emitting [[id|Name|type]]):'];

  const sections = [
    { kind: 'character', items: (world.characters ?? []).map((c) => ({ id: c.id, name: c.name, sub: c.role || '' })) },
    { kind: 'faction',   items: (world.factions ?? []).map((f) =>   ({ id: f.id, name: f.name, sub: f.type || '' })) },
    { kind: 'location',  items: (world.locations ?? []).map((l) =>  ({ id: l.id, name: l.name, sub: l.type || '' })) },
    { kind: 'object',    items: (world.objects ?? []).map((o) =>    ({ id: o.id, name: o.name, sub: o.type || '' })) },
    { kind: 'lore',      items: (world.documents ?? []).map((d) =>  ({ id: d.id, name: d.title, sub: '' })) },
  ];

  let any = false;
  for (const { kind, items } of sections) {
    if (items.length === 0) continue;
    any = true;
    lines.push(`  ${kind}:`);
    for (const it of items) {
      const sub = it.sub ? ` (${it.sub})` : '';
      lines.push(`    - ${it.id} — ${it.name ?? '(unnamed)'}${sub}`);
    }
  }

  if (!any) return '';
  return lines.join('\n') + '\n';
}
