import { useState, useEffect } from "react";
import { PHASES, LENS_LABELS } from "../constants.js";
import { AnimatedDots } from "./AnimatedDots.jsx";
import { Typewriter } from "./Typewriter.jsx";

export function GeneratingOverlay({ phaseIdx, doneIds, verb, justDone, onCancel, lens }) {
  const [typed, setTyped] = useState(false);
  useEffect(() => setTyped(false), [verb]);
  const color = justDone ? "var(--sage)" : "var(--amber)";
  const verbBase = verb.replace(/[.…]+$/, "");
  // Lens indicator — suppress when lens is null/none or unknown.
  const lensLabel = lens && LENS_LABELS[lens] ? LENS_LABELS[lens] : null;
  return (
    <div className="gen-overlay" role="status" aria-live="polite" aria-label="Generating character">
      <div className="gen-verb-wrap">
        <p className="gen-verb" style={{ color, transition: "color .4s ease" }}>
          <Typewriter key={verb} text={verbBase} onDone={() => setTyped(true)} />
          {typed && !justDone && <AnimatedDots />}
          {justDone && (
            <span style={{ marginLeft: ".35em", animation: "checkIn .3s ease both" }} aria-hidden="true">
              ✓
            </span>
          )}
        </p>
        <p className="gen-phase-name">{PHASES[phaseIdx]?.label}</p>
        {lensLabel && (
          <p className="gen-lens-indicator">through the lens of <em>{lensLabel}</em></p>
        )}
      </div>
      {onCancel && (
        <button type="button" className="gen-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
}
