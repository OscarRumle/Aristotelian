import { useState, useRef, useEffect } from "react";
import { EditableText } from "./EditableText.jsx";

function renderDocContent(text) {
  const lines = text.split("\n");
  const result = [];
  let paraLines = [];
  let key = 0;

  const flushPara = () => {
    const txt = paraLines.join(" ").trim();
    if (txt) result.push(<p key={key++} className="doc-p">{txt}</p>);
    paraLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "---") {
      flushPara();
      result.push(<hr key={key++} className="doc-hr" />);
    } else if (trimmed && /[A-Z]/.test(trimmed) && trimmed === trimmed.toUpperCase()) {
      flushPara();
      result.push(<h3 key={key++} className="doc-h3">{trimmed}</h3>);
    } else if (!trimmed) {
      flushPara();
    } else {
      paraLines.push(line);
    }
  }
  flushPara();

  return result;
}

function DocContentField({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.setSelectionRange(draft.length, draft.length);
    }
  }, [editing]);

  const open = () => { setDraft(value); setEditing(true); };
  const save = () => { onSave(draft); setEditing(false); };
  const discard = () => setEditing(false);

  if (editing) {
    return (
      <div className="editable-text-wrap">
        <textarea
          ref={ref}
          className="editable-text-input doc-content-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") discard(); }}
        />
        <div className="editable-text-actions">
          <button type="button" className="editable-save" onClick={save}>Save</button>
          <button type="button" className="editable-discard" onClick={discard}>Discard</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`doc-content-display${onSave ? " doc-content-editable" : ""}`}
      onClick={onSave ? open : undefined}
      title={onSave ? "Click to edit" : undefined}
    >
      {renderDocContent(value)}
      {onSave && <span className="editable-hint" aria-hidden="true">✎</span>}
    </div>
  );
}

export function DocumentViewer({ doc, onClose, onUpdate, backLabel = "← Lore" }) {
  const update = (field) => (val) => onUpdate?.({ ...doc, [field]: val });

  return (
    <div className="doc-viewer-overlay">
      <div className="doc-viewer-inner">
        <button type="button" className="doc-viewer-back" onClick={onClose}>
          {backLabel}
        </button>
        {onUpdate ? (
          <EditableText value={doc.title} onSave={update("title")} className="doc-viewer-title-editable" />
        ) : (
          <h1 className="doc-viewer-title">{doc.title}</h1>
        )}
        {doc.summary && (
          <div className="doc-viewer-summary">
            {onUpdate ? (
              <EditableText value={doc.summary} onSave={update("summary")} multiline className="doc-viewer-summary-editable" />
            ) : (
              <span className="doc-viewer-summary-text">{doc.summary}</span>
            )}
          </div>
        )}
        <DocContentField value={doc.content} onSave={onUpdate ? update("content") : null} />
      </div>
    </div>
  );
}
