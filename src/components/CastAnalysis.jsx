import { useState, useEffect } from "react";
import { callClaude } from "../api/claude.js";
import { buildCastAnalysisPrompt } from "../prompts/buildCastAnalysisPrompt.js";

function parseAnalysis(text) {
  const sections = [];
  const parts = text.split(/\*\*([^*]+)\*\*/);
  for (let i = 1; i < parts.length; i += 2) {
    const header = parts[i].trim();
    const body = (parts[i + 1] ?? "").trim();
    if (header) sections.push({ header, body });
  }
  return sections.length > 0 ? sections : null;
}

export function CastAnalysis({ world, onClose, cachedText, onCacheText, onCreateCharacter }) {
  const [text, setText] = useState(cachedText ?? null);
  const [loading, setLoading] = useState(!cachedText);
  const [error, setError] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (fetchKey === 0 && cachedText) return;

    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    setText(null);

    callClaude(
      buildCastAnalysisPrompt(world),
      "Analyse this cast.",
      { maxTokens: 1200, signal: ctrl.signal }
    )
      .then((raw) => {
        setText(raw);
        onCacheText?.(raw);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Generation failed.");
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [fetchKey]);

  const sections = text ? parseAnalysis(text) : null;

  return (
    <div
      className="cast-analysis-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cast-analysis-modal">
        <div className="cast-analysis-head">
          <div>
            <p className="t-eyebrow">World · {world.name}</p>
            <h2 className="t-heading" style={{ marginTop: ".25rem" }}>Cast Analysis</h2>
          </div>
          <div className="cast-analysis-head-actions">
            {!loading && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => setFetchKey((k) => k + 1)}
                title="Regenerate"
                style={{ fontSize: ".9rem" }}
              >
                ↺
              </button>
            )}
            <button
              type="button"
              className="cast-analysis-close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="cast-analysis-body">
          {loading && (
            <div className="cast-analysis-loading">
              <div className="cast-analysis-dots">
                <span /><span /><span />
              </div>
              <p className="t-body" style={{ marginTop: "1rem" }}>Reading the ensemble…</p>
            </div>
          )}

          {error && (
            <p className="t-body" style={{ color: "var(--dust)" }}>Error: {error}</p>
          )}

          {sections && (
            <div className="cast-analysis-sections">
              {sections.map(({ header, body }) => (
                <div key={header} className="cast-analysis-section">
                  <h3 className="cast-analysis-section-title">{header}</h3>
                  <p className="t-body">{body}</p>
                  {header === "What's Missing" && onCreateCharacter && (
                    <button
                      type="button"
                      className="btn-create-from-analysis"
                      onClick={() => onCreateCharacter(body)}
                    >
                      Create this character →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {text && !sections && (
            <p className="t-body" style={{ whiteSpace: "pre-wrap" }}>{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
