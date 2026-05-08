import { useRef, useState } from "react";
import { useSettings } from "../context/SettingsContext.jsx";
import { ANTHROPIC_MODEL_OPTIONS, DEFAULT_ANTHROPIC_MODEL, DEFAULT_SETTINGS } from "../constants.js";
import { exportAll, importAll, resetStorage } from "../storage.js";

const PROVIDER_LABELS = {
  anthropic: "Anthropic",
  higgsfield: "Higgsfield",
};

export function SettingsPage({ navigate, theme, toggleTheme }) {
  const { settings, updateSettings } = useSettings();

  // Local draft so the user can type without thrashing storage on every keystroke.
  const [draft, setDraft] = useState(settings);
  const [savedFlash, setSavedFlash] = useState("");
  const [check, setCheck] = useState({ anthropic: null, higgsfield: null });
  const [showSecrets, setShowSecrets] = useState(false);
  const importInputRef = useRef(null);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const flashSaved = (label) => {
    setSavedFlash(label);
    setTimeout(() => setSavedFlash(""), 1800);
  };

  const saveSection = (keys, label) => {
    const partial = {};
    for (const k of keys) partial[k] = draft[k];
    updateSettings(partial);
    flashSaved(label);
  };

  // ── Connection checks ────────────────────────────────────────────────────
  const runCheck = async (provider) => {
    setCheck((c) => ({ ...c, [provider]: { state: "checking" } }));

    // Always save current draft keys first so the proxy gets them on this request.
    if (provider === "anthropic") {
      updateSettings({ anthropicKey: draft.anthropicKey, anthropicVersion: draft.anthropicVersion });
    } else {
      updateSettings({ higgsfieldKeyId: draft.higgsfieldKeyId, higgsfieldKeySecret: draft.higgsfieldKeySecret });
    }

    try {
      if (provider === "anthropic") {
        // Cheapest valid call: list models.
        const headers = { "Content-Type": "application/json" };
        if (draft.anthropicKey) headers["x-user-anthropic-key"] = draft.anthropicKey;
        if (draft.anthropicVersion) headers["x-user-anthropic-version"] = draft.anthropicVersion;
        const r = await fetch("/api/anthropic/v1/models?limit=1", { headers });
        if (r.ok) setCheck((c) => ({ ...c, anthropic: { state: "ok", msg: "Connected." } }));
        else {
          const body = await r.json().catch(() => ({}));
          setCheck((c) => ({ ...c, anthropic: { state: "err", msg: body?.error?.message || `HTTP ${r.status}` } }));
        }
      } else {
        const headers = {};
        if (draft.higgsfieldKeyId)     headers["x-user-higgsfield-id"]     = draft.higgsfieldKeyId;
        if (draft.higgsfieldKeySecret) headers["x-user-higgsfield-secret"] = draft.higgsfieldKeySecret;
        // Probe a non-existent request — auth happens before the lookup, so 401 means
        // bad keys, while 404/400 means auth passed.
        const r = await fetch("/api/higgsfield/requests/__connection_check__/status", { headers });
        if (r.status === 401 || r.status === 403) {
          const body = await r.json().catch(() => ({}));
          setCheck((c) => ({ ...c, higgsfield: { state: "err", msg: body?.detail || body?.error?.message || `HTTP ${r.status}` } }));
        } else {
          setCheck((c) => ({ ...c, higgsfield: { state: "ok", msg: "Authenticated." } }));
        }
      }
    } catch (err) {
      setCheck((c) => ({ ...c, [provider]: { state: "err", msg: String(err.message || err) } }));
    }
  };

  // ── Data ─────────────────────────────────────────────────────────────────
  const onExport = () => {
    const json = exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aristotelian-worlds-v2-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm("Importing will replace all current worlds and settings. Continue?")) return;
    try {
      const text = await file.text();
      const { worldCount } = importAll(text);
      flashSaved(`Imported · ${worldCount} world${worldCount === 1 ? "" : "s"}`);
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      alert("Import failed: " + (err.message || err));
    }
  };

  const onWipe = () => {
    if (!confirm("Wipe ALL local data — worlds, characters, settings? This cannot be undone.")) return;
    if (!confirm("Really wipe everything?")) return;
    resetStorage();
    window.location.reload();
  };

  const inputType = showSecrets ? "text" : "password";

  return (
    <div className="screen settings-screen">
      <button className="back-btn" onClick={() => navigate("design")} style={{ marginTop: "1.5rem" }}>← Back</button>

      <header style={{ marginTop: "1.25rem", marginBottom: "2rem" }}>
        <p className="t-eyebrow">Settings</p>
        <h1 className="t-heading">Your setup</h1>
        <p className="t-body" style={{ color: "var(--muted)", marginTop: ".4rem", fontSize: ".88rem" }}>
          Keys, defaults, and pacing. Saved locally — nothing leaves your browser except API calls.
        </p>
      </header>

      {savedFlash && <div className="settings-toast">{savedFlash} ✓</div>}

      {/* ── API & Connection ─────────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="settings-section-head">
          <h2 className="settings-section-title">API &amp; Connection</h2>
          <p className="settings-section-sub">Paste your own keys, or leave blank to use the keys configured in <code>.env.local</code>.</p>
        </div>

        <div className="form-stack">
          <div>
            <label className="f-label">Anthropic API key</label>
            <input
              className="f-input"
              type={inputType}
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-ant-…"
              value={draft.anthropicKey}
              onChange={(e) => set("anthropicKey", e.target.value)}
            />
          </div>

          <div>
            <label className="f-label">Anthropic API version (override)</label>
            <input
              className="f-input"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="2023-06-01"
              value={draft.anthropicVersion}
              onChange={(e) => set("anthropicVersion", e.target.value)}
            />
          </div>

          <div className="settings-inline-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => runCheck("anthropic")}>Check Anthropic</button>
            <CheckBadge result={check.anthropic} />
          </div>

          <div className="f-row">
            <div>
              <label className="f-label">Higgsfield Key ID</label>
              <input
                className="f-input"
                type={inputType}
                autoComplete="off"
                spellCheck={false}
                value={draft.higgsfieldKeyId}
                onChange={(e) => set("higgsfieldKeyId", e.target.value)}
              />
            </div>
            <div>
              <label className="f-label">Higgsfield Key Secret</label>
              <input
                className="f-input"
                type={inputType}
                autoComplete="off"
                spellCheck={false}
                value={draft.higgsfieldKeySecret}
                onChange={(e) => set("higgsfieldKeySecret", e.target.value)}
              />
            </div>
          </div>

          <div className="settings-inline-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => runCheck("higgsfield")}>Check Higgsfield</button>
            <CheckBadge result={check.higgsfield} />
          </div>

          <div className="settings-inline-actions">
            <label className="settings-checkbox">
              <input type="checkbox" checked={showSecrets} onChange={(e) => setShowSecrets(e.target.checked)} />
              <span>Show keys</span>
            </label>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => saveSection(["anthropicKey", "anthropicVersion", "higgsfieldKeyId", "higgsfieldKeySecret"], "API keys saved")}
            >
              Save API keys
            </button>
          </div>
        </div>
      </section>

      {/* ── Generation Defaults ──────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="settings-section-head">
          <h2 className="settings-section-title">Generation defaults</h2>
          <p className="settings-section-sub">Defaults applied to new generations and new worlds.</p>
        </div>

        <div className="form-stack">
          <div>
            <label className="f-label">Default Anthropic model</label>
            <select
              className="f-input"
              value={draft.anthropicModel || DEFAULT_ANTHROPIC_MODEL}
              onChange={(e) => set("anthropicModel", e.target.value === DEFAULT_ANTHROPIC_MODEL ? "" : e.target.value)}
            >
              {ANTHROPIC_MODEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={!!draft.defaultAutoGenerateImages}
              onChange={(e) => set("defaultAutoGenerateImages", e.target.checked)}
            />
            <span>Auto-generate images for new worlds by default</span>
          </label>

          <div className="settings-inline-actions" style={{ justifyContent: "flex-end" }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => saveSection(["anthropicModel", "defaultAutoGenerateImages"], "Defaults saved")}
            >
              Save defaults
            </button>
          </div>
        </div>
      </section>

      {/* ── Appearance ───────────────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="settings-section-head">
          <h2 className="settings-section-title">Appearance</h2>
        </div>

        <div className="form-stack">
          <div className="settings-inline-actions">
            <span className="t-body" style={{ fontSize: ".88rem", color: "var(--muted)" }}>
              Theme: <strong className="settings-theme-name">{theme === "dark" ? "Dark" : "Light"}</strong>
            </span>
            <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
              Switch to {theme === "dark" ? "light" : "dark"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Advanced ─────────────────────────────────────────────────────── */}
      <section className="settings-section">
        <details className="settings-details">
          <summary className="settings-section-title">Advanced — pacing</summary>
          <p className="settings-section-sub" style={{ marginTop: ".4rem" }}>
            Defaults are tuned for legibility. Going much lower hurts the overlay.
          </p>

          <div className="form-stack">
            <div>
              <label className="f-label">Overlay phase minimum ({draft.minPhaseMs} ms)</label>
              <input
                type="range"
                min="2000"
                max="8000"
                step="250"
                value={draft.minPhaseMs}
                onChange={(e) => set("minPhaseMs", Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label className="f-label">Verb cycle interval ({draft.verbCycleMs} ms)</label>
              <input
                type="range"
                min="800"
                max="3000"
                step="100"
                value={draft.verbCycleMs}
                onChange={(e) => set("verbCycleMs", Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div className="settings-inline-actions" style={{ justifyContent: "space-between" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  set("minPhaseMs", DEFAULT_SETTINGS.minPhaseMs);
                  set("verbCycleMs", DEFAULT_SETTINGS.verbCycleMs);
                }}
              >
                Reset to defaults
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => saveSection(["minPhaseMs", "verbCycleMs"], "Pacing saved")}
              >
                Save pacing
              </button>
            </div>
          </div>
        </details>
      </section>

      {/* ── Data ─────────────────────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="settings-section-head">
          <h2 className="settings-section-title">Data</h2>
          <p className="settings-section-sub">Backup, restore, or wipe your local Aristotelian store.</p>
        </div>

        <div className="settings-inline-actions" style={{ flexWrap: "wrap", gap: ".5rem" }}>
          <button className="btn btn-ghost btn-sm" onClick={onExport}>Export JSON</button>
          <button className="btn btn-ghost btn-sm" onClick={() => importInputRef.current?.click()}>Import JSON</button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={onImportFile}
          />
          <button className="btn btn-destroy btn-sm" onClick={onWipe}>Wipe everything</button>
        </div>
      </section>
    </div>
  );
}

function CheckBadge({ result }) {
  if (!result) return null;
  if (result.state === "checking") return <span className="settings-badge settings-badge--checking">Checking…</span>;
  if (result.state === "ok")       return <span className="settings-badge settings-badge--ok">{result.msg}</span>;
  return <span className="settings-badge settings-badge--err" title={result.msg}>{result.msg}</span>;
}
