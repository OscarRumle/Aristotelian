import { useState, useEffect } from "react";
import { callClaude } from "../api/claude.js";
import { buildConsistencyScanPrompt, buildReviewFixPrompt } from "../prompts/reviewPrompt.js";
import { AnimatedVerbs, VERBS } from "./AnimatedVerbs.jsx";

function parseJson(raw) {
  const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(cleaned);
}

export function ReviewOverlay({ character, world, onClose, onApplyFix, onComplete }) {
  const [phase, setPhase] = useState("setup");
  const [scrutiny, setScrutiny] = useState("mid");
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState("A");
  const [customText, setCustomText] = useState("");
  const [pendingFix, setPendingFix] = useState(null);
  const [error, setError] = useState(null);

  async function runScan() {
    setPhase("scanning");
    setError(null);
    try {
      const raw = await callClaude(
        buildConsistencyScanPrompt(character, world, scrutiny),
        "Scanning character for inconsistencies",
        { maxTokens: 1500 }
      );
      const data = parseJson(raw);
      if (!Array.isArray(data) || data.length === 0) {
        setItems([]);
        setPhase("done");
      } else {
        setItems(data);
        setIdx(0);
        setSelected(data[0].recommended ?? "A");
        setPhase("reviewing");
      }
    } catch {
      setError("Couldn't scan the character. Check your connection and try again.");
      setPhase("error");
    }
  }

  async function handleApply() {
    const item = items[idx];
    const instruction =
      selected === "A" ? item.optionA.instruction
      : selected === "B" ? item.optionB.instruction
      : customText.trim();
    if (!instruction) return;

    setPhase("applying");
    try {
      const raw = await callClaude(
        buildReviewFixPrompt(character, world, item.fieldKey, item.fieldLabel, instruction),
        `Rewriting ${item.fieldLabel}`,
        { maxTokens: 600 }
      );
      setPendingFix({ fieldKey: item.fieldKey, fieldLabel: item.fieldLabel, value: raw.trim() });
      setPhase("pending");
    } catch {
      setError("Couldn't apply the fix. Try again.");
      setPhase("reviewing");
    }
  }

  function handleConfirm() {
    onApplyFix(pendingFix.fieldKey, pendingFix.value);
    setPendingFix(null);
    advance();
  }

  function handleDiscard() {
    setPendingFix(null);
    setPhase("reviewing");
  }

  function advance() {
    if (idx + 1 >= items.length) {
      setPhase("done");
    } else {
      const next = idx + 1;
      setIdx(next);
      setSelected(items[next].recommended ?? "A");
      setCustomText("");
      setPhase("reviewing");
    }
  }

  const item = items[idx];
  const total = items.length;

  return (
    <div className="review-overlay">
      <div className="review-inner">

        <div className="review-header">
          <button type="button" className="back-btn" onClick={onClose}>
            ← {character.name || "Character"}
          </button>
          {phase === "reviewing" && total > 1 && (
            <span className="review-progress">{idx + 1} of {total}</span>
          )}
        </div>

        {phase === "setup" && (
          <div className="review-setup">
            <h2 className="review-setup-title">Review character</h2>
            <p className="review-setup-body">
              Scan {character.name || "this character"} for internal inconsistencies between fields.
            </p>
            <div className="review-setup-level">
              <span className="review-setup-label">Scrutiny</span>
              <div className="cs-expand-toggle">
                {[
                  { key: "low", label: "Low" },
                  { key: "mid", label: "Mid" },
                  { key: "high", label: "High" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`cs-expand-toggle-btn${scrutiny === key ? " active" : ""}`}
                    onClick={() => setScrutiny(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="review-scrutiny-desc">
                {scrutiny === "low" && "Catches only obvious contradictions — things that would confuse any reader."}
                {scrutiny === "mid" && "Balanced — flags contradictions a careful reader would notice."}
                {scrutiny === "high" && "Thorough — flags subtle tensions too, including close-reading friction."}
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={runScan}>
              Start Review →
            </button>
          </div>
        )}

        {phase === "scanning" && (
          <div className="review-centered">
            <AnimatedVerbs verbs={VERBS.scan} subtitle="Reading the character…" />
          </div>
        )}

        {phase === "error" && (
          <div className="review-centered">
            <p className="review-error-msg">{error}</p>
            <div style={{ display: "flex", gap: ".75rem", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-primary" onClick={runScan}>Try again</button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="review-centered">
            <p className="review-done-title">
              {total === 0 ? "No inconsistencies found" : "Review complete"}
            </p>
            <p className="review-done-body">
              {total === 0
                ? "This character reads as internally consistent."
                : `${total} inconsistenc${total === 1 ? "y" : "ies"} reviewed.`}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: "1.5rem" }}
              onClick={onComplete}
            >
              Done
            </button>
          </div>
        )}

        {phase === "reviewing" && item && (
          <div className="review-body">
            <span className="review-field-badge">{item.fieldLabel}</span>
            <p className="review-problem">{item.problem}</p>

            <div className="review-options">
              {(["A", "B"]).map((key) => {
                const opt = key === "A" ? item.optionA : item.optionB;
                const isRec = item.recommended === key;
                const isActive = selected === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`review-option${isActive ? " active" : ""}`}
                    onClick={() => setSelected(key)}
                  >
                    <span className="review-option-dot">{isActive ? "●" : "○"}</span>
                    <span className="review-option-label">{opt.label}</span>
                    {isRec && <span className="review-rec-badge">recommended</span>}
                  </button>
                );
              })}
              <button
                type="button"
                className={`review-option${selected === "custom" ? " active" : ""}`}
                onClick={() => setSelected("custom")}
              >
                <span className="review-option-dot">{selected === "custom" ? "●" : "○"}</span>
                <span className="review-option-label">Custom</span>
              </button>
            </div>

            {selected === "custom" && (
              <textarea
                className="cs-feedback-input"
                rows={3}
                placeholder="Describe how to resolve this…"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                autoFocus
              />
            )}

            <div className="review-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApply}
                disabled={selected === "custom" && !customText.trim()}
              >
                Apply →
              </button>
              <button type="button" className="btn btn-ghost" onClick={advance}>
                Skip →
              </button>
            </div>
          </div>
        )}

        {phase === "applying" && item && (
          <div className="review-body">
            <span className="review-field-badge">{item.fieldLabel}</span>
            <div style={{ marginTop: "1.5rem" }}>
              <AnimatedVerbs verbs={VERBS.regen} compact />
            </div>
          </div>
        )}

        {phase === "pending" && pendingFix && (
          <div className="review-body">
            <span className="review-field-badge">{pendingFix.fieldLabel} — new version</span>
            <p className="review-pending-text">{pendingFix.value}</p>
            <div className="review-actions">
              <button type="button" className="icon-btn" onClick={handleConfirm}>✓ Keep this</button>
              <button type="button" className="icon-btn" onClick={handleDiscard}>✕ Try again</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
