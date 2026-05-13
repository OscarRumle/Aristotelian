import { RELATIONSHIP_TYPES, RELATIONSHIP_TYPES_BY_ID } from "../constants.js";

function CharLine({ char, dim = false }) {
  return (
    <div className={`rw-char-line${dim ? " rw-char-line-dim" : ""}`}>
      <div className="rw-char-name">{char.name || "Unnamed"}</div>
      <div className="rw-char-ham">{char.hamartia || char.personality || "No hamartia set"}</div>
    </div>
  );
}

export function RelationshipPanel({
  state,
  charA,
  charB,
  onClear,
  onPickType,
  onPickDirection,
  onGenerate,
  onTryAgain,
  onConfirm,
  onConnectAnother,
  onCancel,
  onRetryWriteback,
}) {
  const { phase, pickedType, pickedDirection, result, error, writebackStatus } = state;
  const type = pickedType ? RELATIONSHIP_TYPES_BY_ID[pickedType] : null;
  const resultType = result ? RELATIONSHIP_TYPES_BY_ID[result.type] : null;

  return (
    <div className="rw-panel">
      <div className="rw-panel-body">
        {phase === "idle" && (
          <div className="rw-idle-hint">
            Every character carries a flaw.<br />
            Map how those flaws pull against each other.
            <div className="rw-idle-op">Click any character to begin.</div>
          </div>
        )}

        {phase === "first" && charA && (
          <div className="rw-first-row">
            <span className="rw-pip" />
            <CharLine char={charA} />
            <span className="rw-hint-arrow">→ select another</span>
          </div>
        )}

        {phase === "type" && charA && charB && (
          <>
            <div className="rw-pair-row">
              <CharLine char={charA} />
              <span className="rw-pair-arr">↔</span>
              <CharLine char={charB} />
            </div>
            <div className="rw-type-grid">
              {RELATIONSHIP_TYPES.map((t) => {
                const active = pickedType === t.id;
                const style = active
                  ? {
                      borderColor: `var(${t.colorVar})`,
                      color: `var(${t.colorVar})`,
                      background: `color-mix(in srgb, var(${t.colorVar}) 8%, transparent)`,
                    }
                  : undefined;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`rw-type-btn${active ? " is-active" : ""}`}
                    style={style}
                    onClick={() => onPickType(t.id)}
                  >
                    <span className="rw-type-label">{t.label}</span>
                    <span className="rw-type-desc">{t.description}</span>
                  </button>
                );
              })}
            </div>
            {type?.directional && (
              <div className="rw-direction-toggle">
                <button
                  type="button"
                  className={`rw-dir-btn${pickedDirection === "a_to_b" ? " is-active" : ""}`}
                  onClick={() => onPickDirection("a_to_b")}
                >
                  {charA.name} → {charB.name}
                </button>
                <button
                  type="button"
                  className={`rw-dir-btn${pickedDirection === "b_to_a" ? " is-active" : ""}`}
                  onClick={() => onPickDirection("b_to_a")}
                >
                  {charB.name} → {charA.name}
                </button>
              </div>
            )}
          </>
        )}

        {phase === "gen" && (
          <div className="rw-gen-row">
            <span className="rw-spinner" />
            <span className="rw-gen-lbl">Reading the hamartias…</span>
          </div>
        )}

        {phase === "review" && result && resultType && (
          <div className="rw-review">
            <div
              className="rw-tag"
              style={{
                background: `color-mix(in srgb, var(${resultType.colorVar}) 12%, transparent)`,
                color: `var(${resultType.colorVar})`,
                borderColor: `color-mix(in srgb, var(${resultType.colorVar}) 40%, transparent)`,
              }}
            >
              <span className="rw-tag-dot" style={{ background: `var(${resultType.colorVar})` }} />
              {resultType.label}
            </div>
            <div className="rw-r-title">{result.title}</div>
            <div className="rw-r-desc">{result.description}</div>
            {result.note && <div className="rw-r-note">{result.note}</div>}
          </div>
        )}

        {phase === "confirmed" && (
          <div className="rw-confirmed">
            {writebackStatus === "pending" && (
              <>
                <span className="rw-spinner rw-spinner-sm" aria-hidden="true" />
                <div className="rw-conf-lbl">
                  Connection saved. Weaving into the character sheets…
                </div>
              </>
            )}
            {writebackStatus === "ok" && (
              <>
                <div className="rw-conf-check" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3.5 3.5 6-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="rw-conf-lbl">Connection saved and written to both characters.</div>
                {onConnectAnother && (
                  <button type="button" className="btn btn-ghost rw-conf-again" onClick={onConnectAnother}>
                    Connect another →
                  </button>
                )}
              </>
            )}
            {writebackStatus === "failed" && (
              <>
                <span className="rw-conf-warn" aria-hidden="true">!</span>
                <div className="rw-conf-lbl">
                  Connection saved. Couldn't write to the character sheets.
                </div>
                {onRetryWriteback && (
                  <button type="button" className="btn btn-ghost rw-conf-again" onClick={onRetryWriteback}>
                    Retry
                  </button>
                )}
              </>
            )}
            {/* Fallback when no writeback status yet (shouldn't normally happen) */}
            {!writebackStatus && (
              <>
                <div className="rw-conf-check" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3.5 3.5 6-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="rw-conf-lbl">Connection added to the web.</div>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="rw-error">{error}</div>
        )}
      </div>

      <div className="rw-panel-feet">
        {phase === "first" && (
          <button type="button" className="btn btn-ghost" onClick={onClear}>Clear</button>
        )}
        {phase === "type" && (
          <>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!pickedType || (type?.directional && !pickedDirection)}
              onClick={onGenerate}
            >
              Generate →
            </button>
          </>
        )}
        {phase === "review" && (
          <>
            <button type="button" className="btn btn-ghost" onClick={onTryAgain}>Try again</button>
            <button type="button" className="btn btn-primary rw-confirm-btn" onClick={onConfirm}>
              Confirm &amp; save
            </button>
          </>
        )}
      </div>
    </div>
  );
}
