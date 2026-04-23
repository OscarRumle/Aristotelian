import { useState, useRef, useEffect, useCallback } from "react";
import { callClaudeStreaming, callClaude } from "../api/claude.js";
import { buildDialoguePrompt } from "../prompts/buildDialoguePrompt.js";
import { buildAnalysisPrompt } from "../prompts/buildAnalysisPrompt.js";
import { ROLE_OPTIONS, CHAR_COLORS, MOOD_OPTIONS } from "../constants.js";
import { BottomBar } from "./BottomBar.jsx";

// ── Helpers ────────────────────────────────────────────────────────────────

function assignColors(participants, onUpdateCharacter) {
  const used = participants.filter((c) => c.color).map((c) => c.color);
  const available = CHAR_COLORS.filter((col) => !used.includes(col));
  let idx = 0;
  participants.forEach((c) => {
    if (!c.color) {
      const col = available[idx % available.length] ?? CHAR_COLORS[idx % CHAR_COLORS.length];
      onUpdateCharacter({ ...c, color: col });
      c.color = col; // mutate local ref so subsequent code sees the color
      idx++;
    }
  });
}

function parseNdjson(accumulated) {
  return accumulated
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("{"))
    .reduce((acc, l) => {
      try {
        const obj = JSON.parse(l);
        if (obj.type === "line" || obj.type === "stage") acc.push(obj);
      } catch {
        // incomplete line — skip
      }
      return acc;
    }, []);
}

function autoName(lines) {
  const first = lines.find((l) => l.type === "line");
  if (!first) return "Untitled";
  return first.text.length > 45 ? first.text.slice(0, 42) + "…" : first.text;
}

// ── Setup screen ───────────────────────────────────────────────────────────

