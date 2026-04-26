import { useState } from "react";
import { uid } from "../util.js";
import { GENRE_OPTIONS, SCALE_OPTIONS, STYLE_OPTIONS, DEFAULT_WORLD_NAME, DEFAULT_WORLD_DESC, DEFAULT_WORLD_INSPIRATION } from "../constants.js";
import { callClaude } from "../api/claude.js";
import { buildInterviewPrompt } from "../prompts/buildInterviewPrompt.js";
import { buildDocumentsPrompt } from "../prompts/buildDocumentsPrompt.js";
import { extractJson } from "../util.js";
import { PillSelect } from "./PillSelect.jsx";
import { BottomBar } from "./BottomBar.jsx";
import { AnimatedVerbs, VERBS } from "./AnimatedVerbs.jsx";

function QuestionLoadingVerbs() {
  return <AnimatedVerbs verbs={VERBS.interviewQuestions} subtitle="Preparing your interview" />;
}

const LENS_LABELS = {
  mimesis: "The Mimesis Question — Does it hold?",
  necessity: "The Necessity Question — What must happen?",
  polis: "The Polis Question — Who holds power?",
  hamartia: "The Hamartia Question — What is the world's structural flaw?",
  possible: "The Possible Question — What stories can happen here?",
};

// Steps for new world: 'basic' → 'extended' → 'upload' → 'length' → 'interview' → 'generating'
// Steps for continue:                                      'length' → 'interview' → 'generating'

