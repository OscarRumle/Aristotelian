import { useState, useRef } from "react";
import { callClaude } from "../api/claude.js";
import { buildRegenPrompt } from "../prompts/regen.js";
import { buildFieldExpandPrompt } from "../prompts/fieldExpand.js";
import { metaLine, isFullRole, isMini, isSupport } from "../util.js";
import { PHIL } from "../constants.js";
import { CharField } from "./CharField.jsx";
import { ReviewOverlay } from "./ReviewOverlay.jsx";
import { ErrorToast } from "./ErrorToast.jsx";
import { AnimatedVerbs, VERBS } from "./AnimatedVerbs.jsx";

function LockedSection({ title, fields, character, onExpand, isExpanding }) {
  return (
    <div className="cs-section">
      <div className="cs-section-title">{title}</div>
      {fields.map(([label, key]) => (
        <div key={key} className="locked-field">
          <span className="locked-label">{label}</span>
          {character[key] ? (
            <p className="cs-field-body">{character[key]}</p>
          ) : (
            <span className="locked-msg">Not generated — expand this character to unlock.</span>
          )}
        </div>
      ))}
      {!character.hamartia && (
        isExpanding ? (
          <div style={{ padding: ".75rem 0" }}>
            <AnimatedVerbs verbs={VERBS.expand} subtitle="Expanding character" />
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-sage"
            onClick={onExpand}
            style={{ marginTop: ".5rem" }}
          >
            ✦ Expand Character
          </button>
        )
      )}
    </div>
  );
}

