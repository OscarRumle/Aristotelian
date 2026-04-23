export function DocumentViewer({ doc, onClose }) {
  return (
    <div className="doc-viewer-overlay">
      <div className="doc-viewer-inner">
        <button type="button" className="doc-viewer-back" onClick={onClose}>
          ← Back to world
        </button>
        <h1 className="doc-viewer-title">{doc.title}</h1>
        <p className="doc-viewer-content">{doc.content}</p>
      </div>
    </div>
  );
}
