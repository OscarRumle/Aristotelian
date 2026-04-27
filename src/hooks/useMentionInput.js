import { useState, useCallback } from "react";

const ENTITY_TYPES = ['character', 'faction', 'location', 'object', 'lore'];

// ---------------------------------------------------------------------------
// Entity filtering
// ---------------------------------------------------------------------------

function getEntityArray(world, type) {
  switch (type) {
    case 'character': return world?.characters ?? [];
    case 'faction':   return world?.factions ?? [];
    case 'location':  return world?.locations ?? [];
    case 'object':    return world?.objects ?? [];
    case 'lore':      return world?.documents ?? [];
    default:          return [];
  }
}

function getName(entity, type) {
  return (type === 'lore' ? entity.title : entity.name) ?? '';
}

function getSubtitle(entity, type) {
  switch (type) {
    case 'character': return entity.role ?? '';
    case 'faction':   return entity.type ?? '';
    case 'location':  return entity.type ?? '';
    case 'object':    return entity.type ?? '';
    case 'lore':      return 'lore';
    default:          return '';
  }
}

export function filterEntities(world, query) {
  if (!world || !query) return [];
  const q = query.toLowerCase();
  const results = [];

  for (const type of ENTITY_TYPES) {
    const arr = getEntityArray(world, type);
    for (const e of arr) {
      const name = getName(e, type).toLowerCase();
      if (name.startsWith(q)) {
        results.push({ id: e.id, entityType: type, name: getName(e, type), subtitle: getSubtitle(e, type) });
      }
    }
  }

  // If fewer than 8 prefix matches, fill with substring matches
  if (results.length < 8) {
    const prefixIds = new Set(results.map((r) => r.id));
    for (const type of ENTITY_TYPES) {
      if (results.length >= 8) break;
      const arr = getEntityArray(world, type);
      for (const e of arr) {
        if (results.length >= 8) break;
        if (prefixIds.has(e.id)) continue;
        const name = getName(e, type).toLowerCase();
        if (name.includes(q)) {
          results.push({ id: e.id, entityType: type, name: getName(e, type), subtitle: getSubtitle(e, type) });
        }
      }
    }
  }

  return results.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Anchor rect: estimate caret Y by counting newlines before the cursor.
// Exact pixel-perfect caret measurement requires a mirror element;
// line-count approximation is close enough for dropdown placement.
// ---------------------------------------------------------------------------

function getAnchorRect(textarea) {
  if (!textarea) return null;
  const full = textarea.getBoundingClientRect();
  const pos = textarea.selectionStart ?? 0;
  const textBefore = textarea.value.slice(0, pos);
  const lineCount = (textBefore.match(/\n/g) || []).length;
  const computed = getComputedStyle(textarea);
  const lineHeight = parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.5 || 22;
  const paddingTop = parseFloat(computed.paddingTop) || 0;
  const caretY = full.top + paddingTop + lineCount * lineHeight;
  return {
    top: caretY,
    bottom: caretY + lineHeight,
    left: full.left,
    right: full.right,
    width: full.width,
    height: lineHeight,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useMentionInput(world)
 *
 * Returns:
 *   mentionState: { active, query, queryStart, anchorRect } | null
 *   handleChange(e, setValue)  — wrap textarea onChange
 *   handleKeyDown(e)           — wrap textarea onKeyDown
 *   selectMention(text, setValue, entityName, entityType) — call on item select
 *   clearMention()             — dismiss without inserting
 *   selectedIdx                — currently highlighted row
 *   onMoveSelection(delta)     — +1 or -1
 */
export function useMentionInput(world) {
  const [mentionState, setMentionState] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const clearMention = useCallback(() => {
    setMentionState(null);
    setSelectedIdx(0);
  }, []);

  const handleChange = useCallback((e, setValue) => {
    const val = e.target.value;
    setValue(val);

    const pos = e.target.selectionStart ?? val.length;

    // Scan backward from cursor to find an @ with no whitespace between it and cursor
    let atIdx = -1;
    for (let i = pos - 1; i >= 0; i--) {
      const ch = val[i];
      if (ch === '@') { atIdx = i; break; }
      if (/\s/.test(ch)) break;
    }

    if (atIdx === -1) {
      setMentionState(null);
      return;
    }

    const query = val.slice(atIdx + 1, pos);
    if (query.length === 0) {
      // Just typed @, show dropdown immediately only if there are entities
      setMentionState({ active: true, query: '', queryStart: atIdx + 1, anchorRect: getAnchorRect(e.target) });
      setSelectedIdx(0);
      return;
    }

    setMentionState({ active: true, query, queryStart: atIdx + 1, anchorRect: getAnchorRect(e.target) });
    setSelectedIdx(0);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!mentionState?.active) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => i + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      clearMention();
    }
    // Enter is handled in MentionAutocomplete's onSelect via selectedIdx
  }, [mentionState, clearMention]);

  const selectMention = useCallback((text, setValue, entityName, entityType) => {
    if (!mentionState) return;
    const { queryStart } = mentionState;
    // queryStart is the index right after @, so the @ is at queryStart-1
    const atIdx = queryStart - 1;
    const token = `[[${entityName}]]`;
    const before = text.slice(0, atIdx);
    const after = text.slice(queryStart + mentionState.query.length);
    setValue(before + token + after);
    clearMention();
  }, [mentionState, clearMention]);

  const onMoveSelection = useCallback((delta) => {
    setSelectedIdx((i) => Math.max(0, i + delta));
  }, []);

  return { mentionState, handleChange, handleKeyDown, selectMention, clearMention, selectedIdx, onMoveSelection };
}
