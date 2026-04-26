import { useState, useRef, useEffect } from "react";
import { callClaudeStreaming } from "../api/claude.js";
import { buildFactionPrompt } from "../prompts/buildFactionPrompt.js";
import { extractJson, uid } from "../util.js";
import {
  FACTION_TYPES,
  FACTION_TYPE_FIELDS,
  FACTION_SIZE_OPTIONS,
  FACTION_STATUS_OPTIONS,
  FACTION_AGE_OPTIONS,
  FACTION_PHASES,
} from "../constants.js";
import { BottomBar } from "./BottomBar.jsx";

function TypeChips({ value, onChange }) {
  return (
    <div className="fac-type-chips">
      {FACTION_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          className={`fac-type-chip${value === t ? " selected" : ""}`}
          onClick={() => onChange(value === t ? "" : t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function TypeFields({ type, fields, onChange }) {
  if (!type || !FACTION_TYPE_FIELDS[type]) {
    if (type === "Custom") {
      return (
        <div>
          <label className="f-label">What kind of organisation is this?</label>
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
      {FACTION_TYPE_FIELDS[type].map((fd) => (
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
    for (let i = FACTION_PHASES.length - 1; i >= 0; i--) {
      if (FACTION_PHASES[i].streamMarker && accumulated.includes(FACTION_PHASES[i].streamMarker)) {
        nextPhase = Math.min(i + 1, FACTION_PHASES.length - 1);
        break;
      }
    }
    setPhaseIdx(nextPhase);
  }, [accumulated]);

  useEffect(() => {
    const verbs = FACTION_PHASES[phaseIdx]?.verbs ?? [];
    setVerbIdx(0);
    verbTimer.current = setInterval(() => {
      setVerbIdx((v) => (v + 1) % verbs.length);
    }, 2200);
    return () => clearInterval(verbTimer.current);
  }, [phaseIdx]);

  const phase = FACTION_PHASES[phaseIdx];
  const verb = phase?.verbs[verbIdx] ?? "…";

  return (
    <div className="fac-gen-progress">
      <span className="fac-gen-verb">{verb}</span>
      <span className="fac-gen-phase">{phase?.id ?? ""}</span>
    </div>
  );
}

export function CreateFactionScreen({ world, onBack, onSave, refContext = null, onRefContextConsumed }) {
  const [pitch, setPitch]         = useState("");
  const [type, setType]           = useState("");
  const [name, setName]           = useState("");
  const [size, setSize]           = useState("");
  const [status, setStatus]       = useState("");
  const [age, setAge]             = useState("");
  const [typeFields, setTypeFields] = useState({});
  const [associations, setAssociations] = useState([]);
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genAccumulated, setGenAccumulated] = useState("");
  const [genError, setGenError]   = useState(null);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [refNote, setRefNote]     = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!refContext) return;
    setName(refContext.name || "");
    if (refContext.sourceText) setPitch(refContext.sourceText);
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

  const formState = { pitch, name, type, size, status, age, typeSpecificFields: typeFields, associations };

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
      const raw = await callClaudeStreaming(
        buildFactionPrompt(world, formState),
        "Generate this faction.",
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
    const faction = {
      id: uid(),
      worldId: world.id,
      pitch,
      name: name || generated?.name || "",
      type: type || generated?.type || "",
      size: size || null,
      status: status || null,
      age: age || null,
      typeSpecificFields: typeFields,
      associations,
      generated,
      isDraft: false,
      createdAt: Date.now(),
    };
    onSave(faction);
  };

  const isEmpty = !pitch.trim() && !name.trim();
  const canGenerate = pitch.trim().length > 0;
  const canSave = pitch.trim().length > 0 || name.trim().length > 0;

  const characters = world.characters ?? [];
  const locations  = world.locations  ?? [];

  return (
    <div className="screen cfs-page" style={{ paddingBottom: "6rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← {world.name}</button>
        </div>
        <span className="t-eyebrow">New Faction</span>
        <h1 className="t-heading">Your idea</h1>
        <p className="t-body">Describe the faction — a word or a paragraph. Everything else is optional.</p>
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
            placeholder="Describe the faction — who they are, what they want, what they'd do to get it."
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
          />
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
            placeholder="Leave blank to let the world name them."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="f-row-3">
          <div>
            <label className="f-label">Size</label>
            <select className="f-input" value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="">— None</option>
              {FACTION_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="f-label">Status</label>
            <select className="f-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">— None</option>
              {FACTION_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="f-label">Age</label>
            <select className="f-input" value={age} onChange={(e) => setAge(e.target.value)}>
              <option value="">— None</option>
              {FACTION_AGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
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
                    placeholder="e.g. she founded it, he betrayed them, they're hunting her…"
                    accentColor="var(--amber)"
                  />
                );
              })
            ) : (
              <p className="t-body" style={{ opacity: 0.5, fontSize: ".8rem" }}>
                No characters yet — add characters to associate them with this faction.
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginTop: ".75rem" }}>
            <label className="f-label">Locations</label>
            {locations.length > 0 ? (
              locations.map((loc) => {
                const assoc = associations.find((a) => a.id === loc.id);
                return (
                  <AssocRow
                    key={loc.id}
                    item={loc}
                    checked={!!assoc}
                    note={assoc?.note || ""}
                    onToggle={() => toggleAssoc(loc, "location")}
                    onNoteChange={(note) => setAssocNote(loc.id, note)}
                    placeholder="e.g. this is their base, they control this region, they were driven out of here…"
                    accentColor="var(--loc-accent, #3a5f7a)"
                  />
                );
              })
            ) : (
              <p className="t-body" style={{ opacity: 0.5, fontSize: ".8rem" }}>
                No locations yet — add them using the Locations tool.
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
          <div className="fac-output-panel">
            <div>
              <div className="obj-output-type">{generated.type}</div>
              <div className="obj-output-name">{generated.name}</div>
            </div>
            <div className="obj-output-section">
              <div className="obj-output-label">Description</div>
              <div className="obj-output-body">{generated.description}</div>
            </div>
            <div className="obj-output-section">
              <div className="obj-output-label">History</div>
              <div className="obj-output-body">{generated.history}</div>
            </div>
            <div className="obj-output-section">
              <div className="obj-output-label">Dramatic Role</div>
              <div className="obj-output-body">{generated.dramatic_role}</div>
            </div>
            {generated.internal_tension && (
              <div className="obj-output-section">
                <div className="obj-output-label">Internal Tension</div>
                <div className="obj-output-body fac-output-tension">{generated.internal_tension}</div>
              </div>
            )}
            {generated.motto && (
              <div className="fac-output-sig">"{generated.motto}"</div>
            )}
          </div>
        )}
      </div>

      <BottomBar>
        {discardConfirm ? (
          <div className="delete-confirm">
            <span className="delete-confirm-msg">Discard this faction and all changes?</span>
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
