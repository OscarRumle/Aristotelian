import { useState } from "react";
import { AnimatedVerbs, VERBS } from "./AnimatedVerbs.jsx";

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
  children,
}) {
  const [showPhil, setShowPhil] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState("");

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const [expandOpen, setExpandOpen] = useState(false);
  const [expandMode, setExpandMode] = useState("vertical");
  const [expandDirection, setExpandDirection] = useState("");
  const [expandLoading, setExpandLoading] = useState(false);

  const [pendingValue, setPendingValue] = useState(null); // { text, type: "regen"|"expand" }

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
    const finalValue = pendingValue.type === "expand"
      ? (value || "") + "\n\n" + pendingValue.text
      : pendingValue.text;
    onConfirm(fieldKey, finalValue);
    setPendingValue(null);
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

  return (
    <div className="cs-field">
      <div className="cs-field-head">
        <span className="cs-field-label">{label}</span>
        <div className="cs-field-actions">
          {philNote && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Philosophy note for ${label}`}
              onClick={() => setShowPhil((p) => !p)}
            >
              ?
            </button>
          )}
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
          {showActions && canExpand && onExpand && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Expand ${label}`}
              onClick={() => setExpandOpen(true)}
            >
              ✦
            </button>
          )}
          {showActions && onRegenWithFeedback && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Give feedback on ${label}`}
              onClick={() => { setFeedbackOpen((p) => !p); setFeedbackText(""); }}
            >
              ✎
            </button>
          )}
          {showActions && onRegen && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Regenerate ${label}`}
              onClick={handleRegen}
            >
              ↻
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <AnimatedVerbs verbs={expandLoading ? VERBS.fieldExpand : VERBS.regen} compact />
      ) : editOpen ? (
        <div className="cs-field-edit">
          <textarea
            className="cs-feedback-input"
            rows={4}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
          />
          <div className="cs-field-edit-actions">
            <button type="button" className="icon-btn" onClick={handleEditSave}>✓ Save</button>
            <button type="button" className="icon-btn" onClick={() => setEditOpen(false)}>✕ Discard</button>
          </div>
        </div>
      ) : hasPending ? (
        <div className="cs-field-pending">
          <p className="cs-pending-label">
            {pendingValue.type === "expand" ? "Will append:" : "New version:"}
          </p>
          <p className="cs-field-body">{pendingValue.text}</p>
          <div className="cs-field-pending-actions">
            <button type="button" className="icon-btn" onClick={handleConfirm}>✓ Confirm</button>
            <button type="button" className="icon-btn" onClick={handleDiscard}>✕ Discard</button>
          </div>
        </div>
      ) : (
        children || <p className="cs-field-body">{value || "—"}</p>
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
