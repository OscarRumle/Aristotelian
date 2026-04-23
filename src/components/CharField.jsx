import { useState } from "react";
import { AnimatedVerbs, VERBS } from "./AnimatedVerbs.jsx";

export function CharField({ label, value, fieldKey, onRegen, onRegenWithFeedback, onConfirm, regenningKey, philNote, children }) {
  const [showPhil, setShowPhil] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [pendingValue, setPendingValue] = useState(null);

  const isRegenning = regenningKey === fieldKey;

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !onRegenWithFeedback) return;
    setFeedbackOpen(false);
    const result = await onRegenWithFeedback(fieldKey, feedbackText.trim());
    setFeedbackText("");
    if (result != null) setPendingValue(result);
  };

  const handleConfirm = () => {
    onConfirm(fieldKey, pendingValue);
    setPendingValue(null);
  };

  const handleDiscard = () => {
    setPendingValue(null);
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
          {onRegenWithFeedback && pendingValue == null && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Give feedback on ${label}`}
              onClick={() => { setFeedbackOpen((p) => !p); setFeedbackText(""); }}
              disabled={!!regenningKey}
            >
              ✎
            </button>
          )}
          {pendingValue == null && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Regenerate ${label}`}
              onClick={() => onRegen(fieldKey)}
              disabled={!!regenningKey}
            >
              {isRegenning ? "…" : "↻"}
            </button>
          )}
        </div>
      </div>

      {isRegenning ? (
        <AnimatedVerbs verbs={VERBS.regen} compact />
      ) : pendingValue != null ? (
        <div className="cs-field-pending">
          <p className="cs-field-body">{pendingValue}</p>
          <div className="cs-field-pending-actions">
            <button type="button" className="icon-btn" onClick={handleConfirm}>✓ Confirm</button>
            <button type="button" className="icon-btn" onClick={handleDiscard}>✕ Discard</button>
          </div>
        </div>
      ) : (
        children || <p className="cs-field-body">{value || "—"}</p>
      )}

      {feedbackOpen && !isRegenning && pendingValue == null && (
        <div className="cs-feedback">
          <textarea
            className="cs-feedback-input"
            rows={2}
            placeholder="What to change…"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleFeedbackSubmit(); } }}
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

      {showPhil && philNote && <div className="phil-note">{philNote}</div>}
    </div>
  );
}
