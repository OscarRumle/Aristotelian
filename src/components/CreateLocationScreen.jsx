import { useState, useRef, useEffect } from "react";
import { callClaudeStreaming } from "../api/claude.js";
import { buildLocationPrompt } from "../prompts/buildLocationPrompt.js";
import { useMentionInput } from "../hooks/useMentionInput.js";
import { MentionAutocomplete } from "./MentionAutocomplete.jsx";
import { RichText } from "./RichText.jsx";
import { buildMentionContext } from "../utils/entityContext.js";
import { extractJson, uid } from "../util.js";
import {
  LOCATION_TYPES,
  LOCATION_TYPE_FIELDS,
  LOCATION_SCALE_OPTIONS,
  LOCATION_STATUS_OPTIONS,
  LOCATION_ACCESS_OPTIONS,
  LOCATION_PHASES,
} from "../constants.js";
import { BottomBar } from "./BottomBar.jsx";

function TypeChips({ value, onChange }) {
  return (
    <div className="loc-type-chips">
      {LOCATION_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          className={`loc-type-chip${value === t ? " selected" : ""}`}
          onClick={() => onChange(value === t ? "" : t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function TypeFields({ type, fields, onChange }) {
  if (!type || !LOCATION_TYPE_FIELDS[type]) {
    if (type === "Custom") {
      return (
        <div>
          <label className="f-label">What kind of place is this?</label>
          <textarea
            className="f-area"
            rows={2}
            placeholder="Describe the category in your own terms…"
            value={fields._custom || ""}
            onChange={(e) => onChange("_custom", e.target.value)}
          />
        </div>
      );
    }
    return null;
  }
  return (
    <>
      {LOCATION_TYPE_FIELDS[type].map((fd) => (
        <div key={fd.key}>
          <label className="f-label">{fd.label}</label>
          <select
            className="f-input"
            value={fields[fd.key] || ""}
            onChange={(e) => onChange(fd.key, e.target.value)}
          >
            <option value="">— None</option>
            {fd.opts.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      ))}
    </>
  );
}

function AssocRow({ item, checked, note, onToggle, onNoteChange, placeholder, accentColor }) {
  return (
    <div className={`assoc-char-row${checked ? " checked" : ""}`} onClick={onToggle}>
      <div className="assoc-char-top">
        <div
          className="assoc-char-swatch"
          style={{ background: item.color || accentColor }}
        />
        <span className="assoc-char-name">{item.name}</span>
      </div>
      {checked && (
        <input
          className="f-input"
          placeholder={placeholder}
          value={note}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onNoteChange(e.target.value)}
        />
      )}
    </div>
  );
}

function GenProgress({ accumulated }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [verbIdx, setVerbIdx] = useState(0);
  const verbTimer = useRef(null);

  useEffect(() => {
    let nextPhase = 0;
    for (let i = LOCATION_PHASES.length - 1; i >= 0; i--) {
      if (LOCATION_PHASES[i].streamMarker && accumulated.includes(LOCATION_PHASES[i].streamMarker)) {
        nextPhase = Math.min(i + 1, LOCATION_PHASES.length - 1);
        break;
      }
    }
    setPhaseIdx(nextPhase);
  }, [accumulated]);

  useEffect(() => {
    const verbs = LOCATION_PHASES[phaseIdx]?.verbs ?? [];
    setVerbIdx(0);
    verbTimer.current = setInterval(() => {
      setVerbIdx((v) => (v + 1) % verbs.length);
    }, 2200);
    return () => clearInterval(verbTimer.current);
  }, [phaseIdx]);

  const phase = LOCATION_PHASES[phaseIdx];
  const verb = phase?.verbs[verbIdx] ?? "…";

  return (
    <div className="loc-gen-progress">
      <span className="loc-gen-verb">{verb}</span>
      <span className="loc-gen-phase">{phase?.id ?? ""}</span>
    </div>
  );
}

export function CreateLocationScreen({ world, onBack, onSave, refContext = null, onRefContextConsumed }) {
  const [pitch, setPitch]         = useState("");
  const [type, setType]           = useState("");
  const [name, setName]           = useState("");
  const [scale, setScale]         = useState("");
  const [status, setStatus]       = useState("");
  const [access, setAccess]       = useState("");
  const [typeFields, setTypeFields] = useState({});
  const [associations, setAssociations] = useState([]);
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genAccumulated, setGenAccumulated] = useState("");
  const [genError, setGenError]   = useState(null);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [refNote, setRefNote]     = useState(null);
  const abortRef = useRef(null);

  const { mentionState, handleChange: handleMentionChange, handleKeyDown: handleMentionKeyDown, selectMention, clearMention, selectedIdx, onMoveSelection } = useMentionInput(world);

  useEffect(() => {
    if (!refContext) return;
    setName(refContext.name || "");
    setRefNote({ sourceName: refContext.sourceName, sourceFieldKey: refContext.sourceFieldKey });
    onRefContextConsumed?.();
  }, []);

  const handleTypeChange = (t) => {
    setType(t);
    setTypeFields({});
  };

  const setTypeField = (key, val) => setTypeFields((p) => ({ ...p, [key]: val }));

  const toggleAssoc = (item, kind) => {
    setAssociations((prev) => {
      const exists = prev.find((a) => a.id === item.id);
      if (exists) return prev.filter((a) => a.id !== item.id);
      return [...prev, { kind, id: item.id, note: "" }];
    });
  };

  const setAssocNote = (id, note) => {
    setAssociations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, note } : a))
    );
  };

  const formState = { pitch, name, type, scale, status, access, typeSpecificFields: typeFields, associations };

  const generate = async () => {
    if (!pitch.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setGenerating(true);
    setGenError(null);
    setGenAccumulated("");
    setGenerated(null);
    try {
      const mentionContext = buildMentionContext(world, pitch);
      const raw = await callClaudeStreaming(
        buildLocationPrompt(world, { ...formState, mentionContext }),
        "Generate this location.",
        { maxTokens: 1200, signal: ctrl.signal, onChunk: setGenAccumulated }
      );
      const parsed = extractJson(raw);
      if (!parsed) throw new Error("JSON");
      setGenerated(JSON.parse(parsed));
    } catch (err) {
      if (err.name === "AbortError") return;
      setGenError(
        err.message?.includes("JSON")
          ? "The model returned something unexpected. Try again."
          : "Something went wrong. Check your connection and try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setGenerating(false);
  };

  const save = () => {
    const location = {
      id: uid(),
      worldId: world.id,
      pitch,
      name: name || generated?.name || "",
      type: type || generated?.type || "",
      scale: scale || null,
      status: status || null,
      access: access || null,
      typeSpecificFields: typeFields,
      associations,
      generated,
      isDraft: false,
      createdAt: Date.now(),
    };
    onSave(location);
  };

  const isEmpty = !pitch.trim() && !name.trim();
  const canGenerate = pitch.trim().length > 0;
  const canSave = pitch.trim().length > 0 || name.trim().length > 0;

  const characters = world.characters ?? [];
  const factions   = world.factions   ?? [];

  return (
    <div className="screen cls-page" style={{ paddingBottom: "6rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← {world.name}</button>
        </div>
        <span className="t-eyebrow">New Location</span>
        <h1 className="t-heading">Your idea</h1>
        <p className="t-body">Describe the location — a word or a paragraph. Everything else is optional.</p>
      </div>

      <div className="divider" />

      <div className="form-stack">
        {refNote && (
          <div className="ref-context-note">
            From <strong>{refNote.sourceName}</strong>'s {refNote.sourceFieldKey.replace(/_/g, " ")} field
          </div>
        )}
        <div>
          <label className="f-label">Pitch</label>
          <textarea
            className="f-area"
            rows={4}
            placeholder="Describe the location — what it is, what it feels like, why it matters to your world."
            value={pitch}
            onChange={(e) => handleMentionChange(e, setPitch)}
            onKeyDown={handleMentionKeyDown}
          />
          {mentionState?.active && mentionState.query.length > 0 && (
            <MentionAutocomplete
              query={mentionState.query}
              world={world}
              anchorRect={mentionState.anchorRect}
              selectedIdx={selectedIdx}
              onSelect={(item) => selectMention(pitch, setPitch, item.name, item.entityType)}
              onDismiss={clearMention}
              onMoveSelection={onMoveSelection}
            />
          )}
        </div>

        <div className="divider" />

        <div>
          <label className="f-label">Type</label>
          <TypeChips value={type} onChange={handleTypeChange} />
        </div>

        {type && (
          <TypeFields type={type} fields={typeFields} onChange={setTypeField} />
        )}

        <div>
          <label className="f-label">Name <span className="f-optional">optional</span></label>
          <input
            className="f-input"
            placeholder="Leave blank to let the world name it."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="f-row-3">
          <div>
            <label className="f-label">Scale</label>
            <select className="f-input" value={scale} onChange={(e) => setScale(e.target.value)}>
              <option value="">— None</option>
              {LOCATION_SCALE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="f-label">Status</label>
            <select className="f-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">— None</option>
              {LOCATION_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="f-label">Access</label>
            <select className="f-input" value={access} onChange={(e) => setAccess(e.target.value)}>
              <option value="">— None</option>
              {LOCATION_ACCESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="divider" />

        <div className="assoc-section">
          <span className="assoc-section-label">Associations</span>

          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            <label className="f-label">Characters</label>
            {characters.length > 0 ? (
              characters.map((char) => {
                const assoc = associations.find((a) => a.id === char.id);
                return (
                  <AssocRow
                    key={char.id}
                    item={char}
                    checked={!!assoc}
                    note={assoc?.note || ""}
                    onToggle={() => toggleAssoc(char, "character")}
                    onNoteChange={(note) => setAssocNote(char.id, note)}
                    placeholder="e.g. she was born here, he's imprisoned here, they're trying to reach it…"
                    accentColor="var(--amber)"
                  />
                );
              })
            ) : (
              <p className="t-body" style={{ opacity: 0.5, fontSize: ".8rem" }}>
                No characters yet — add characters to associate them with this location.
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginTop: ".75rem" }}>
            <label className="f-label">Factions</label>
            {factions.length > 0 ? (
              factions.map((faction) => {
                const assoc = associations.find((a) => a.id === faction.id);
                return (
                  <AssocRow
                    key={faction.id}
                    item={faction}
                    checked={!!assoc}
                    note={assoc?.note || ""}
                    onToggle={() => toggleAssoc(faction, "faction")}
                    onNoteChange={(note) => setAssocNote(faction.id, note)}
                    placeholder="e.g. they control it, they're fighting over it, they were driven out of here…"
                    accentColor="var(--fac-accent, #4a6741)"
                  />
                );
              })
            ) : (
              <p className="t-body" style={{ opacity: 0.5, fontSize: ".8rem" }}>
                No factions yet — add them using the Factions tool.
              </p>
            )}
          </div>
        </div>

        {generating && (
          <GenProgress accumulated={genAccumulated} />
        )}

        {genError && (
          <p className="t-body" style={{ color: "var(--error, #c0392b)", fontSize: ".85rem" }}>
            {genError}
          </p>
        )}

        {generated && !generating && (
          <div className="loc-output-panel">
            <div>
              <div className="obj-output-type">{generated.type}</div>
              <div className="obj-output-name">{generated.name}</div>
            </div>
            <div className="obj-output-section">
              <div className="obj-output-label">Description</div>
              <div className="obj-output-body"><RichText text={generated.description} world={world} /></div>
            </div>
            <div className="obj-output-section">
              <div className="obj-output-label">History</div>
              <div className="obj-output-body"><RichText text={generated.history} world={world} /></div>
            </div>
            <div className="obj-output-section">
              <div className="obj-output-label">Dramatic Role</div>
              <div className="obj-output-body"><RichText text={generated.dramatic_role} world={world} /></div>
            </div>
            {generated.signature_line && (
              <div className="loc-output-sig">"{generated.signature_line}"</div>
            )}
          </div>
        )}
      </div>

      <BottomBar>
        {discardConfirm ? (
          <div className="delete-confirm">
            <span className="delete-confirm-msg">Discard this location and all changes?</span>
            <div className="delete-confirm-actions">
              <button type="button" className="btn btn-destroy" onClick={onBack}>Discard</button>
              <button type="button" className="btn btn-ghost" onClick={() => setDiscardConfirm(false)}>Keep editing</button>
            </div>
          </div>
        ) : generating ? (
          <button type="button" className="btn btn-ghost" onClick={cancel}>Cancel</button>
        ) : generated ? (
          <>
            <button type="button" className="btn btn-primary" onClick={save} disabled={!canSave}>Save</button>
            <button type="button" className="btn btn-ghost" onClick={generate}>Regenerate →</button>
            <button
              type="button"
              className="btn-text-danger"
              onClick={() => setDiscardConfirm(true)}
            >
              Discard
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={generate} disabled={!canGenerate}>
              Generate →
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={isEmpty ? onBack : () => setDiscardConfirm(true)}
            >
              Cancel
            </button>
          </>
        )}
      </BottomBar>
    </div>
  );
}
