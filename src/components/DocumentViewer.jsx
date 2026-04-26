import { useState } from "react";
import { callClaude } from "../api/claude.js";
import { buildDocSectionRegenPrompt, buildDocScanPrompt, buildDocSectionFixPrompt } from "../prompts/docSectionRegen.js";
import { buildFieldExpandPrompt } from "../prompts/fieldExpand.js";
import { CharField } from "./CharField.jsx";
import { ReviewOverlay } from "./ReviewOverlay.jsx";
import { ErrorToast } from "./ErrorToast.jsx";
import { BottomBar } from "./BottomBar.jsx";

function parseSections(content) {
  if (!content?.trim()) return [];
  const lines = content.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      if (current) sections.push(current);
      current = { heading: trimmed.slice(3).trim(), body: "" };
    } else if (trimmed.startsWith("# ")) {
      // skip — title is shown in sidebar
    } else {
      if (current) {
        current.body = current.body ? current.body + "\n" + line : line;
      }
    }
  }
  if (current) sections.push(current);

  if (sections.length === 0 && content.trim()) {
    sections.push({ heading: null, body: content.trim() });
  }

  return sections.map((s) => ({ ...s, body: s.body.trim() }));
}

function assembleSections(sections) {
  return sections
    .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
    .join("\n\n");
}

const sectionKey = (s) => s.heading || "__body__";

export function DocumentViewer({ doc, onClose, onUpdate, backLabel = "← Lore", world }) {
  const [sections, setSections] = useState(() => parseSections(doc.content));
  const [regenningKey, setRegenningKey] = useState(null);
  const [regenError, setRegenError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(doc.title || "");

  const updateSection = (fieldKey, body) => {
    const next = sections.map((s) => sectionKey(s) === fieldKey ? { ...s, body } : s);
    setSections(next);
    onUpdate?.({ ...doc, content: assembleSections(next) });
    setIsDirty(true);
  };

  const regen = async (fieldKey) => {
    const section = sections.find((s) => sectionKey(s) === fieldKey);
    if (!section) return null;
    setRegenningKey(fieldKey);
    setRegenError(null);
    try {
      const text = await callClaude(
        buildDocSectionRegenPrompt(world, doc, section.heading, section.body, sections),
        `Regenerate section`,
        { maxTokens: 900 }
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

  const regenWithFeedback = async (fieldKey, feedback) => {
    const section = sections.find((s) => sectionKey(s) === fieldKey);
    if (!section) return null;
    setRegenningKey(fieldKey);
    setRegenError(null);
    try {
      const text = await callClaude(
        buildDocSectionRegenPrompt(world, doc, section.heading, section.body, sections, feedback),
        `Regenerate section with feedback`,
        { maxTokens: 900 }
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

  const expandSection = async (fieldKey, mode, direction) => {
    const section = sections.find((s) => sectionKey(s) === fieldKey);
    if (!section) return null;
    setRegenError(null);
    try {
      const pseudoEntity = { title: doc.title, summary: doc.summary, [fieldKey]: section.body };
      const text = await callClaude(
        buildFieldExpandPrompt("lore document section", pseudoEntity, world, fieldKey, mode, direction, section.body),
        `Expand section`,
        { maxTokens: 1000 }
      );
      return text.trim();
    } catch {
      setRegenError("Couldn't expand. Try again.");
      setTimeout(() => setRegenError(null), 5000);
      return null;
    }
  };

  const applyReviewFix = (fieldKey, value) => {
    const next = sections.map((s) => sectionKey(s) === fieldKey ? { ...s, body: value } : s);
    setSections(next);
    onUpdate?.({ ...doc, content: assembleSections(next) });
  };

  const saveTitle = (val) => {
    onUpdate?.({ ...doc, title: val });
    setIsDirty(true);
  };

  return (
    <>
      <div className="screen dv-page" style={{ paddingBottom: "5rem" }}>
        <div className="cs-layout">
          <aside className="cs-sidebar">
            <div className="char-header">
              <div className="page-head-nav">
                <button type="button" className="back-btn" onClick={onClose}>{backLabel}</button>
              </div>

              {editingTitle ? (
                <input
                  className="char-name-input"
                  value={titleInput}
                  autoFocus
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={() => { saveTitle(titleInput); setEditingTitle(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") e.target.blur(); }}
                />
              ) : (
                <h1
                  className="char-name char-name-editable"
                  title="Click to edit title"
                  onClick={() => { setTitleInput(doc.title || ""); setEditingTitle(true); }}
                >
                  {doc.title || "Untitled"}
                </h1>
              )}

              {doc.summary && (
                <p className="char-role" style={{ fontStyle: "normal", marginTop: ".5rem" }}>
                  {doc.summary}
                </p>
              )}

              {isDirty && (
                <button
                  type="button"
                  className="btn-review"
                  style={{ marginTop: "1.25rem" }}
                  onClick={() => setShowReview(true)}
                >
                  ✦ Review
                </button>
              )}
            </div>
          </aside>

          <div className="cs-main">
            <div className="divider cs-mobile-divider" />

            {regenError && <ErrorToast message={regenError} />}

            <div className="cs-section">
              <div className="cs-fields-grid">
                {sections.map((section) => (
                  <CharField
                    key={sectionKey(section)}
                    label={section.heading || "Content"}
                    value={section.body}
                    fieldKey={sectionKey(section)}
                    onRegen={regen}
                    onRegenWithFeedback={regenWithFeedback}
                    onSave={updateSection}
                    onConfirm={updateSection}
                    onExpand={expandSection}
                    canExpand
                    regenningKey={regenningKey}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <BottomBar>
          <button type="button" className="btn btn-ghost" onClick={onClose}>← Back</button>
        </BottomBar>
      </div>

      {showReview && (
        <ReviewOverlay
          entityName={doc.title || "Document"}
          buildScanPrompt={(scrutiny) => buildDocScanPrompt(doc, sections, world, scrutiny)}
          buildFixPrompt={(fieldKey, fieldLabel, instruction) =>
            buildDocSectionFixPrompt(doc, sections, fieldKey === "__body__" ? null : fieldKey, instruction)
          }
          onClose={() => setShowReview(false)}
          onApplyFix={applyReviewFix}
          onComplete={() => { setShowReview(false); setIsDirty(false); }}
        />
      )}
    </>
  );
}