function SetupScreen({ world, onGenerate, onBack }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pitch, setPitch] = useState("");
  const [mood, setMood] = useState("");
  const [hamartiaOn, setHamartiaOn] = useState(true);

  const chars = world.characters;
  const selected = chars.filter((c) => selectedIds.has(c.id));
  const unselected = chars.filter((c) => !selectedIds.has(c.id));
  const canGenerate = selected.length >= 2;

  function toggleChar(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Group by role order
  const groups = ROLE_OPTIONS
    .map((opt) => ({
      role: opt.value,
      chars: chars.filter((c) => c.role === opt.value),
    }))
    .filter((g) => g.chars.length > 0);

  const ungrouped = chars.filter((c) => !ROLE_OPTIONS.some((o) => o.value === c.role));
  if (ungrouped.length > 0) groups.push({ role: "Other", chars: ungrouped });

  return (
    <div className="screen" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← Scene</button>
        </div>
        <h1 className="t-heading">New Dialogue</h1>
        <p className="t-body">Select the characters who speak, then write a pitch.</p>
      </div>
      <div className="divider" />

      {/* Character selection */}
      <div style={{ marginTop: "1.25rem" }}>
        <p className="t-eyebrow" style={{ marginBottom: ".75rem" }}>Participants (min 2)</p>
        {groups.map(({ role, chars: roleChars }) => (
          <div key={role} style={{ marginBottom: "1rem" }}>
            <p className="t-eyebrow" style={{ marginBottom: ".4rem", fontSize: ".58rem" }}>{role}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
              {roleChars.map((c) => {
                const checked = selectedIds.has(c.id);
                return (
                  <label key={c.id} className={`char-select-row ${checked ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChar(c.id)}
                      style={{ display: "none" }}
                    />
                    <span
                      className="char-select-check"
                      style={checked ? { background: "var(--amber)", borderColor: "var(--amber)" } : {}}
                    >
                      {checked && "✓"}
                    </span>
                    <span className="char-select-name">{c.name}</span>
                    {c.summary?.[0] && (
                      <span className="char-select-summary">{c.summary[0]}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mention section */}
      {unselected.length > 0 && (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <p className="t-eyebrow" style={{ marginBottom: ".5rem" }}>Available for mention</p>
          <p className="t-body" style={{ fontSize: ".8rem", marginBottom: ".6rem", color: "var(--muted)" }}>
            These characters won't speak but may be referenced naturally.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
            {unselected.map((c) => (
              <span key={c.id} className="mention-chip">{c.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="divider" style={{ margin: "1.5rem 0" }} />

      {/* Pitch */}
      <div className="f-group">
        <label className="f-label" htmlFor="dialogue-pitch">
          Pitch
        </label>
        <textarea
          id="dialogue-pitch"
          className="f-input"
          rows={4}
          placeholder="What's this scene about? What do you imagine happening? Any context, conflict, tone, or specific beats you want."
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          style={{ resize: "vertical" }}
        />
      </div>

      {/* Mood */}
      <div className="f-group" style={{ marginTop: "1rem" }}>
        <label className="f-label">Mood</label>
        <div className="pill-group">
          {MOOD_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`pill ${mood === o.value ? "active" : ""}`}
              onClick={() => setMood((prev) => (prev === o.value ? "" : o.value))}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hamartia toggle */}
      <label className="hamartia-toggle" style={{ marginTop: "1.25rem" }}>
        <div className={`hamartia-toggle-track ${hamartiaOn ? "on" : ""}`} onClick={() => setHamartiaOn((p) => !p)}>
          <div className="hamartia-toggle-thumb" />
        </div>
        <div>
          <span className="hamartia-toggle-label">Let hamartias collide</span>
          <p className="t-body" style={{ fontSize: ".78rem", marginTop: ".15rem" }}>
            Each character's core flaw is structurally active in this exchange.
          </p>
        </div>
      </label>

      <BottomBar>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canGenerate}
          onClick={() =>
            onGenerate({
              participantIds: [...selectedIds],
              mentionIds: unselected.map((c) => c.id),
              pitch,
              mood,
              hamartiaOn,
            })
          }
        >
          Generate dialogue
        </button>
        {!canGenerate && (
          <p className="t-body" style={{ fontSize: ".76rem", color: "var(--muted)" }}>
            Select at least 2 characters
          </p>
        )}
      </BottomBar>
    </div>
  );
}

// ── Dialogue View ──────────────────────────────────────────────────────────

function BubbleRow({ line, isRight, color }) {
  return (
    <div className={`bubble-row ${isRight ? "right" : "left"}`}>
      <div className="bubble-meta">
        <span className="bubble-color-chip" style={{ background: color ?? "var(--muted)" }} />
        <span className="bubble-speaker">{line.speaker}</span>
      </div>
      <div className={`bubble ${isRight ? "bubble-right" : "bubble-left"}`} style={{ "--bcolor": color ?? "var(--muted)" }}>
        {line.text}
      </div>
    </div>
  );
}

function StageDirection({ text }) {
  const clean = text.replace(/^\*|\*$/g, "").trim();
  return <p className="stage-direction">{clean}</p>;
}

function DialogueViewScreen({
  world,
  setup,        // { participantIds, mentionIds, pitch, mood, hamartiaOn }
  initialLines,
  initialAnalysis,
  initialName,
  dialogueId,   // null if unsaved
  onBack,
  onSaveDialogue,
  onUpdateCharacter,
}) {
  const participants = setup.participantIds
    .map((id) => world.characters.find((c) => c.id === id))
    .filter(Boolean);

  const mentions = (setup.mentionIds ?? [])
    .map((id) => world.characters.find((c) => c.id === id))
    .filter(Boolean);

  const [lines, setLines] = useState(initialLines ?? []);
  const [analysis, setAnalysis] = useState(initialAnalysis ?? null);
  const [streaming, setStreaming] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dialogue");
  const [direction, setDirection] = useState("");
  const [directionTarget, setDirectionTarget] = useState("@everyone");
  const [savedName, setSavedName] = useState(initialName ?? null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const preContinueRef = useRef(null);
  const bottomRef = useRef(null);

  // Assign colors on mount
  useEffect(() => {
    assignColors(participants, onUpdateCharacter);
  }, []);

  // Auto-scroll as lines arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  const colorMap = Object.fromEntries(participants.map((c) => [c.name, c.color]));

  async function generate(opts = {}) {
    const { append = false, extraDirection = "", extraTarget = "@everyone" } = opts;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const baseLines = append ? [...lines] : [];
    preContinueRef.current = baseLines;

    setStreaming(true);
    setError(null);
    if (!append) {
      setLines([]);
      setAnalysis(null);
    }

    const prompt = buildDialoguePrompt(world, participants, mentions, {
      pitch: setup.pitch,
      mood: setup.mood,
      hamartiaOn: setup.hamartiaOn,
      existingLines: baseLines,
      direction: extraDirection || direction,
      directionTarget: extraTarget || directionTarget,
    });

    // Track final lines locally to avoid stale closure in the analysis call
    let finalLines = [...baseLines];

    try {
      await callClaudeStreaming(prompt, "Generate the dialogue now.", {
        maxTokens: 2000,
        signal: ctrl.signal,
        onChunk: (accumulated) => {
          const parsed = parseNdjson(accumulated);
          finalLines = [...baseLines, ...parsed];
          setLines(finalLines);
        },
      });
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "Generation failed.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }

    // Fire analysis after streaming completes (uses finalLines, not stale state)
    if (finalLines.length > 0) {
      setAnalysisLoading(true);
      setAnalysis(null);
      try {
        const analysisText = await callClaude(
          buildAnalysisPrompt(world, participants, setup.pitch, finalLines),
          "Analyse this exchange.",
          { maxTokens: 600 }
        );
        setAnalysis(analysisText);
      } catch {
        // non-fatal — analysis just won't show
      } finally {
        setAnalysisLoading(false);
      }
    }
  }

  // Run generation on mount if no initial lines
  useEffect(() => {
    if (!initialLines || initialLines.length === 0) {
      generate();
    }
  }, []);

  function handleRegenerate() {
    generate({ append: false, extraDirection: direction, extraTarget: directionTarget });
  }

  function handleContinue() {
    generate({ append: true, extraDirection: direction, extraTarget: directionTarget });
  }

  function handleClear() {
    abortRef.current?.abort();
    setLines([]);
    setAnalysis(null);
    setStreaming(false);
  }

  function handleSave() {
    const name = savedName ?? autoName(lines);
    const dialogue = {
      id: dialogueId ?? crypto.randomUUID(),
      name,
      participantIds: setup.participantIds,
      mentionIds: setup.mentionIds ?? [],
      pitch: setup.pitch,
      mood: setup.mood,
      hamartiaOn: setup.hamartiaOn,
      lines,
      analysis,
      createdAt: Date.now(),
    };
    onSaveDialogue(dialogue);
    setSavedName(name);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="screen dialogue-screen" style={{ paddingBottom: "9rem" }}>
      <div className="page-head" style={{ paddingBottom: ".5rem" }}>
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← Scene</button>
          {saved && <span className="t-eyebrow" style={{ color: "var(--sage)" }}>Saved</span>}
        </div>
        {savedName && <p className="t-body" style={{ fontSize: ".82rem", marginTop: ".2rem" }}>{savedName}</p>}
      </div>

      {/* Tabs */}
      <div className="tab-bar" role="tablist">
        {["dialogue", "analysis"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={activeTab === t}
            className={`tab-btn ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "dialogue" && (
        <div className="dialogue-feed" style={{ paddingTop: "1rem" }}>
          {lines.length === 0 && streaming && (
            <p className="t-body" style={{ color: "var(--muted)", textAlign: "center", paddingTop: "2rem" }}>
              Writing…
            </p>
          )}

          {(() => {
            let sideIndex = 0;
            return lines.map((line, i) => {
              if (line.type === "stage") {
                return <StageDirection key={i} text={line.text} />;
              }
              const side = sideIndex % 2 === 0 ? "left" : "right";
              sideIndex++;
              return (
                <BubbleRow
                  key={i}
                  line={line}
                  isRight={side === "right"}
                  color={colorMap[line.speaker]}
                />
              );
            });
          })()}

          {error && (
            <p className="t-body" style={{ color: "var(--dust)", marginTop: "1rem" }}>{error}</p>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {activeTab === "analysis" && (
        <div style={{ paddingTop: "1.25rem" }}>
          {analysisLoading && (
            <div style={{ textAlign: "center", paddingTop: "2rem" }}>
              <div className="cast-analysis-dots">
                <span /><span /><span />
              </div>
              <p className="t-body" style={{ marginTop: "1rem" }}>Analysing the exchange…</p>
            </div>
          )}
          {analysis && !analysisLoading && (
            <div className="analysis-prose">
              <p className="t-body" style={{ lineHeight: 1.7 }}>{analysis}</p>
            </div>
          )}
          {!analysis && !analysisLoading && (
            <p className="t-body" style={{ color: "var(--muted)", paddingTop: "1rem" }}>
              Generate a dialogue to see the analysis.
            </p>
          )}
        </div>
      )}

      <BottomBar>
        <div className="direction-bar">
          <div className="direction-input-row">
            <input
              className="f-input direction-input"
              type="text"
              placeholder="Give direction…"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            />
            <select
              className="f-input direction-target"
              value={directionTarget}
              onChange={(e) => setDirectionTarget(e.target.value)}
            >
              <option value="@everyone">@everyone</option>
              {participants.map((c) => (
                <option key={c.id} value={`@${c.name}`}>@{c.name}</option>
              ))}
            </select>
          </div>
          <div className="direction-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={streaming}
              onClick={handleRegenerate}
            >
              Regenerate
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={streaming || lines.length === 0}
              onClick={handleContinue}
            >
              Continue
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={streaming}
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={lines.length === 0}
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </BottomBar>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function DialogueWriter({ world, scene, dialogueId, onBack, onSaveDialogue, onUpdateCharacter }) {
  const existingDialogue = dialogueId
    ? (scene.dialogues ?? []).find((d) => d.id === dialogueId)
    : null;

  const [setup, setSetup] = useState(
    existingDialogue
      ? {
          participantIds: existingDialogue.participantIds,
          mentionIds: existingDialogue.mentionIds,
          pitch: existingDialogue.pitch,
          mood: existingDialogue.mood,
          hamartiaOn: existingDialogue.hamartiaOn,
        }
      : null
  );

  if (!setup) {
    return (
      <SetupScreen
        world={world}
        onBack={onBack}
        onGenerate={(s) => setSetup(s)}
      />
    );
  }

  return (
    <DialogueViewScreen
      world={world}
      setup={setup}
      initialLines={existingDialogue?.lines}
      initialAnalysis={existingDialogue?.analysis}
      initialName={existingDialogue?.name}
      dialogueId={dialogueId}
      onBack={onBack}
      onSaveDialogue={onSaveDialogue}
      onUpdateCharacter={onUpdateCharacter}
    />
  );
}
