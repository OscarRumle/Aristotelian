import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { filterEntities } from "../hooks/useMentionInput.js";

const DROPDOWN_HEIGHT_ESTIMATE = 280;
const MARGIN = 4;

/**
 * Portaled dropdown that appears when the user types @query in a text field.
 *
 * Props:
 *   query          — current search string (after the @)
 *   world          — full world object for entity lookup
 *   anchorRect     — DOMRect of the textarea (used for positioning)
 *   selectedIdx    — currently highlighted row index (controlled)
 *   onSelect       — ({ id, entityType, name, subtitle }) => void
 *   onDismiss      — () => void — called on Escape or outside click
 *   onMoveSelection — (delta: +1 | -1) => void
 */
export function MentionAutocomplete({ query, world, anchorRect, selectedIdx, onSelect, onDismiss, onMoveSelection }) {
  const dropdownRef = useRef(null);
  const results = filterEntities(world, query);

  // Clamp selectedIdx to valid range
  const clampedIdx = results.length > 0 ? Math.min(selectedIdx, results.length - 1) : 0;

  // Position: below the textarea by default, flip above if near bottom of viewport
  const top = anchorRect
    ? (anchorRect.bottom + MARGIN + DROPDOWN_HEIGHT_ESTIMATE > window.innerHeight
        ? Math.max(8, anchorRect.top - DROPDOWN_HEIGHT_ESTIMATE - MARGIN)
        : anchorRect.bottom + MARGIN)
    : 0;
  const left = anchorRect
    ? Math.max(8, Math.min(anchorRect.left, window.innerWidth - 340))
    : 0;

  // Close on outside click
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

  // Enter to confirm selection, Escape to dismiss
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        onSelect(results[clampedIdx]);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [results, clampedIdx, onSelect]);

  if (!anchorRect) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="mention-dropdown"
      style={{ position: 'fixed', top, left, zIndex: 1200 }}
      role="listbox"
      aria-label="Entity suggestions"
    >
      {results.length === 0 ? (
        query.length > 0 && <div className="mention-empty">No match</div>
      ) : (
        results.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={i === clampedIdx}
            className={`mention-item${i === clampedIdx ? ' mention-item--active' : ''}`}
            onMouseDown={(e) => {
              // Use mousedown so the textarea doesn't lose focus before we can read its value
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
        ))
      )}
    </div>,
    document.body
  );
}
