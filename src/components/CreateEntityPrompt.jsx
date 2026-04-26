import { useState, useEffect, useRef } from "react";

const ENTITY_TYPES = [
  { value: 'character', label: 'Character' },
  { value: 'object',    label: 'Object' },
  { value: 'location',  label: 'Location' },
  { value: 'faction',   label: 'Faction' },
  { value: 'lore',      label: 'Lore' },
];

/**
 * Small popover that appears when an unresolved [[tag]] is clicked.
 * Lets the user confirm name + type before routing to entity creation.
 *
 * Props:
 *   name        — pre-filled entity name (editable)
 *   typeHint    — pre-selected entity type (changeable)
 *   anchorRect  — DOMRect of the clicked button (for positioning)
 *   onConfirm   — (name, type) => void
 *   onCancel    — () => void
 */
export function CreateEntityPrompt({ name: initialName, typeHint, anchorRect, onConfirm, onCancel }) {
  const [entityName, setEntityName] = useState(initialName ?? '');
  const [entityType, setEntityType] = useState(typeHint ?? 'character');
  const inputRef = useRef(null);
  const popoverRef = useRef(null);

  // Position: below the anchor by default, shift up if near bottom
  const POPOVER_HEIGHT_ESTIMATE = 160;
  const MARGIN = 8;
  const top = anchorRect.bottom + MARGIN + POPOVER_HEIGHT_ESTIMATE > window.innerHeight
    ? anchorRect.top - POPOVER_HEIGHT_ESTIMATE - MARGIN
    : anchorRect.bottom + MARGIN;
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 288));

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  // Close on backdrop click (outside the popover)
  useEffect(() => {
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onCancel();
      }
    };
    // small delay so the original click that opened the popover doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
    };
  }, [onCancel]);

  const handleConfirm = () => {
    const trimmed = entityName.trim();
    if (!trimmed) return;
    onConfirm(trimmed, entityType);
  };

  return (
    <div
      ref={popoverRef}
      className="create-entity-prompt"
      style={{ position: 'fixed', top, left, zIndex: 1100 }}
      role="dialog"
      aria-label={`Create entity: ${entityName}`}
    >
      <p className="create-entity-prompt-title">
        Create <strong>"{entityName}"</strong>?
      </p>

      <label className="create-entity-prompt-label">
        Name
        <input
          ref={inputRef}
          type="text"
          className="create-entity-prompt-input"
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
          }}
        />
      </label>

      <label className="create-entity-prompt-label">
        Type
        <select
          className="create-entity-prompt-select"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      <div className="create-entity-prompt-actions">
        <button type="button" className="icon-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary create-entity-prompt-confirm"
          onClick={handleConfirm}
          disabled={!entityName.trim()}
        >
          Confirm →
        </button>
      </div>
    </div>
  );
}
