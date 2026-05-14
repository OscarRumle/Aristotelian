import { useState, useEffect, useRef, useMemo } from "react";
import {
  LENS_LABELS,
  LENS_DESCRIPTIONS,
  PER_TOOL_LENSES,
  LENS_DISCOVERED_KEY,
  LENS_HINT_DISMISSED_KEY,
} from "../constants.js";

// Description lookup that handles the null key (LENS_DESCRIPTIONS keys are
// strings, so null is mapped to the "none" key).
function descriptionFor(lens) {
  if (lens == null) return LENS_DESCRIPTIONS.none;
  return LENS_DESCRIPTIONS[lens] ?? "";
}

function labelFor(lens) {
  if (lens == null) return "None";
  return LENS_LABELS[lens] ?? "Hamartia";
}

/**
 * Collapsed-by-default pill row that lets the user pick the Aristotelian lens
 * the LLM uses to angle generation. See docs/design/aristotelian_lens_system.md.
 *
 * Props:
 * - tool: "character" | "faction" | "location" | "object" | "dialogue"
 * - style: "Tragic" | "Comic" | "Mixed" | null — controls whether `gap` shows
 * - value: lens id string (or null for the explicit None opt-out)
 * - onChange(nextLens): called when the user picks a different lens
 */
export function LensSelector({ tool, style, value, onChange }) {
  // One-way switch: once a user expands the selector anywhere, every form
  // opens with it already expanded across sessions.
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LENS_DISCOVERED_KEY) === "true";
  });
  // First-time auto-show: triggered when the user expands for the first time
  // AND the hint hasn't been dismissed yet. After dismissal, the hint can be
  // reopened on demand via the ⓘ button (hintForceVisible).
  const [hintAutoVisible, setHintAutoVisible] = useState(false);
  const [hintForceVisible, setHintForceVisible] = useState(false);
  const hintVisible = hintAutoVisible || hintForceVisible;

  const chipsRef = useRef(null);

  const allLensIds = PER_TOOL_LENSES[tool] ?? [];
  const lensIds = useMemo(() => {
    return allLensIds.filter((id) => {
      // gap chip is only available when style is Comic or Mixed
      if (id === "gap" && style !== "Comic" && style !== "Mixed") return false;
      return true;
    });
  }, [allLensIds, style]);

  // If the current value is no longer a valid option (e.g. style changed and
  // gap was hidden), fall back to the first chip — usually the default.
  useEffect(() => {
    if (!lensIds.includes(value) && lensIds.length > 0 && value !== undefined) {
      onChange(lensIds[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lensIds.join("|")]);

  const handleHeaderClick = () => {
    if (expanded) {
      // Expanded state is one-way per spec. Don't allow re-collapse.
      return;
    }
    const wasFirstTime =
      typeof window !== "undefined" &&
      window.localStorage.getItem(LENS_DISCOVERED_KEY) !== "true";
    try {
      window.localStorage.setItem(LENS_DISCOVERED_KEY, "true");
    } catch { /* localStorage may be disabled */ }
    setExpanded(true);
    const hintDismissed =
      typeof window !== "undefined" &&
      window.localStorage.getItem(LENS_HINT_DISMISSED_KEY) === "true";
    if (wasFirstTime && !hintDismissed) {
      setHintAutoVisible(true);
    }
  };

  const handleReopenHint = (e) => {
    e.stopPropagation();
    setHintForceVisible(true);
  };

  const dismissHint = () => {
    try {
      window.localStorage.setItem(LENS_HINT_DISMISSED_KEY, "true");
    } catch { /* localStorage may be disabled */ }
    setHintAutoVisible(false);
    setHintForceVisible(false);
  };

  const onChipKeyDown = (e, idx) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = lensIds[(idx + 1) % lensIds.length];
      onChange(next);
      focusChipAtIndex((idx + 1) % lensIds.length);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = (idx - 1 + lensIds.length) % lensIds.length;
      onChange(lensIds[prevIdx]);
      focusChipAtIndex(prevIdx);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(lensIds[0]);
      focusChipAtIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(lensIds[lensIds.length - 1]);
      focusChipAtIndex(lensIds.length - 1);
    }
  };

  const focusChipAtIndex = (idx) => {
    const buttons = chipsRef.current?.querySelectorAll(".lens-chip");
    if (!buttons) return;
    buttons[idx]?.focus();
  };

  // Selected chip is whatever matches `value`; if value isn't in lensIds
  // (shouldn't normally happen), the first chip is highlighted as a fallback.
  const selectedIdx = lensIds.indexOf(value);
  const safeSelectedIdx = selectedIdx === -1 ? 0 : selectedIdx;

  return (
    <div className={`lens-selector${expanded ? " is-expanded" : ""}`}>
      {!expanded && (
        <button
          type="button"
          className="lens-collapsed"
          onClick={handleHeaderClick}
          aria-expanded="false"
          aria-controls="lens-chip-row"
        >
          <span className="lens-collapsed-prefix">Generated with:</span>{" "}
          <span className="lens-collapsed-current">{labelFor(value)}</span>
          <span className="lens-collapsed-chev" aria-hidden="true">▾</span>
          <span
            role="button"
            tabIndex={0}
            className="lens-help"
            aria-label="Show lens explainer"
            onClick={handleReopenHint}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleReopenHint(e); } }}
          >
            ⓘ
          </span>
        </button>
      )}

      {expanded && (
        <>
          <div
            ref={chipsRef}
            id="lens-chip-row"
            className="lens-chip-row"
            role="radiogroup"
            aria-label="Generation lens"
          >
            {lensIds.map((id, idx) => {
              const isSelected = id === value;
              const isNone = id == null;
              return (
                <button
                  key={String(id)}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={idx === safeSelectedIdx ? 0 : -1}
                  className={`lens-chip${isSelected ? " is-selected" : ""}${isNone ? " is-none" : ""}`}
                  onClick={() => onChange(id)}
                  onKeyDown={(e) => onChipKeyDown(e, idx)}
                >
                  {labelFor(id)}
                </button>
              );
            })}
            <span
              role="button"
              tabIndex={0}
              className="lens-help lens-help-inline"
              aria-label="Show lens explainer"
              onClick={handleReopenHint}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleReopenHint(e); } }}
            >
              ⓘ
            </span>
          </div>
          <div className="lens-desc" aria-live="polite" key={String(value)}>
            {descriptionFor(value)}
          </div>
          {hintVisible && (
            <div className="lens-hint-card" role="status">
              <p className="lens-hint-body">
                <strong>Lenses change the angle of generation.</strong> Same world, same inputs —
                but a different lens asks the LLM a different question about your character.
                Hamartia (the default) generates a fatal flaw from their greatest strength. The
                others ask about what they don't yet know, what they're becoming, how they argue.
                Pick one or stay with Hamartia.
              </p>
              <button type="button" className="btn btn-ghost lens-hint-dismiss" onClick={dismissHint}>
                Got it
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
