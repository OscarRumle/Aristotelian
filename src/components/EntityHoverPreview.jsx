import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Floating hover card displayed when a resolved [[tag]] is hovered.
 *
 * Reads from the hoverPreview module-level singleton (set by RichText.jsx).
 * Portaled to document.body to avoid z-index / overflow clipping.
 */

// Module-level singleton — RichText sets this, EntityHoverPreview reads it.
let _listeners = [];
let _state = null;

export function setHoverPreview(state) {
  _state = state;
  _listeners.forEach((fn) => fn(state));
}

export function clearHoverPreview() {
  _state = null;
  _listeners.forEach((fn) => fn(null));
}

function useHoverPreviewState() {
  const [state, setState] = useState(_state);
  useEffect(() => {
    _listeners.push(setState);
    return () => {
      _listeners = _listeners.filter((fn) => fn !== setState);
    };
  }, []);
  return state;
}

// Type labels for the badge
const TYPE_LABELS = {
  character: 'Character',
  object: 'Object',
  location: 'Location',
  faction: 'Faction',
  lore: 'Lore',
};

export function EntityHoverPreview() {
  const preview = useHoverPreviewState();
  const cardRef = useRef(null);

  if (!preview) return null;

  const { entity, anchorRect } = preview;

  // Position: above the anchor by default, shift down if near top
  const CARD_HEIGHT_ESTIMATE = 110;
  const MARGIN = 8;
  const top = anchorRect.top - CARD_HEIGHT_ESTIMATE - MARGIN < 0
    ? anchorRect.bottom + MARGIN
    : anchorRect.top - CARD_HEIGHT_ESTIMATE - MARGIN;

  const left = Math.max(8, Math.min(
    anchorRect.left,
    window.innerWidth - 296 // 280px card + 16px margin
  ));

  return createPortal(
    <div
      ref={cardRef}
      className="entity-hover-preview"
      style={{ top, left }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="entity-hover-preview-header">
        <span className={`entity-hover-preview-type entity-hover-preview-type--${entity.type}`}>
          {TYPE_LABELS[entity.type] ?? entity.type}
        </span>
      </div>
      <div className="entity-hover-preview-name">{entity.name}</div>
      {entity.summary && (
        <p className="entity-hover-preview-summary">{entity.summary}</p>
      )}
    </div>,
    document.body
  );
}