export function CreateWorldAdvanced({ existingWorld, onDone, onBack }) {
  const continueMode = !!existingWorld;

  // Basic info
  const [name, setName] = useState(existingWorld?.name ?? DEFAULT_WORLD_NAME);
  const [pitch, setPitch] = useState(existingWorld?.description ?? DEFAULT_WORLD_DESC);

  // Extended inputs
  const [genre, setGenre] = useState(existingWorld?.extendedInputs?.genre ?? "");
  const [tone, setTone] = useState(existingWorld?.extendedInputs?.tone ?? "");
  const [era, setEra] = useState(existingWorld?.extendedInputs?.era ?? "");
  const [scale, setScale] = useState(existingWorld?.extendedInputs?.scale ?? "");
  const [inspiration, setInspiration] = useState(existingWorld?.extendedInputs?.inspiration ?? DEFAULT_WORLD_INSPIRATION);
  const [distinctive, setDistinctive] = useState(existingWorld?.extendedInputs?.distinctive ?? "");

  // Wizard state
  const [step, setStep] = useState(continueMode ? "length" : "basic");
  const [errors, setErrors] = useState({});

  // Interview state
  const [interviewLength, setInterviewLength] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [freeText, setFreeText] = useState("");
  const [answers, setAnswers] = useState([]);

  // Document generation
  const [generatingDocs, setGeneratingDocs] = useState(false);
  const [genError, setGenError] = useState(null);

  const extendedInputs = { genre, tone, era, scale, inspiration, distinctive };

  // Build a partial world for prompts
  const worldRef = {
    name: name || existingWorld?.name || "",
    description: pitch || existingWorld?.description || "",
    mode: "advanced",
  };

  const startInterview = async (length) => {
    setInterviewLength(length);
    setLoadingQuestions(true);
    setGenError(null);
    const count = length === "short" ? 5 : 20;
    try {
      const raw = await callClaude(
        buildInterviewPrompt(worldRef, extendedInputs, existingWorld?.documents ?? [], count),
        "Generate the interview questions.",
        { maxTokens: 8192 }
      );
      const jsonStr = extractJson(raw);
      if (!jsonStr) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error("Invalid questions format");
      }
      setQuestions(parsed.questions);
      setCurrentQIndex(0);
      setSelectedOption(null);
      setFreeText("");
      setAnswers([]);
      setStep("interview");
    } catch (err) {
      setGenError(`Couldn't generate interview questions. ${err.message || ""}`);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const advanceQuestion = async (optionKey = null) => {
    const q = questions[currentQIndex];
    const pickedKey = optionKey ?? selectedOption;
    const answerText =
      freeText.trim() ||
      (pickedKey ? questions[currentQIndex].options.find((o) => o.key === pickedKey)?.text : "") ||
      "";
    if (!answerText) return;

    const newAnswers = [
      ...answers,
      {
        question: q.question,
        answer: answerText,
        phase: q.phase,
        lens: q.lens,
      },
    ];
    setAnswers(newAnswers);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setSelectedOption(null);
      setFreeText("");
    } else {
      // All questions answered — generate documents
      await generateDocuments(newAnswers);
    }
  };

  const generateDocuments = async (transcript) => {
    setStep("generating");
    setGeneratingDocs(true);
    setGenError(null);

    const newSession = {
      id: uid(),
      startedAt: Date.now(),
      length: interviewLength,
      transcript,
    };

    const allInterviews = [...(existingWorld?.interviews ?? []), newSession];

    try {
      const raw = await callClaude(
        buildDocumentsPrompt(worldRef, extendedInputs, allInterviews),
        "Generate the world documents.",
        { maxTokens: 8192 }
      );
      const jsonStr = extractJson(raw);
      if (!jsonStr) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed.documents)) throw new Error("Invalid documents format");

      const docs = parsed.documents.map((d) => ({
        id: uid(),
        title: d.title,
        summary: d.summary,
        content: d.content,
        generatedAt: Date.now(),
      }));

      const tagline = (parsed.tagline ?? "").trim();

      if (continueMode) {
        onDone({
          ...existingWorld,
          tagline: tagline || existingWorld.tagline || "",
          extendedInputs,
          documents: docs,
          interviews: allInterviews,
        });
      } else {
        onDone({
          id: uid(),
          name: name.trim(),
          description: pitch.trim(),
          tagline,
          characters: [],
          mode: "advanced",
          extendedInputs,
          documents: docs,
          interviews: allInterviews,
          uploadedFiles: [],
        });
      }
    } catch (err) {
      setGenError(`Couldn't generate world documents. ${err.message || ""}`);
      setStep("interview"); // go back to allow retry
    } finally {
      setGeneratingDocs(false);
    }
  };

  const canAdvanceQuestion =
    selectedOption !== null || freeText.trim().length > 0;

  const currentQ = questions?.[currentQIndex];
  const progressPct =
    questions ? Math.round((currentQIndex / questions.length) * 100) : 0;

  const NEW_WORLD_STEPS = ["basic", "extended", "upload"];
  const stepDots = continueMode ? null : NEW_WORLD_STEPS;

  // ── Rendering ──────────────────────────────────────────────────────────────

  if (step === "generating") {
    return (
      <div className="screen cwa-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1.5rem" }}>
        <AnimatedVerbs verbs={VERBS.docGen} subtitle="Building your lore bible" />
        {genError && (
          <div style={{ maxWidth: 320 }}>
            <p style={{ fontSize: ".82rem", color: "var(--dust)", textAlign: "center", lineHeight: 1.6 }}>{genError}</p>
            <button type="button" className="btn btn-ghost" style={{ marginTop: "1rem" }} onClick={() => generateDocuments(answers)}>
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="screen cwa-page" style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>
            {continueMode ? "← World" : "← New World"}
          </button>
        </div>

        {stepDots && (
          <div className="wizard-steps">
            {stepDots.map((s) => (
              <div
                key={s}
                className={`wizard-step-dot ${step === s ? "active" : NEW_WORLD_STEPS.indexOf(step) > NEW_WORLD_STEPS.indexOf(s) ? "done" : ""}`}
              />
            ))}
          </div>
        )}

        {step === "basic" && (
          <>
            <span className="t-eyebrow">Advanced World — Step 1 of 3</span>
            <h1 className="t-heading">Name your world</h1>
            <p className="t-body">Start with the basics. Every character inherits this context.</p>
          </>
        )}
        {step === "extended" && (
          <>
            <span className="t-eyebrow">Advanced World — Step 2 of 3</span>
            <h1 className="t-heading">Add context</h1>
            <p className="t-body">Optional. The more you give, the sharper the interview questions.</p>
          </>
        )}
        {step === "upload" && (
          <>
            <span className="t-eyebrow">Advanced World — Step 3 of 3</span>
            <h1 className="t-heading">Drop existing lore</h1>
            <p className="t-body">Optional. Any notes, world bibles, or inspiration material.</p>
          </>
        )}
        {step === "length" && (
          <>
            <span className="t-eyebrow">{continueMode ? "Continue Interview" : "Interview"}</span>
            <h1 className="t-heading">How deep should we go?</h1>
            <p className="t-body">
              {continueMode
                ? "Claude will read your existing world documents and ask questions that haven't been covered yet."
                : "Claude will interview your world through Aristotle's analytical lenses."}
            </p>
          </>
        )}
        {step === "interview" && currentQ && (
          <>
            <div className="interview-progress">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="interview-progress-label">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
                <span className="t-eyebrow">{interviewLength === "short" ? "Short" : "Long"} interview</span>
              </div>
              <div className="interview-progress-bar">
                <div className="interview-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            {currentQ.lens && (
              <p className="interview-lens">{LENS_LABELS[currentQ.lens] ?? currentQ.lens}</p>
            )}
          </>
        )}
      </div>

      <div className="divider" />

      {/* Step: Basic Info */}
      {step === "basic" && (
        <div className="form-stack" style={{ paddingTop: ".5rem" }}>
          <div>
            <label className="f-label">World name</label>
            <input
              className="f-input"
              placeholder="The Broken Coast, Neo-Tokyo 2187…"
              value={name}
              maxLength={60}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: null })); }}
            />
            {errors.name && <p style={{ fontSize: ".75rem", color: "var(--dust)", marginTop: ".3rem" }}>{errors.name}</p>}
          </div>
          <div>
            <label className="f-label">Pitch</label>
            <textarea
              className="f-area"
              rows={5}
              placeholder="A few sentences on genre, tone, the feel of the place…"
              value={pitch}
              onChange={(e) => { setPitch(e.target.value); setErrors((p) => ({ ...p, pitch: null })); }}
            />
            {errors.pitch && <p style={{ fontSize: ".75rem", color: "var(--dust)", marginTop: ".3rem" }}>{errors.pitch}</p>}
          </div>
        </div>
      )}

      {/* Step: Extended Inputs */}
      {step === "extended" && (
        <div className="form-stack" style={{ paddingTop: ".5rem" }}>
          <PillSelect
            label="Genre"
            options={GENRE_OPTIONS}
            value={genre}
            onChange={setGenre}
          />
          <PillSelect
            label="Tone"
            options={STYLE_OPTIONS}
            value={tone}
            onChange={setTone}
          />
          <PillSelect
            label="Scale"
            options={SCALE_OPTIONS}
            value={scale}
            onChange={setScale}
          />
          <div>
            <label className="f-label">Time period or era</label>
            <input
              className="f-input"
              placeholder="Far future, Renaissance-equivalent, timeless…"
              value={era}
              onChange={(e) => setEra(e.target.value)}
            />
          </div>
          <div>
            <label className="f-label">Existing IP or inspiration</label>
            <input
              className="f-input"
              placeholder="Similar to Dune but underwater…"
              value={inspiration}
              onChange={(e) => setInspiration(e.target.value)}
            />
          </div>
          <div>
            <label className="f-label">What makes this world distinctive</label>
            <input
              className="f-input"
              placeholder="The one thing no other world has…"
              value={distinctive}
              onChange={(e) => setDistinctive(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step: File Upload (placeholder) */}
      {step === "upload" && (
        <div style={{ paddingTop: ".5rem" }}>
          <div className="dropzone">
            <span className="dropzone-icon">📄</span>
            <p className="dropzone-label">Drop any existing lore, notes, or images</p>
            <p className="dropzone-hint">Text documents, PDFs, images — Claude will read them before generating questions.</p>
            <p className="dropzone-hint" style={{ color: "var(--amber)", marginTop: ".25rem" }}>File ingestion coming soon.</p>
          </div>
        </div>
      )}

      {/* Step: Interview Length */}
      {step === "length" && (
        <div style={{ paddingTop: ".5rem" }}>
          {genError && (
            <p style={{ fontSize: ".82rem", color: "var(--dust)", marginBottom: "1rem", lineHeight: 1.6 }}>{genError}</p>
          )}
          {loadingQuestions ? (
            <div style={{ padding: "3rem 0", display: "flex", justifyContent: "center" }}>
              <QuestionLoadingVerbs />
            </div>
          ) : (
            <div className="length-cards">
              <button
                type="button"
                className="length-card"
                onClick={() => startInterview("short")}
              >
                <span className="length-card-title">Short</span>
                <span className="length-card-qs">5 questions</span>
                <span className="length-card-time">~5 minutes</span>
              </button>
              <button
                type="button"
                className="length-card"
                onClick={() => startInterview("long")}
              >
                <span className="length-card-title">Long</span>
                <span className="length-card-qs">20 questions</span>
                <span className="length-card-time">~20 minutes</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Interview */}
      {step === "interview" && currentQ && (
        <div style={{ paddingTop: ".5rem" }}>
          <p className="interview-question">{currentQ.question}</p>

          <div className="interview-freetext">
            <label className="interview-freetext-label">Your answer</label>
            <textarea
              className="f-area"
              rows={3}
              placeholder="Type your answer, or choose one below…"
              value={freeText}
              onChange={(e) => { setFreeText(e.target.value); if (e.target.value) setSelectedOption(null); }}
            />
          </div>

          <p className="interview-options-label">Or pick one</p>
          <div className="interview-options">
            {currentQ.options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`interview-option ${selectedOption === opt.key ? "selected" : ""}`}
                onClick={() => { setSelectedOption(opt.key); setFreeText(""); advanceQuestion(opt.key); }}
              >
                <div className="interview-option-header">
                  <span className="interview-option-key">{opt.key}</span>
                  <span className="interview-option-text">{opt.text}</span>
                  {opt.recommended && (
                    <span className="interview-aristotle-badge">★ Aristotle's pick</span>
                  )}
                </div>
                {opt.subtext && (
                  <p className="interview-option-subtext">{opt.subtext}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <BottomBar>
        {step === "basic" && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const e = {};
                if (!name.trim()) e.name = "A world needs a name.";
                if (!pitch.trim()) e.pitch = "A pitch is required.";
                if (Object.keys(e).length) { setErrors(e); return; }
                setStep("extended");
              }}
            >
              Next →
            </button>
            <button type="button" className="btn btn-ghost" onClick={onBack}>Cancel</button>
          </>
        )}

        {step === "extended" && (
          <>
            <button type="button" className="btn btn-primary" onClick={() => setStep("upload")}>
              Next →
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setStep("basic")}>← Back</button>
          </>
        )}

        {step === "upload" && (
          <>
            <button type="button" className="btn btn-primary" onClick={() => setStep("length")}>
              Next →
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setStep("extended")}>← Back</button>
          </>
        )}

        {step === "length" && !loadingQuestions && (
          <button type="button" className="btn btn-ghost" onClick={onBack}>Cancel</button>
        )}

        {step === "interview" && freeText.trim() && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => advanceQuestion()}
          >
            {currentQIndex < (questions?.length ?? 0) - 1 ? "Next Question →" : "Finish Interview →"}
          </button>
        )}
      </BottomBar>
    </div>
  );
}
