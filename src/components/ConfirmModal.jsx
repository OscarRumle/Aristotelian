import { useEffect } from "react";

/**
 * Reusable confirmation modal.
 *
 * Props:
 *   title    — heading text (serif, large)
 *   message  — optional body copy (muted, small)
 *   actions  — array of { label, variant, onClick }
 *              variant is any btn class: "btn-primary" | "btn-ghost" | "btn-destroy"
 *   onClose  — called on backdrop click or Escape
 */
export function ConfirmModal({ title, message, actions, onClose }) {
  useEffect(() => {
    const trigger = document.activeElement;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <p className="modal-title">{title}</p>
          {message && <p className="modal-sub">{message}</p>}
        </div>
        <div className="modal-actions">
          {actions.map((a, i) => (
            <button
              key={i}
              type="button"
              className={`btn ${a.variant ?? "btn-ghost"}`}
              onClick={a.onClick}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
