/**
 * Parses [[id|Name|type]] reference markup in prose fields.
 *
 * Syntax (in priority order — parser accepts all forms):
 *   [[id|Display Name|type]]   — preferred form, id-anchored (rename-safe)
 *   [[Entity Name|type]]       — legacy 2-part with type hint
 *   [[Entity Name]]            — legacy 1-part, resolver infers type
 *
 * Backslash escapes (e.g. `\[[`) are deliberately NOT treated as literal
 * brackets — LLMs occasionally emit `\[[Name|type\]]` thinking they need to
 * escape the brackets for JSON, and treating `\[` as escape would silently
 * drop the tag. The leading backslash is preserved as plain text and the
 * `[[...]]` still renders as a tag.
 *
 * Valid types: character, object, location, faction, lore
 */

const TAG_REGEX = /\[\[([^\]]+)\]\]/g;
const ENTITY_TYPES = ['character', 'faction', 'location', 'object', 'lore'];

/**
 * uid() emits a 7-char base36 alphanumeric (see src/util.js). We accept a
 * generous range so future id schemes don't break the parser.
 */
const ID_PATTERN = /^[a-z0-9]{4,32}$/i;

/**
 * Parse all [[...]] tokens in a text string.
 *
 * Returns segments: { kind: 'text', value } or { kind: 'tag', id?, name, typeHint, raw }.
 * Handles \[[ escapes (renders as literal [[).
 */
