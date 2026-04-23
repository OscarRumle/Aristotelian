import { useState, useEffect } from "react";
import { uid } from "../util.js";
import { callClaude } from "../api/claude.js";
import { buildLoreInterviewPrompt } from "../prompts/buildLoreInterviewPrompt.js";
import { buildLoreDocUpdatePrompt } from "../prompts/buildLoreDocUpdatePrompt.js";
import { extractJson } from "../util.js";
import { BottomBar } from "./BottomBar.jsx";
import { AnimatedVerbs, VERBS } from "./AnimatedVerbs.jsx";

export function LoreExpandInterview({ world, doc, onDone, onBack }) {
  const [step, setStep] = useState("loading"); // loading | interview | generating | error
  const [questions, setQuestions] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [freeText, setFreeText] = useState("");
  const [answers, setAnswers] = useState([]);
  const [genError, setGenError] = useState(null);

  // Load questions on first render
  useEffect(() => { loadQuestions(); }, []);

  async function loadQuestions() {
    setStep("loading");
    setGenError(null);
    try {
      const raw = await callClaude(
        buildLoreInterviewPrompt(world, doc),
        "Generate the interview questions.",
        { maxTokens: 4096 }
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
      setGenError(`Couldn't generate questions. ${err.message || ""}`);
      setStep("error");
    }
  }

  const advanceQuestion = async (optionKey = null) => {
    const q = questions[currentQIndex];
    const pickedKey = optionKey ?? selectedOption;
    const answerText =
      freeText.trim() ||
      (pickedKey ? q.options.find((o) => o.key === pickedKey)?.text : "") ||
      "";
    if (!answerText) return;

    const newAnswers = [...answers, { question: q.question, answer: answerText }];
    setAnswers(newAnswers);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setSelectedOption(null);
      setFreeText("");
    } else {
      await updateDocument(newAnswers);
    }
  };

  async function updateDocument(transcript) {
    setStep("generating");
    setGenError(null);
    try {
      const raw = await callClaude(
        buildLoreDocUpdatePrompt(world, doc, transcript),
        "Update the document.",
        { maxTokens: 4096 }
      );
      const jsonStr = extractJson(raw);
      if (!jsonStr) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonStr);
      onDone({
        ...doc,
        title: parsed.title || doc.title,
        summary: parsed.summary || doc.summary,
        content: parsed.content || doc.content,
        updatedAt: Date.now(),
      });
    } catch (err) {
      setGenError(`Couldn't update document. ${err.message || ""}`);
      setStep("error");
    }
  }

  const currentQ = questions?.[currentQIndex];
  const progressPct = questions ? Math.round((currentQIndex / questions.length) * 100) : 0;
  const canAdvance = selectedOption !== null || freeText.trim().length > 0;

  if (step === "loading") {
    return (
      <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1.5rem" }}>
        <AnimatedVerbs verbs={VERBS.interviewQuestions} subtitle={`Preparing questions for "${doc.title}"`} />
      </div>
    );
  }

  if (step === "generating") {
    return (
      <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1.5rem" }}>
        <AnimatedVerbs verbs={VERBS.docGen} subtitle={`Updating "${doc.title}"`} />
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="screen" style={{ paddingBottom: "5rem" }}>
        <div className="page-head">
          <div className="page-head-nav">
            <button type="button" className="back-btn" onClick={onBack}>← Lore</button>
          </div>
          <h1 className="t-heading">Something went wrong</h1>
          <p className="t-body" style={{ color: "var(--dust)", marginTop: ".5rem" }}>{genError}</p>
        </div>
        <BottomBar>
          <button type="button" className="btn btn-primary" onClick={loadQuestions}>Retry</button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>Cancel</button>
        </BottomBar>
      </div>
    );
  }

  return (
    <div className="screen" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← Lore</button>
        </div>
        <span className="t-eyebrow">Expanding — {doc.title}</span>

        <div className="interview-progress" style={{ marginTop: ".75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="interview-progress-label">
              Question {currentQIndex + 1} of {questions.length}
            </span>
          </div>
          <div className="interview-progress-bar">
            <div className="interview-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="divider" />

      <div style={{ paddingTop: ".5rem" }}>
        <p className="interview-question">{currentQ?.question}</p>

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
          {(currentQ?.options ?? []).map((opt) => (
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
                  <span className="interview-aristotle-badge">★ Recommended</span>
                )}
              </div>
              {opt.subtext && (
                <p className="interview-option-subtext">{opt.subtext}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      <BottomBar>
        {freeText.trim() && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => advanceQuestion()}
          >
            {currentQIndex < (questions?.length ?? 0) - 1 ? "Next Question →" : "Finish →"}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onBack}>Cancel</button>
      </BottomBar>
    </div>
  );
}
