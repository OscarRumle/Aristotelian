import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { filterEntities } from "../hooks/useMentionInput.js";

const DROPDOWN_HEIGHT_ESTIMATE = 320;
const MARGIN = 4;

const TYPE_CHIPS = [
  { value: null,        label: "All" },
  { value: "character", label: "Char" },
  { value: "object",    label: "Obj" },
  { value: "location",  label: "Loc" },
  { value: "faction",   label: "Faction" },
  { value: "lore",      label: "Lore" },
];

/**
 * Portaled dropdown that appears when the user types @query in a text field.
 *
 * Props:
 *   query           — current search string (after the @)
 *   world           — full world object for entity lookup
 *   anchorRect      — DOMRect of the textarea (used for positioning)
 *   selectedIdx     — currently highlighted row index (controlled)
 *   onSelect        — ({ id, entityType, name, subtitle }) => void
 *   onSelectNew     — optional ({ name, entityType }) => void — invoked when user picks "Create new"
 *   onDismiss       — () => void — called on Escape or outside click
 *   onMoveSelection — (delta: +1 | -1) => void
 */
export function MentionAutocomplete({ query, world, anchorRect, selectedIdx, onSelect, onSelectNew, onDismiss, onMoveSelection }) {
  const dropdownRef = useRef(null);
  const [typeFilter, setTypeFilter] = useState(null);

  const allResults = filterEntities(world, query);
  const results = typeFilter
    ? allResults.filter((r) => r.entityType === typeFilter)
    : allResults;

  // Show "Create new" row when there's a query and no exact (case-insensitive) name match
  // matches the typed query under the active type filter.
  const trimmed = query.trim();
  const exactMatch = trimmed && results.some((r) => r.name.toLowerCase() === trimmed.toLowerCase());
  const showCreateNew = !!onSelectNew && trimmed.length > 0 && !exactMatch;
  const createNewType = typeFilter ?? "character";

  const totalRows = results.length + (showCreateNew ? 1 : 0);
  const clampedIdx = totalRows > 0 ? Math.min(selectedIdx, totalRows - 1) : 0;
  const isCreateNewRow = showCreateNew && clampedIdx === results.length;

  const top = anchorRect
    ? (anchorRect.bottom + MARGIN + DROPDOWN_HEIGHT_ESTIMATE > window.innerHeight
        ? Math.max(8, anchorRect.top - DROPDOWN_HEIGHT_ESTIMATE - MARGIN)
        : anchorRect.bottom + MARGIN)
    : 0;
  const left = anchorRect
    ? Math.max(8, Math.min(anchorRect.left, window.innerWidth - 340))
    : 0;

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onDismiss();
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
    };
  }, [onDismiss]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Enter') return;
      if (totalRows === 0) return;
      e.preventDefault();
      if (isCreateNewRow && onSelectNew) {
        onSelectNew({ name: trimmed, entityType: createNewType });
      } else if (results[clampedIdx]) {
        onSelect(results[clampedIdx]);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [results, clampedIdx, isCreateNewRow, onSelect, onSelectNew, trimmed, createNewType, totalRows]);

  if (!anchorRect) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="mention-dropdown"
      style={{ position: 'fixed', top, left, zIndex: 1200 }}
      role="listbox"
      aria-label="Entity suggestions"
    >
      <div className="mention-chip-row" role="tablist" aria-label="Filter by type">
        {TYPE_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            role="tab"
            aria-selected={typeFilter === chip.value}
            className={`mention-chip${typeFilter === chip.value ? " mention-chip--active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); setTypeFilter(chip.value); }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {results.length === 0 && !showCreateNew ? (
        query.length > 0 && <div className="mention-empty">No match</div>
      ) : (
        <>
          {results.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={i === clampedIdx}
              className={`mention-item${i === clampedIdx ? ' mention-item--active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
            >
              <span className="mention-item-name">{item.name}</span>
              {item.subtitle && (
                <span className="mention-item-subtitle">{item.subtitle}</span>
              )}
              <span className={`mention-item-type mention-item-type--${item.entityType}`}>
                {item.entityType}
              </span>
            </button>
          ))}
          {showCreateNew && (
            <button
              type="button"
              role="option"
              aria-selected={isCreateNewRow}
              className={`mention-item mention-item--create${isCreateNewRow ? ' mention-item--active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectNew?.({ name: trimmed, entityType: createNewType });
              }}
            >
              <span className="mention-item-name">+ Create new {createNewType} <em>"{trimmed}"</em></span>
              <span className={`mention-item-type mention-item-type--${createNewType}`}>{createNewType}</span>
            </button>
          )}
        </>
      )}
    </div>,
    document.body
  );
}
