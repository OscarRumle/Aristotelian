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
  world,
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
  onEditEdge,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  onSetCustomText,
  onCustomStay,
  onCustomRefine,
  onCustomExpand,
}) {
  const { phase, pickedType, pickedDirection, customText, result, error, writebackStatus, selectedEdgeId, editingEdgeId } = state;
  const type = pickedType ? RELATIONSHIP_TYPES_BY_ID[pickedType] : null;
  const resultType = result ? RELATIONSHIP_TYPES_BY_ID[result.type] : null;

  // Look up the edge we're currently inspecting / about to delete.
  const inspectedEdge = selectedEdgeId
    ? (world?.relationships ?? []).find((r) => r.id === selectedEdgeId)
    : null;
  const inspectedType = inspectedEdge ? RELATIONSHIP_TYPES_BY_ID[inspectedEdge.type] : null;
  const inspectedA = inspectedEdge ? (world?.characters ?? []).find((c) => c.id === inspectedEdge.a) : null;
  const inspectedB = inspectedEdge ? (world?.characters ?? []).find((c) => c.id === inspectedEdge.b) : null;

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
            {pickedType === "custom" && (
              <div className="rw-custom-block">
                <textarea
                  className="rw-custom-input"
                  placeholder="Write your own connection. What pulls between them?"
                  value={customText}
                  onChange={(e) => onSetCustomText(e.target.value)}
                  rows={3}
                />
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
            {editingEdgeId && (
              <div className="rw-edit-hint">Editing this connection.</div>
            )}
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
            {result.title && <div className="rw-r-title">{result.title}</div>}
            <div className="rw-r-desc">{result.description}</div>
            {result.note && <div className="rw-r-note">{result.note}</div>}
          </div>
        )}

        {phase === "edge-detail" && inspectedEdge && inspectedType && (
          <div className="rw-review">
            <div
              className="rw-tag"
              style={{
                background: `color-mix(in srgb, var(${inspectedType.colorVar}) 12%, transparent)`,
                color: `var(${inspectedType.colorVar})`,
                borderColor: `color-mix(in srgb, var(${inspectedType.colorVar}) 40%, transparent)`,
              }}
            >
              <span className="rw-tag-dot" style={{ background: `var(${inspectedType.colorVar})` }} />
              {inspectedType.label}
              {inspectedType.directional && inspectedA && inspectedB && (
                <span className="rw-tag-dir">
                  {" · "}
                  {inspectedEdge.direction === "b_to_a"
                    ? `${inspectedB.name} → ${inspectedA.name}`
                    : `${inspectedA.name} → ${inspectedB.name}`}
                </span>
              )}
            </div>
            {inspectedEdge.title && <div className="rw-r-title">{inspectedEdge.title}</div>}
            {inspectedEdge.description && <div className="rw-r-desc">{inspectedEdge.description}</div>}
            {inspectedEdge.note && <div className="rw-r-note">{inspectedEdge.note}</div>}
            {inspectedEdge.writeback_status === "failed" && (
              <div className="rw-edge-status-warn">
                Couldn't write this connection to the character sheets.
              </div>
            )}
          </div>
        )}

        {phase === "confirm-delete" && inspectedEdge && (
          <div className="rw-confirm-delete">
            <div className="rw-confirm-delete-head">Delete this connection?</div>
            <div className="rw-confirm-delete-body">
              {inspectedEdge.title ? <strong>"{inspectedEdge.title}"</strong> : null}
              {inspectedEdge.title ? " between " : "The connection between "}
              <strong>{inspectedA?.name || "—"}</strong> and <strong>{inspectedB?.name || "—"}</strong> will be removed from the web.
              <br />
              Anything already written into either character's sheet stays — you'll need to remove that by hand if you want it gone.
            </div>
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
        {phase === "type" && pickedType !== "custom" && (
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
        {phase === "type" && pickedType === "custom" && (
          <>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button
              type="button"
              className="btn btn-ghost rw-custom-btn"
              disabled={!customText.trim()}
              onClick={onCustomStay}
            >
              Stay as written
            </button>
            <button
              type="button"
              className="btn btn-ghost rw-custom-btn"
              disabled={!customText.trim()}
              onClick={onCustomRefine}
            >
              Refine
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!customText.trim()}
              onClick={onCustomExpand}
            >
              Expand →
            </button>
          </>
        )}
        {phase === "review" && (
          <>
            <button type="button" className="btn btn-ghost" onClick={onTryAgain}>Try again</button>
            <button type="button" className="btn btn-primary rw-confirm-btn" onClick={onConfirm}>
              {editingEdgeId ? "Save changes" : "Confirm & save"}
            </button>
          </>
        )}
        {phase === "edge-detail" && (
          <>
            <button type="button" className="btn btn-ghost rw-btn-danger" onClick={onAskDelete}>Delete</button>
            <button type="button" className="btn btn-ghost" onClick={onClear}>Close</button>
            <button type="button" className="btn btn-primary" onClick={onEditEdge}>Edit</button>
          </>
        )}
        {phase === "confirm-delete" && (
          <>
            <button type="button" className="btn btn-ghost" onClick={onCancelDelete}>Cancel</button>
            <button type="button" className="btn btn-destroy" onClick={onConfirmDelete}>Delete connection</button>
          </>
        )}
      </div>
    </div>
  );
}
