import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { parseReferences, resolveEntity } from "../utils/referenceParser.js";
import { setHoverPreview, clearHoverPreview } from "./EntityHoverPreview.jsx";
import { CreateEntityPrompt } from "./CreateEntityPrompt.jsx";

/**
 * Renders prose text with [[Name|type]] reference markup as interactive tags.
 *
 * Resolved tags → colored dotted underline, click navigates to entity, hover shows preview.
 * Unresolved tags → dashed amber border with type badge, click opens "Create this?" popover.
 *
 * Props:
 *   text        — raw prose string (may contain [[...]] markup)
 *   world       — world object for entity resolution
 *   onNavigate  — (entityType, entityId) → void
 *   onCreateFromRef — ({ entityType, name, sourceText, ... }) → void
 *   sourceContext   — { entityType, entityId, fieldKey } describing where this text lives
 */
export function RichText({ text, world, onNavigate, onCreateFromRef, sourceContext }) {
  const [createPrompt, setCreatePrompt] = useState(null);
  // { name, typeHint, anchorRect, sourceText }

  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = useCallback((entity, anchorRect) => {
    clearTimeout(hoverTimeoutRef.current);
    setHoverPreview({ entity, anchorRect });
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => clearHoverPreview(), 120);
  }, []);

  if (!text) return null;

  const segments = parseReferences(text);

  // If the text has no tags at all, render as plain text to avoid React overhead
  const hasTags = segments.some((s) => s.kind === 'tag');
  if (!hasTags) {
    return <p className="cs-field-body">{text}</p>;
  }

  const handleResolvedClick = (entity) => {
    onNavigate?.(entity.type, entity.id);
  };

  const handleUnresolvedClick = (name, typeHint, buttonEl) => {
    const rect = buttonEl.getBoundingClientRect();
    setCreatePrompt({ name, typeHint, anchorRect: rect, sourceText: text });
  };

  const handleCreateConfirm = (confirmedName, confirmedType) => {
    setCreatePrompt(null);
    onCreateFromRef?.({
      entityType: confirmedType,
      name: confirmedName,
      sourceText: text,
      sourceEntityType: sourceContext?.entityType,
      sourceEntityId: sourceContext?.entityId,
      sourceFieldKey: sourceContext?.fieldKey,
    });
  };

  return (
    <>
      <p className="cs-field-body rt-body">
        {segments.map((seg, i) => {
          if (seg.kind === 'text') {
            return seg.value;
          }

          const resolved = resolveEntity(world, seg.name, seg.typeHint);

          if (resolved) {
            return (
              <span
                key={i}
                className={`rt-tag rt-tag--resolved rt-tag--${resolved.type}`}
              >
                <button
                  type="button"
                  className="rt-tag-link"
                  onClick={() => handleResolvedClick(resolved)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleMouseEnter(resolved, rect);
                  }}
                  onMouseLeave={handleMouseLeave}
                  onFocus={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleMouseEnter(resolved, rect);
                  }}
                  onBlur={handleMouseLeave}
                  aria-label={`Navigate to ${resolved.type}: ${resolved.name}`}
                >
                  {resolved.name}
                </button>
              </span>
            );
          }

          // Unresolved tag
          return (
            <span key={i} className="rt-tag rt-tag--unresolved">
              <button
                type="button"
                className="rt-tag-potential"
                onClick={(e) => handleUnresolvedClick(seg.name, seg.typeHint, e.currentTarget)}
                aria-label={`Create entity: ${seg.name}`}
              >
                {seg.name}
              </button>
              {seg.typeHint && (
                <span className="rt-tag-type-hint" aria-hidden="true">
                  {seg.typeHint}
                </span>
              )}
            </span>
          );
        })}
      </p>

      {createPrompt && createPortal(
        <CreateEntityPrompt
          name={createPrompt.name}
          typeHint={createPrompt.typeHint}
          anchorRect={createPrompt.anchorRect}
          onConfirm={handleCreateConfirm}
          onCancel={() => setCreatePrompt(null)}
        />,
        document.body
      )}
    </>
  );
}
