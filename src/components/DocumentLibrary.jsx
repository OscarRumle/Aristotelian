import { useState } from "react";
import { DocumentViewer } from "./DocumentViewer.jsx";

export function DocumentLibrary({ documents }) {
  const [activeDoc, setActiveDoc] = useState(null);

  if (!documents || documents.length === 0) return null;

  return (
    <>
      {activeDoc && (
        <DocumentViewer doc={activeDoc} onClose={() => setActiveDoc(null)} />
      )}
      <div className="doc-library">
        <p className="doc-library-heading">World Documents</p>
        {documents.map((doc, i) => (
          <div key={doc.id} style={{ animation: `fadeUp .4s ${i * 0.05}s ease both` }}>
            <button
              type="button"
              className="doc-card"
              onClick={() => setActiveDoc(doc)}
            >
              <span className="doc-card-title">{doc.title}</span>
              {doc.summary && <p className="doc-card-summary">{doc.summary}</p>}
              <span className="doc-card-cta">Read →</span>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
