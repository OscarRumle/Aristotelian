/**
 * Parses [[Name|type]] reference markup in prose fields.
 *
 * Syntax:
 *   [[Entity Name|type]]   — with type hint
 *   [[Entity Name]]        — without type hint (resolver infers)
 *   \[\[                   — escaped, renders as literal [[
 *
 * Valid types: character, object, location, faction, lore
 */

const TAG_REGEX = /\[\[([^\]]+)\]\]/g;
const ESCAPE_REGEX = /\\\[\[/g;
const ENTITY_TYPES = ['character', 'faction', 'location', 'object', 'lore'];

/**
 * Parse all [[...]] tokens in a text string.
 *
 * Returns an array of segment objects describing how to render the text:
 *   { kind: 'text', value }
 *   { kind: 'tag', name, typeHint, raw }
 *
 * Handles \[[ escapes (renders as literal [[).
 */
export function parseReferences(text) {
  if (!text) return [{ kind: 'text', value: '' }];

  const segments = [];
  // Replace escaped \[[ with a placeholder so the regex doesn't match it
  const PLACEHOLDER = '\x00ESC\x00';
  const escaped = text.replace(ESCAPE_REGEX, PLACEHOLDER);

  let lastIndex = 0;
  let match;
  TAG_REGEX.lastIndex = 0;

  while ((match = TAG_REGEX.exec(escaped)) !== null) {
    // Text before this tag
    if (match.index > lastIndex) {
      const textChunk = escaped.slice(lastIndex, match.index).replace(PLACEHOLDER, '[[');
      if (textChunk) segments.push({ kind: 'text', value: textChunk });
    }

    const inner = match[1];
    const pipeIdx = inner.indexOf('|');
    let name, typeHint;

    if (pipeIdx !== -1) {
      name = inner.slice(0, pipeIdx).trim();
      typeHint = inner.slice(pipeIdx + 1).trim().toLowerCase();
      if (!ENTITY_TYPES.includes(typeHint)) typeHint = null;
    } else {
      name = inner.trim();
      typeHint = null;
    }

    segments.push({ kind: 'tag', name, typeHint, raw: match[0] });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last tag
  if (lastIndex < escaped.length) {
    const tail = escaped.slice(lastIndex).replace(PLACEHOLDER, '[[');
    if (tail) segments.push({ kind: 'text', value: tail });
  }

  return segments.length > 0 ? segments : [{ kind: 'text', value: text }];
}

/**
 * Returns true if the text contains any [[...]] tags.
 */
export function hasReferences(text) {
  if (!text) return false;
  TAG_REGEX.lastIndex = 0;
  return TAG_REGEX.test(text);
}

/**
 * Strip all [[...]] markup, returning plain text.
 * Resolved tags become just the entity name; escaped \[[ become [[.
 */
export function stripReferences(text) {
  if (!text) return '';
  return text
    .replace(ESCAPE_REGEX, '[[')
    .replace(TAG_REGEX, (_, inner) => {
      const pipeIdx = inner.indexOf('|');
      return pipeIdx !== -1 ? inner.slice(0, pipeIdx).trim() : inner.trim();
    });
}

// ---------------------------------------------------------------------------
// Entity resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a name + optional typeHint against a world object.
 *
 * Returns: { id, type, name, summary } or null if no match.
 *
 * Search order when no typeHint:
 *   character → faction → location → object → lore
 *
 * Within an array: exact match → prefix match → substring match.
 * Note: lore documents use .title, all other entities use .name.
 */
export function resolveEntity(world, name, typeHint) {
  if (!world || !name) return null;

  const normalised = name.toLowerCase().trim();

  if (typeHint) {
    return searchEntityArray(world, typeHint, normalised);
  }

  for (const type of ENTITY_TYPES) {
    const result = searchEntityArray(world, type, normalised);
    if (result) return result;
  }

  return null;
}

function searchEntityArray(world, type, normalisedName) {
  const arr = getEntityArray(world, type);
  if (!arr || arr.length === 0) return null;

  const getName = (e) => (type === 'lore' ? e.title : e.name) ?? '';

  // 1. Exact case-insensitive match
  for (const e of arr) {
    if (getName(e).toLowerCase() === normalisedName) {
      return buildResult(e, type);
    }
  }

  // 2. Prefix match (entity name starts with the searched name)
  for (const e of arr) {
    if (getName(e).toLowerCase().startsWith(normalisedName)) {
      return buildResult(e, type);
    }
  }

  // 3. Substring match (entity name contains the searched name)
  for (const e of arr) {
    if (getName(e).toLowerCase().includes(normalisedName)) {
      return buildResult(e, type);
    }
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
