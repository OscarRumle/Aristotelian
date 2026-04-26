import { useState } from "react";
import { callClaudeStreaming } from "../api/claude.js";
import { buildPrompt } from "../prompts/build.js";
import { extractJson, uid } from "../util.js";
import { ROLE_OPTIONS, STYLE_OPTIONS } from "../constants.js";
import { BottomBar } from "./BottomBar.jsx";
import { PillSelect } from "./PillSelect.jsx";

export function CreateCharacterScreen({
  world,
  onBack,
  onStartGenerating,
  onGenerated,
  onError,
  onChunk,
  signal,
  initialPitch = "",
}) {
  const [pitch, setPitch] = useState(initialPitch);
  const [role, setRole] = useState("");
  const [style, setStyle] = useState("");
  const [targetLeadId, setTargetLeadId] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [f, setF] = useState({
    name: "", age: "", gender: "", race: "",
    appearance: "", clothing: "", details: "",
    background: "", personality: "", desires: "", fears: "", moralCore: "",
  });
  const upd = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const leads = world.characters.filter((c) => c.role === "Lead");
  const targetLead = leads.find((c) => c.id === targetLeadId) || null;

  const generate = async () => {
    onStartGenerating();
    try {
      const raw = await callClaudeStreaming(
        buildPrompt(world, world.characters, { role, style, pitch, ...f }, targetLead),
        "Generate the character.",
        { maxTokens: 2000, signal, onChunk }
      );
      const parsed = extractJson(raw);
      if (!parsed) throw new Error("JSON");
      onGenerated({ id: uid(), worldId: world.id, pitch, createdAt: Date.now(), ...JSON.parse(parsed) });
    } catch (err) {
      if (err.name === "AbortError") return;
      onError(
        err.message?.includes("JSON")
          ? "The model returned something unexpected. Try again."
          : "Something went wrong. Check your connection and try again."
      );
    }
  };

  return (
    <div className="screen ccs-page" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← {world.name}</button>
        </div>
        <span className="t-eyebrow">New Character</span>
        <h1 className="t-heading">Your concept</h1>
        <p className="t-body">
          A word or a page — anything left blank will be shaped by Aristotle's framework and your world.
        </p>
      </div>
      <div className="divider" />

      <div className="form-stack">
        <div>
          <label className="f-label">Idea / Pitch</label>
          <textarea
            className="f-area"
            rows={5}
            placeholder="A disgraced accountant who knows too much about the wrong people's money…"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
          />
        </div>

        <PillSelect
          label="Role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={setRole}
          hint={role ? ROLE_OPTIONS.find((o) => o.value === role)?.desc : "Leave blank — the LLM will choose"}
        />

        {role === "Deuteragonist" && leads.length > 0 && (
          <div>
            <label className="f-label">Target Lead</label>
            <select
              className="f-input"
              value={targetLeadId}
              onChange={(e) => setTargetLeadId(e.target.value)}
            >
              <option value="">— Let LLM decide</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        <PillSelect
          label="Style"
          options={STYLE_OPTIONS}
          value={style}
          onChange={setStyle}
          hint={style ? STYLE_OPTIONS.find((o) => o.value === style)?.desc : "Leave blank — the LLM will choose"}
        />

        <button type="button" className="toggle-btn" onClick={() => setShowMore((p) => !p)}>
          {showMore ? "− Hide optional fields" : "+ Add specifics (optional)"}
        </button>

        {showMore && (
          <>
            <div className="ccs-specifics-grid">
              <div className="ccs-col">
                <span className="s-label">Identity</span>
                <div>
                  <label className="f-label">Name</label>
                  <input className="f-input" placeholder="Leave blank to generate" value={f.name} onChange={upd("name")} />
                </div>
                <div className="f-row">
                  <div>
                    <label className="f-label">Age</label>
                    <input className="f-input" placeholder="Mid 40s…" value={f.age} onChange={upd("age")} />
                  </div>
                  <div>
                    <label className="f-label">Gender</label>
                    <input className="f-input" placeholder="Open" value={f.gender} onChange={upd("gender")} />
                  </div>
                </div>
                <div>
                  <label className="f-label">Race / Species</label>
                  <input className="f-input" placeholder="Interpreted by world context" value={f.race} onChange={upd("race")} />
                </div>
              </div>

              <div className="ccs-col">
                <span className="s-label">Physical</span>
                <div>
                  <label className="f-label">Appearance</label>
                  <textarea className="f-area" rows={2} placeholder="Physical traits…" value={f.appearance} onChange={upd("appearance")} />
                </div>
                <div>
                  <label className="f-label">Clothing</label>
                  <textarea className="f-area" rows={2} placeholder="Style, garments…" value={f.clothing} onChange={upd("clothing")} />
                </div>
                <div>
                  <label className="f-label">Details</label>
                  <textarea className="f-area" rows={2} placeholder="Scars, mannerisms, voice…" value={f.details} onChange={upd("details")} />
                </div>
              </div>
            </div>

            <span className="s-label">Psychology</span>
            <div>
              <label className="f-label">Background</label>
              <textarea className="f-area" rows={2} placeholder="Origin, history…" value={f.background} onChange={upd("background")} />
            </div>
            <div>
              <label className="f-label">Personality</label>
              <textarea className="f-area" rows={2} placeholder="Behavioral patterns…" value={f.personality} onChange={upd("personality")} />
            </div>
            <div>
              <label className="f-label">Desires</label>
              <input className="f-input" placeholder="What they want on the surface" value={f.desires} onChange={upd("desires")} />
            </div>
            <div>
              <label className="f-label">Fears</label>
              <input className="f-input" placeholder="What haunts them" value={f.fears} onChange={upd("fears")} />
            </div>
            <div>
              <label className="f-label">Moral Core</label>
              <textarea className="f-area" rows={2} placeholder="What they'd protect at cost…" value={f.moralCore} onChange={upd("moralCore")} />
            </div>
          </>
        )}
      </div>

      <BottomBar>
        <button type="button" className="btn btn-primary" onClick={generate}>Generate Character</button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>Cancel</button>
      </BottomBar>
    </div>
  );
}
