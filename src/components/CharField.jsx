import { useState } from "react";
import { AnimatedVerbs, VERBS } from "./AnimatedVerbs.jsx";
import { TextReveal } from "./TextReveal.jsx";
import { useMentionInput } from "../hooks/useMentionInput.js";
import { MentionAutocomplete } from "./MentionAutocomplete.jsx";

export function CharField({
  label,
  value,
  fieldKey,
  onRegen,
  onRegenWithFeedback,
  onConfirm,
  onSave,
  onExpand,
  canExpand,
  regenningKey,
  philNote,
  world,
  children,
}) {
  const [showPhil, setShowPhil] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState("");

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const [expandOpen, setExpandOpen] = useState(false);
  const [expandMode, setExpandMode] = useState("vertical");
  const [expandDirection, setExpandDirection] = useState("");
  const [expandLoading, setExpandLoading] = useState(false);

  const [pendingValue, setPendingValue] = useState(null); // { text, type: "regen"|"expand" }
  const [settling, setSettling] = useState(false);

  const { mentionState, handleChange: handleMentionChange, handleKeyDown: handleMentionKeyDown, selectMention, clearMention, selectedIdx, onMoveSelection } = useMentionInput(world);

  const isRegenning = regenningKey === fieldKey;
  const isLoading = isRegenning || expandLoading;
  const hasPending = pendingValue != null;
  const anyPanelOpen = editOpen || feedbackOpen || expandOpen;
  const showActions = !isLoading && !hasPending && !anyPanelOpen;

  const handleRegen = async () => {
    if (!onRegen) return;
    const result = await onRegen(fieldKey);
    if (result != null) setPendingValue({ text: result, type: "regen" });
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !onRegenWithFeedback) return;
    setFeedbackOpen(false);
    const result = await onRegenWithFeedback(fieldKey, feedbackText.trim());
    setFeedbackText("");
    if (result != null) setPendingValue({ text: result, type: "regen" });
  };

  const handleExpandSubmit = async () => {
    if (!onExpand) return;
    setExpandOpen(false);
    setExpandLoading(true);
    try {
      const result = await onExpand(fieldKey, expandMode, expandDirection.trim());
      if (result != null) setPendingValue({ text: result, type: "expand" });
    } finally {
      setExpandLoading(false);
      setExpandDirection("");
    }
  };

  const handleConfirm = () => {
    if (!pendingValue) return;
    const isExpand = pendingValue.type === "expand";
    const finalValue = isExpand
      ? (value || "") + "\n\n" + pendingValue.text
      : pendingValue.text;
    onConfirm(fieldKey, finalValue);
    setPendingValue(null);
    if (isExpand) {
      setSettling(true);
      setTimeout(() => setSettling(false), 900);
    }
  };

  const handleDiscard = () => setPendingValue(null);

  const handleEditOpen = () => {
    setEditValue(value || "");
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (onSave) onSave(fieldKey, editValue.trim());
    setEditOpen(false);
  };

  const hasOverflow = (canExpand && onExpand) || onRegenWithFeedback;

  return (
    <div className="cs-field">
      <div className="cs-field-head">
        {philNote ? (
          <button
            type="button"
            className="cs-field-label cs-field-label-btn"
            aria-label={`Philosophy note for ${label}`}
            aria-expanded={showPhil}
            onClick={() => setShowPhil((p) => !p)}
          >
            {label}
            <span className="cs-field-label-hint" aria-hidden="true">?</span>
          </button>
        ) : (
          <span className="cs-field-label">{label}</span>
        )}
        <div className="cs-field-actions">
          {showActions && onSave && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Edit ${label}`}
              onClick={handleEditOpen}
            >
              Edit
            </button>
          )}
          {showActions && onRegen && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Regenerate ${label}`}
              title={`Regenerate ${label}`}
              onClick={handleRegen}
            >
              ↻
            </button>
          )}
          {showActions && hasOverflow && (
            <div className="cs-field-overflow">
              <button
                type="button"
                className="icon-btn"
                aria-label={`More actions for ${label}`}
                aria-haspopup="menu"
                aria-expanded={overflowOpen}
                onClick={() => setOverflowOpen((p) => !p)}
              >
                ⋯
              </button>
              {overflowOpen && (
                <>
                  <div className="cs-field-overflow-overlay" onClick={() => setOverflowOpen(false)} />
                  <div className="cs-field-overflow-panel" role="menu">
                    {onRegenWithFeedback && (
                      <button
                        type="button"
                        role="menuitem"
                        className="cs-field-overflow-item"
                        onClick={() => { setOverflowOpen(false); setFeedbackOpen(true); setFeedbackText(""); }}
                      >
                        ✎ Regenerate with feedback
                      </button>
                    )}
                    {canExpand && onExpand && (
                      <button
                        type="button"
                        role="menuitem"
                        className="cs-field-overflow-item"
                        onClick={() => { setOverflowOpen(false); setExpandOpen(true); }}
                      >
                        ✦ Expand
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {isRegenning ? (
        <AnimatedVerbs verbs={VERBS.regen} compact />
      ) : expandLoading ? (
        <>
          <p className="cs-field-body">{value || "—"}</p>
          <div className="cs-expand-sep"><span className="cs-expand-sep-label">↓ generating</span></div>
          <AnimatedVerbs verbs={VERBS.fieldExpand} compact />
        </>
      ) : editOpen ? (
        <div className="cs-field-edit">
          <textarea
            className="cs-feedback-input"
            rows={4}
            value={editValue}
            onChange={(e) => handleMentionChange(e, setEditValue)}
            onKeyDown={handleMentionKeyDown}
            autoFocus
          />
          {world && mentionState?.active && mentionState.query.length > 0 && (
            <MentionAutocomplete
              query={mentionState.query}
              world={world}
              anchorRect={mentionState.anchorRect}
              selectedIdx={selectedIdx}
              onSelect={(item) => selectMention(editValue, setEditValue, item.name, item.entityType)}
              onDismiss={clearMention}
              onMoveSelection={onMoveSelection}
            />
          )}
          <div className="cs-field-edit-actions">
            <button type="button" className="icon-btn" onClick={handleEditSave}>✓ Save</button>
            <button type="button" className="icon-btn" onClick={() => setEditOpen(false)}>✕ Discard</button>
          </div>
        </div>
      ) : hasPending && pendingValue.type === "expand" ? (
        <div className="cs-field-expand-preview">
          <p className="cs-field-body">{value || "—"}</p>
          <div className="cs-expand-sep"><span className="cs-expand-sep-label">↓ addition</span></div>
          <p className="cs-field-body cs-field-body--addition">
            <TextReveal text={pendingValue.text} />
          </p>
          <div className="cs-field-pending-actions">
            <button type="button" className="icon-btn" onClick={handleConfirm}>✓ Confirm</button>
            <button type="button" className="icon-btn" onClick={handleDiscard}>✕ Discard</button>
          </div>
        </div>
      ) : hasPending ? (
        <div className="cs-field-pending">
          <p className="cs-pending-label">New version:</p>
          <p className="cs-field-body">{pendingValue.text}</p>
          <div className="cs-field-pending-actions">
            <button type="button" className="icon-btn" onClick={handleConfirm}>✓ Confirm</button>
            <button type="button" className="icon-btn" onClick={handleDiscard}>✕ Discard</button>
          </div>
        </div>
      ) : (
        children || (
          <p className={`cs-field-body${settling ? " cs-field-body--settling" : ""}`}>
            {value || "—"}
          </p>
        )
      )}

      {feedbackOpen && !isLoading && !hasPending && (
        <div className="cs-feedback">
          <textarea
            className="cs-feedback-input"
            rows={2}
            placeholder="What to change…"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleFeedbackSubmit();
              }
            }}
            autoFocus
          />
          <button
            type="button"
            className="icon-btn"
            onClick={handleFeedbackSubmit}
            disabled={!feedbackText.trim()}
          >
            Regenerate →
          </button>
        </div>
      )}

      {expandOpen && !isLoading && !hasPending && (
        <div className="cs-expand-panel">
          <div className="cs-expand-toggle">
            <button
              type="button"
              className={`cs-expand-toggle-btn${expandMode === "vertical" ? " active" : ""}`}
              onClick={() => setExpandMode("vertical")}
            >
              Vertical
            </button>
            <button
              type="button"
              className={`cs-expand-toggle-btn${expandMode === "horizontal" ? " active" : ""}`}
              onClick={() => setExpandMode("horizontal")}
            >
              Horizontal
            </button>
          </div>
          <textarea
            className="cs-feedback-input"
            rows={2}
            placeholder="Direction (optional)…"
            value={expandDirection}
            onChange={(e) => setExpandDirection(e.target.value)}
          />
          <div className="cs-field-edit-actions">
            <button type="button" className="icon-btn" onClick={handleExpandSubmit}>
              Expand →
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => { setExpandOpen(false); setExpandDirection(""); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPhil && philNote && <div className="phil-note">{philNote}</div>}
    </div>
  );
}