export function CharacterSheet({ character, world, onBack, onUpdate, onExpand, isExpanding }) {
  const [tab, setTab] = useState("overview");
  const [regenningKey, setRegenningKey] = useState(null);
  const [regenError, setRegenError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(character.name || "");
  const tabRefs = useRef([]);

  const meta = metaLine(character);
  const role = character.role || "";
  const style = character.style || "";
  const mini = isMini(role);
  const supp = isSupport(role);
  const full = isFullRole(role);

  const availableTabs = [
    { id: "overview", label: "Overview" },
    { id: "identity", label: "Identity" },
    ...((full || supp) ? [{ id: "psychology", label: "Psychology" }] : []),
    { id: "dialogue", label: "Dialogue" },
    { id: "aristotelian", label: "Aristotelian" },
  ];

  const regen = async (fieldKey) => {
    setRegenningKey(fieldKey);
    setRegenError(null);
    try {
      const text = await callClaude(
        buildRegenPrompt(world, character, fieldKey),
        `Regenerate ${fieldKey}.`,
        { maxTokens: 500 }
      );
      return text.trim();
    } catch {
      setRegenError("Couldn't regenerate. Tap ↻ to try again.");
      setTimeout(() => setRegenError(null), 5000);
      return null;
    } finally {
      setRegenningKey(null);
    }
  };

  const regenWithFeedback = async (fieldKey, feedback) => {
    setRegenningKey(fieldKey);
    setRegenError(null);
    try {
      const text = await callClaude(
        buildRegenPrompt(world, character, fieldKey, feedback),
        `Regenerate ${fieldKey} with feedback.`,
        { maxTokens: 500 }
      );
      return text.trim();
    } catch {
      setRegenError("Couldn't regenerate. Try again.");
      setTimeout(() => setRegenError(null), 5000);
      return null;
    } finally {
      setRegenningKey(null);
    }
  };

  const confirmField = (fieldKey, value) => {
    onUpdate({ ...character, [fieldKey]: value });
    setIsDirty(true);
  };

  const saveField = (fieldKey, value) => {
    onUpdate({ ...character, [fieldKey]: value });
    setIsDirty(true);
  };

  const applyReviewFix = (fieldKey, value) => {
    onUpdate({ ...character, [fieldKey]: value });
  };

  const expandField = async (fieldKey, mode, direction) => {
    setRegenError(null);
    try {
      const text = await callClaude(
        buildFieldExpandPrompt("character", character, world, fieldKey, mode, direction),
        `Expand ${fieldKey}`,
        { maxTokens: 800 }
      );
      return text.trim();
    } catch {
      setRegenError("Couldn't expand. Try again.");
      setTimeout(() => setRegenError(null), 5000);
      return null;
    }
  };

  const F = (label, key, phil, expand = true) => (
    <CharField
      label={label}
      value={character[key]}
      fieldKey={key}
      onRegen={regen}
      onRegenWithFeedback={regenWithFeedback}
      onExpand={expand ? expandField : undefined}
      canExpand={expand}
      onSave={saveField}
      onConfirm={confirmField}
      regenningKey={regenningKey}
      philNote={phil ? PHIL[phil] : null}
    />
  );

  const handleTabKeyDown = (e, idx) => {
    const tabs = tabRefs.current.filter(Boolean);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = tabs[(idx + 1) % tabs.length];
      next?.focus();
      next?.click();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
      prev?.focus();
      prev?.click();
    }
  };

  return (
    <>
    {showReview && (
      <ReviewOverlay
        character={character}
        world={world}
        onClose={() => setShowReview(false)}
        onApplyFix={applyReviewFix}
        onComplete={() => { setIsDirty(false); setShowReview(false); }}
      />
    )}
    <div className="screen cs-page">
      <div className="cs-layout">

        {/* ── LEFT SIDEBAR ── character identity ── */}
        <aside className="cs-sidebar">
          <div className="char-header">
            <button type="button" className="back-btn" onClick={onBack}>← {world.name}</button>
            {editingName ? (
              <input
                className="char-name-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => { saveField("name", nameInput.trim()); setEditingName(false); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { saveField("name", nameInput.trim()); setEditingName(false); }
                  if (e.key === "Escape") setEditingName(false);
                }}
                autoFocus
              />
            ) : (
              <h1
                className="char-name char-name-editable"
                onClick={() => { setNameInput(character.name || ""); setEditingName(true); }}
                title="Click to edit name"
              >
                {character.name || "Unnamed"}
              </h1>
            )}
            {character.role && <p className="char-role">{character.role}</p>}
            {(meta || style || role) && (
              <div style={{ display: "flex", flexDirection: "column", gap: ".35rem" }}>
                {meta && <span className="char-meta">{meta}</span>}
                <div className="char-tags">
                  {role && <span className="char-tag">{role}</span>}
                  {style && <span className="char-tag">{style}</span>}
                </div>
              </div>
            )}
            {character.summary?.filter(Boolean).length > 0 && (
              <ul className="char-summary">
                {character.summary.filter(Boolean).map((s, i) => (
                  <li key={`summary-${i}-${s.slice(0, 10)}`} className="char-summary-item">{s}</li>
                ))}
              </ul>
            )}
            {character.quote && <p className="char-quote">"{character.quote}"</p>}
            {isDirty && (
              <button type="button" className="btn-review" onClick={() => setShowReview(true)}>
                ✦ Review
              </button>
            )}
          </div>
        </aside>

        {/* ── RIGHT MAIN ── tabs + content ── */}
        <div className="cs-main">
          <div className="divider cs-mobile-divider" />

          {regenError && (
            <div style={{ paddingTop: "1rem" }}>
              <ErrorToast message={regenError} />
            </div>
          )}

          <div className="tab-bar cs-tab-bar" role="tablist">
            {availableTabs.map((t, idx) => (
              <button
                key={t.id}
                ref={(el) => (tabRefs.current[idx] = el)}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`tabpanel-${t.id}`}
                className={`tab-btn ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div id="tabpanel-overview" role="tabpanel" className="cs-section">
              <div className="cs-fields-grid">
                {F("Consistency", "consistency", "consistency")}
                {F("Moral Core", "moralCore", "moralCore")}
              </div>
              {character.aristotelianNote && (
                <>
                  <button
                    type="button"
                    className="analysis-toggle"
                    onClick={() => setShowAnalysis((p) => !p)}
                    aria-expanded={showAnalysis}
                  >
                    <span className="analysis-label">Aristotelian Analysis</span>
                    <span style={{ fontSize: ".75rem", color: "var(--amber)" }}>{showAnalysis ? "▴" : "▾"}</span>
                  </button>
                  {showAnalysis && <p className="analysis-body">{character.aristotelianNote}</p>}
                </>
              )}
            </div>
          )}

          {tab === "identity" && (
            <div id="tabpanel-identity" role="tabpanel" className="cs-section">
              <div className="cs-fields-grid">
                {F("Appearance", "appearance", "appearance")}
                {F("Clothing", "clothing", null)}
                {F("Details", "details", null)}
                {F("Background", "background", null, true)}
              </div>
            </div>
          )}

          {tab === "psychology" && (
            <div id="tabpanel-psychology" role="tabpanel">
              {full && (
                <div className="cs-section">
                  <div className="cs-fields-grid">
                    {F("Personality", "personality", "personality", true)}
                    {F("Desires", "desires", "desires", true)}
                    {F("Fears", "fears", "fears", true)}
                    {F("Hamartia", "hamartia", "hamartia")}
                  </div>
                  {role === "Ensemble" && character.collectiveHamartia && (
                    <CharField
                      label="Collective Hamartia"
                      value={character.collectiveHamartia}
                      fieldKey="collectiveHamartia"
                      onRegen={regen}
                      onRegenWithFeedback={regenWithFeedback}
                      onSave={saveField}
                      onConfirm={confirmField}
                      onExpand={expandField}
                      canExpand
                      regenningKey={regenningKey}
                    />
                  )}
                </div>
              )}
              {supp && (
                <>
                  <div className="cs-section">
                    <div className="cs-fields-grid">
                      {F("Personality", "personality", "personality", true)}
                      {F("Desires", "desires", "desires", true)}
                      {F("Fears", "fears", "fears", true)}
                    </div>
                  </div>
                  <LockedSection
                    title="Aristotelian Core (locked)"
                    fields={[["Hamartia", "hamartia"], ["Consistency", "consistency"]]}
                    character={character}
                    onExpand={onExpand}
                    isExpanding={isExpanding}
                  />
                </>
              )}
            </div>
          )}

          {tab === "dialogue" && (
            <div id="tabpanel-dialogue" role="tabpanel" className="cs-section">
              <div className="cs-section-title">Dialogue</div>
              {character.speechMode ? (
                <CharField
                  label="Speech Mode"
                  value={character.speechMode}
                  fieldKey="speechMode"
                  onRegen={regen}
                  onSave={saveField}
                  onConfirm={confirmField}
                  regenningKey={regenningKey}
                >
                  <span className="cs-speech-tag">{character.speechMode}</span>
                </CharField>
              ) : null}
              <div className="cs-fields-grid">
                {F("Under Pressure", "underPressure", "underPressure")}
                {F("Subtext", "subtext", "subtext")}
                {F("Voice Pattern", "voicePattern", "voicePattern")}
              </div>
              {!character.underPressure && !character.subtext && !character.voicePattern && (
                <div style={{ paddingTop: ".5rem" }}>
                  {isExpanding ? (
                    <div style={{ padding: ".75rem 0" }}>
                      <AnimatedVerbs verbs={VERBS.expand} subtitle="Generating dialogue" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sage"
                      onClick={onExpand}
                    >
                      ✦ Generate Dialogue
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "aristotelian" && (
            <div id="tabpanel-aristotelian" role="tabpanel" className="cs-section">
              {full && F("Hamartia", "hamartia", "hamartia")}
              {character.relationships?.length > 0 && (
                <>
                  <div className="cs-section-title" style={{ marginTop: ".5rem" }}>Relationships</div>
                  {character.relationships.map((r, i) => (
                    <div key={i} className="rel-entry">
                      <span className="rel-name">{r.characterName}</span>
                      <span className="rel-desc">{r.description}</span>
                    </div>
                  ))}
                </>
              )}
              {character.aristotelianNote && (
                <>
                  <div className="cs-section-title" style={{ marginTop: ".5rem" }}>Analysis</div>
                  <p className="analysis-body" style={{ paddingTop: ".25rem" }}>{character.aristotelianNote}</p>
                </>
              )}
              {!full && (
                <LockedSection
                  title="Full Aristotelian Treatment"
                  fields={[["Hamartia", "hamartia"], ["Aristotelian Note", "aristotelianNote"]]}
                  character={character}
                  onExpand={onExpand}
                  isExpanding={isExpanding}
                />
              )}
            </div>
          )}

          <div style={{ height: "2rem" }} />
        </div>
      </div>
    </div>
    </>
  );
}
