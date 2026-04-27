import { useState, useRef, useEffect } from "react";
import { useMentionInput } from "../hooks/useMentionInput.js";
import { MentionAutocomplete } from "./MentionAutocomplete.jsx";

export function EditableText({ value, onSave, multiline = false, className = "", placeholder = "", world = null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  const { mentionState, handleChange: handleMentionChange, handleKeyDown: handleMentionKeyDown, selectMention, clearMention, selectedIdx, onMoveSelection } = useMentionInput(world && multiline ? world : null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      if (inputRef.current) {
        const len = draft.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [editing]);

  const open = () => { setDraft(value); setEditing(true); };
  const save = () => { onSave(draft); setEditing(false); };
  const discard = () => setEditing(false);

  const handleKey = (e) => {
    if (!multiline && e.key === "Enter") { e.preventDefault(); save(); }
    if (e.key === "Escape") discard();
  };

  if (editing) {
    return (
      <div className="editable-text-wrap">
        {multiline ? (
          <>
            <textarea
              ref={inputRef}
              className={`editable-text-input ${className}`}
              value={draft}
              onChange={(e) => world ? handleMentionChange(e, setDraft) : setDraft(e.target.value)}
              onKeyDown={(e) => { if (world) handleMentionKeyDown(e); handleKey(e); }}
              placeholder={placeholder}
            />
            {world && mentionState?.active && (
              <MentionAutocomplete
                query={mentionState.query}
                world={world}
                anchorRect={mentionState.anchorRect}
                selectedIdx={selectedIdx}
                onSelect={(item) => selectMention(draft, setDraft, item.name, item.entityType)}
                onDismiss={clearMention}
                onMoveSelection={onMoveSelection}
              />
            )}
          </>
        ) : (
          <input
            ref={inputRef}
            className={`editable-text-input ${className}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
          />
        )}
        <div className="editable-text-actions">
          <button type="button" className="editable-save" onClick={save}>Save</button>
          <button type="button" className="editable-discard" onClick={discard}>Discard</button>
        </div>
      </div>
    );
  }

  return (
    <span className={`editable-text ${className}`} onClick={open} title="Click to edit">
      {value || <span className="editable-placeholder">{placeholder}</span>}
      <span className="editable-hint" aria-hidden="true">✎</span>
    </span>
  );
}
