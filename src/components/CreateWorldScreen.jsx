import { useState } from "react";
import { uid } from "../util.js";
import { DEFAULT_WORLD_NAME, DEFAULT_WORLD_DESC } from "../constants.js";
import { callClaude } from "../api/claude.js";
import { buildTaglinePrompt } from "../prompts/buildTaglinePrompt.js";
import { BottomBar } from "./BottomBar.jsx";
import { CreateWorldAdvanced } from "./CreateWorldAdvanced.jsx";

export function CreateWorldScreen({ onBack, onCreate }) {
  const [mode, setMode] = useState("simple");
  const [name, setName] = useState(DEFAULT_WORLD_NAME);
  const [desc, setDesc] = useState(DEFAULT_WORLD_DESC);
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    const e = {};
    if (!name.trim()) e.name = "A world needs a name.";
    if (!desc.trim()) e.desc = "Describe the tone, genre, feel.";
    if (Object.keys(e).length) { setErrors(e); return; }
    setCreating(true);
    let tagline = "";
    try {
      tagline = (await callClaude(buildTaglinePrompt(name.trim(), desc.trim()), "Generate tagline.")).trim();
    } catch {
      // tagline stays empty — not a blocking failure
    }
    onCreate({
      id: uid(),
      name: name.trim(),
      description: desc.trim(),
      tagline,
      characters: [],
      mode: "simple",
      extendedInputs: null,
      documents: [],
      interviews: [],
      uploadedFiles: [],
    });
  };

  if (mode === "advanced") {
    return (
      <CreateWorldAdvanced
        onDone={onCreate}
        onBack={() => setMode("simple")}
      />
    );
  }

  return (
    <div className="screen cws-page" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← Worlds</button>
        </div>
        <span className="t-eyebrow">New World</span>
        <h1 className="t-heading">Name your world</h1>
        <p className="t-body">Every character inherits this context. Tone matters more than detail.</p>
      </div>
      <div className="divider" />

      <div style={{ paddingTop: "1.25rem" }}>
        <div className="mode-toggle">
          <button
            type="button"
            className={`mode-btn ${mode === "simple" ? "active" : ""}`}
            onClick={() => setMode("simple")}
          >
            Simple
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === "advanced" ? "active" : ""}`}
            onClick={() => setMode("advanced")}
          >
            Advanced — AI interview + lore bible
          </button>
        </div>
      </div>

      <div className="form-stack">
        <div>
          <label className="f-label">World name</label>
          <input
            className="f-input"
            placeholder="The Broken Coast, Neo-Tokyo 2187…"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: null })); }}
            maxLength={60}
          />
          {errors.name && (
            <p style={{ fontSize: ".75rem", color: "var(--dust)", marginTop: ".3rem" }}>{errors.name}</p>
          )}
        </div>
        <div>
          <label className="f-label">Description</label>
          <textarea
            className="f-area"
            rows={6}
            placeholder="Genre, tone, rules, history, feel…"
            value={desc}
            onChange={(e) => { setDesc(e.target.value); setErrors((p) => ({ ...p, desc: null })); }}
          />
          {errors.desc && (
            <p style={{ fontSize: ".75rem", color: "var(--dust)", marginTop: ".3rem" }}>{errors.desc}</p>
          )}
        </div>
      </div>
      <BottomBar>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={creating}>
          {creating ? "Creating…" : "Create World"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={creating}>Cancel</button>
      </BottomBar>
    </div>
  );
}