export function parseReferences(text) {
  if (!text) return [{ kind: 'text', value: '' }];

  // Strip backslash-escapes immediately before [[ or ]] — the LLM sometimes
  // emits `\[[Name|type\]]` (escaping for JSON, which it doesn't need to do).
  // Without this normalisation the `\` stays in the captured inner text and
  // breaks type-hint matching, leaving the tag rendered as raw markup.
  const normalised = text.replace(/\\(\[\[|\]\])/g, '$1');

  const segments = [];

  let lastIndex = 0;
  let match;
  TAG_REGEX.lastIndex = 0;

  while ((match = TAG_REGEX.exec(normalised)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = normalised.slice(lastIndex, match.index);
      if (textChunk) segments.push({ kind: 'text', value: textChunk });
    }

    const inner = match[1];
    const parts = inner.split('|').map((s) => s.trim());

    let id = null;
    let name = '';
    let typeHint = null;

    if (parts.length >= 3) {
      // [[id|Name|type]] — id-anchored form.
      const lastIsType = ENTITY_TYPES.includes(parts[parts.length - 1].toLowerCase());
      const firstLooksLikeId = ID_PATTERN.test(parts[0]);
      if (lastIsType && firstLooksLikeId) {
        id = parts[0];
        name = parts.slice(1, -1).join('|').trim();
        typeHint = parts[parts.length - 1].toLowerCase();
      } else if (lastIsType) {
        // Treat as legacy [[Name with | inside|type]] — collapse to name|type.
        name = parts.slice(0, -1).join('|').trim();
        typeHint = parts[parts.length - 1].toLowerCase();
      } else {
        name = inner.trim();
      }
    } else if (parts.length === 2) {
      // Either [[Name|type]] or [[id|Name]] (rare, treat as Name|type fallback).
      const second = parts[1].toLowerCase();
      if (ENTITY_TYPES.includes(second)) {
        name = parts[0];
        typeHint = second;
      } else if (ID_PATTERN.test(parts[0]) && parts[1]) {
        // [[id|Name]] without type — resolver will infer type.
        id = parts[0];
        name = parts[1];
      } else {
        name = inner.trim();
      }
    } else {
      name = inner.trim();
    }

    segments.push({ kind: 'tag', id, name, typeHint, raw: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < normalised.length) {
    const tail = normalised.slice(lastIndex);
    if (tail) segments.push({ kind: 'text', value: tail });
  }

  return segments.length > 0 ? segments : [{ kind: 'text', value: normalised }];
}

/**
 * Returns true if the text contains any [[...]] tags.
 */
export function hasReferences(text) {
  if (!text) return false;
  const normalised = text.replace(/\\(\[\[|\]\])/g, '$1');
  TAG_REGEX.lastIndex = 0;
  return TAG_REGEX.test(normalised);
}

/**
 * Strip all [[...]] markup, returning plain text.
 * Resolved tags become just the entity name; escaped \[[ become [[.
 */
export function stripReferences(text) {
  if (!text) return '';
  return text
    .replace(/\\(\[\[|\]\])/g, '$1')
    .replace(TAG_REGEX, (_, inner) => {
      const parts = inner.split('|').map((s) => s.trim());
      if (parts.length >= 3) {
        const lastIsType = ENTITY_TYPES.includes(parts[parts.length - 1].toLowerCase());
        const firstLooksLikeId = ID_PATTERN.test(parts[0]);
        if (lastIsType && firstLooksLikeId) return parts.slice(1, -1).join('|').trim();
      }
      if (parts.length >= 2) {
        const second = parts[1].toLowerCase();
        if (ENTITY_TYPES.includes(second)) return parts[0];
        if (ID_PATTERN.test(parts[0])) return parts.slice(1).join('|').trim();
      }
      return inner.trim();
    });
}

// ---------------------------------------------------------------------------
// Entity resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a reference to a world entity.
 *
 * Accepted call shapes:
 *   resolveEntity(world, name, typeHint)             — legacy positional
 *   resolveEntity(world, name, typeHint, id)         — id-aware positional
 *   resolveEntity(world, { id, name, typeHint })     — object form
 *
 * Strategy:
 *   1. If id provided, look it up across entity arrays — return immediately on hit.
 *   2. If typeHint provided, search that entity type by name.
 *   3. Otherwise search all entity types in priority order.
 *
 * Within an array: exact case-insensitive → prefix → substring.
 * Returns: { id, type, name, summary } or null if no match.
 */
export function resolveEntity(world, nameOrSpec, typeHint, idArg) {
  if (!world) return null;

  let id = null;
  let name = '';
  let type = null;

  if (nameOrSpec && typeof nameOrSpec === 'object') {
    id = nameOrSpec.id ?? null;
    name = nameOrSpec.name ?? '';
    type = nameOrSpec.typeHint ?? null;
  } else {
    name = nameOrSpec ?? '';
    type = typeHint ?? null;
    id = idArg ?? null;
  }

  // 1. id-first lookup (fast path; survives renames).
  if (id) {
    const byId = findEntityById(world, id);
    if (byId) return byId;
    // id miss — fall through to name lookup so renamed-then-deleted entities
    // can still be approximately resolved or surface as unresolved.
  }

  if (!name) return null;
  const normalised = name.toLowerCase().trim();

  if (type) {
    return searchEntityArray(world, type, normalised);
  }

  for (const t of ENTITY_TYPES) {
    const result = searchEntityArray(world, t, normalised);
    if (result) return result;
  }
  return null;
}

function findEntityById(world, id) {
  for (const t of ENTITY_TYPES) {
    const arr = getEntityArray(world, t);
    const hit = arr.find((e) => e.id === id);
    if (hit) return buildResult(hit, t);
  }
  return null;
}

function searchEntityArray(world, type, normalisedName) {
  const arr = getEntityArray(world, type);
  if (!arr || arr.length === 0) return null;

  const getName = (e) => (type === 'lore' ? e.title : e.name) ?? '';

  for (const e of arr) {
    if (getName(e).toLowerCase() === normalisedName) return buildResult(e, type);
  }
  for (const e of arr) {
    if (getName(e).toLowerCase().startsWith(normalisedName)) return buildResult(e, type);
  }
  for (const e of arr) {
    if (getName(e).toLowerCase().includes(normalisedName)) return buildResult(e, type);
  }
  return null;
}

function getEntityArray(world, type) {
  switch (type) {
    case 'character': return world.characters ?? [];
    case 'object':    return world.objects ?? [];
    case 'location':  return world.locations ?? [];
    case 'faction':   return world.factions ?? [];
    case 'lore':      return world.documents ?? [];
    default:          return [];
  }
}

function buildResult(entity, type) {
  const name = type === 'lore' ? entity.title : entity.name;
  return {
    id: entity.id,
    type,
    name: name ?? '',
    summary: extractSummary(entity, type),
  };
}

function extractSummary(entity, type) {
  switch (type) {
    case 'character':
      return entity.summary?.[0] ?? '';
    case 'location': {
      const sig = entity.generated?.signature_line;
      if (sig) return sig;
      return firstSentence(entity.generated?.description ?? '');
    }
    case 'object':
    case 'faction':
      return firstSentence(entity.generated?.description ?? '');
    case 'lore':
      return entity.summary ?? firstSentence(entity.content ?? '');
    default:
      return '';
  }
}

function firstSentence(text) {
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : text.slice(0, 120).trim();
}

/**
 * Format a tag for insertion into prose. Always emits the id-anchored form.
 *   formatRef({ id, name, type }) => "[[id|Name|type]]"
 */
export function formatRef({ id, name, type }) {
  const safeName = (name ?? '').replace(/\|/g, '│'); // forbid pipe in name
  if (id) return `[[${id}|${safeName}|${type}]]`;
  return `[[${safeName}|${type}]]`;
}
