import { useState } from "react";
import { metaLine } from "../util.js";
import { ROLE_OPTIONS } from "../constants.js";
import { BottomBar } from "./BottomBar.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { ScenesTab } from "./ScenesTab.jsx";
import { WorldLibrary } from "./WorldLibrary.jsx";
import { DocumentViewer } from "./DocumentViewer.jsx";
import { EditableText } from "./EditableText.jsx";
import { ObjectsTab } from "./ObjectsTab.jsx";

function CharactersPanel({ world, onSelectCharacter }) {
  const [roleTab, setRoleTab] = useState("Recent");

  const hasMany = world.characters.length > 3;
  const presentRoles = ROLE_OPTIONS
    .map((o) => o.value)
    .filter((r) => world.characters.some((c) => c.role === r));
  const tabs = hasMany ? ["Recent", ...presentRoles] : null;

  const filtered = !tabs || roleTab === "Recent"
    ? [...world.characters].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    : world.characters.filter((c) => c.role === roleTab);

  if (world.characters.length === 0) {
    return (
      <EmptyState
        quote='"Without action there cannot be a tragedy; there may be one without character."'
        body="No characters yet. Give the LLM a pitch, a name, or nothing at all."
      />
    );
  }

  return (
    <>
      {tabs && (
        <div className="tab-bar" style={{ marginTop: "1rem" }} role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={roleTab === t}
              className={`tab-btn ${roleTab === t ? "active" : ""}`}
              onClick={() => setRoleTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: ".85rem", paddingTop: "1.5rem" }}>
        {filtered.map((c, i) => {
          const meta = metaLine(c);
          return (
            <div key={c.id} style={{ animation: `fadeUp .4s ${i * 0.06}s ease both` }}>
              <div className="card" onClick={() => onSelectCharacter(c.id)}>
                <div className="card-top">
                  <span className="card-name">{c.name || "Unnamed"}</span>
                  {meta && <span className="card-badge">{meta}</span>}
                </div>
                {c.role && <span className="card-role-line">{c.role}</span>}
                {c.quote && <p className="card-quote">"{c.quote}"</p>}
                <span className="card-cta">View character →</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function LoreView({ world, onBack, onContinueInterview, onExpandDoc, onUpdateDoc }) {
  const [activeDoc, setActiveDoc] = useState(null);
  const docs = world.documents ?? [];

  if (activeDoc) {
    return (
      <DocumentViewer
        doc={activeDoc}
        onClose={() => setActiveDoc(null)}
        onUpdate={(updated) => { onUpdateDoc(updated); setActiveDoc(updated); }}
      />
    );
  }

  return (
    <div className="screen" style={{ paddingBottom: "5rem" }}>
      <div className="tool-view-header">
        <button type="button" className="back-btn" onClick={onBack}>
          ← {world.name}
        </button>
        <h2 className="tool-view-title">Lore</h2>
      </div>

      <div style={{ marginTop: "1.25rem", marginBottom: "1rem" }}>
        <button type="button" className="btn btn-ghost" onClick={onContinueInterview}>
          + World Interview
        </button>
      </div>

      {docs.length === 0 ? (
        <EmptyState
          quote='"Every world has a history. Most of it is forgotten."'
          body="Run a World Interview to generate lore documents for this world."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {docs.map((doc, i) => (
            <div key={doc.id} style={{ animation: `fadeUp .3s ${i * 0.04}s ease both` }}>
              <div className="lore-card">
                <div className="lore-card-body" onClick={() => setActiveDoc(doc)}>
                  <span className="card-name">{doc.title}</span>
                  {doc.summary && <p className="card-desc">{doc.summary}</p>}
                </div>
                <div className="lore-card-actions">
                  <button type="button" className="btn btn-ghost lore-card-btn" onClick={() => setActiveDoc(doc)}>
                    Read →
                  </button>
                  <button type="button" className="btn btn-ghost lore-card-btn" onClick={() => onExpandDoc(doc.id)}>
                    Expand
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const COMING_SOON = [
  { id: "factions", name: "Factions", description: "Groups, allegiances, and power structures" },
];

export function WorldDetail({
  world,
  toolView,
  onSetToolView,
  onBack,
  onSelectCharacter,
  onNewCharacter,
  onDelete,
  onContinueInterview,
  onSelectScene,
  onAddScene,
  onAnalyseCast,
  onUpdateWorld,
  onUpdateDoc,
  onExpandDoc,
  onNewObject,
  onSelectObject,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const scenes = world.scenes ?? [];
  const docs = world.documents ?? [];

  // ── Characters tool sub-view ──────────────────────────────────────────────
  if (toolView === "characters") {
    return (
      <div className="screen" style={{ paddingBottom: "5rem" }}>
        <div className="tool-view-header">
          <button type="button" className="back-btn" onClick={() => onSetToolView(null)}>
            ← {world.name}
          </button>
          <h2 className="tool-view-title">Characters</h2>
        </div>
        <CharactersPanel world={world} onSelectCharacter={onSelectCharacter} />
        <BottomBar>
          <button type="button" className="btn btn-primary" onClick={onNewCharacter}>
            + New Character
          </button>
          {world.characters.length >= 2 && onAnalyseCast && (
            <button type="button" className="btn-analyse-cast" onClick={onAnalyseCast}>
              Analyse Cast
            </button>
          )}
        </BottomBar>
      </div>
    );
  }

  // ── Scenes tool sub-view ──────────────────────────────────────────────────
  if (toolView === "scenes") {
    return (
      <div className="screen" style={{ paddingBottom: "5rem" }}>
        <div className="tool-view-header">
          <button type="button" className="back-btn" onClick={() => onSetToolView(null)}>
            ← {world.name}
          </button>
          <h2 className="tool-view-title">Scenes</h2>
        </div>
        <ScenesTab
          scenes={scenes}
          onSelectScene={onSelectScene}
          onAddScene={onAddScene}
        />
      </div>
    );
  }

  // ── Lore tool sub-view ────────────────────────────────────────────────────
  if (toolView === "lore") {
    return (
      <LoreView
        world={world}
        onBack={() => onSetToolView(null)}
        onContinueInterview={onContinueInterview}
        onExpandDoc={onExpandDoc}
        onUpdateDoc={onUpdateDoc}
      />
    );
  }

  // ── Objects tool sub-view ─────────────────────────────────────────────────
  if (toolView === "objects") {
    return (
      <div className="screen" style={{ paddingBottom: "5rem" }}>
        <div className="tool-view-header">
          <button type="button" className="back-btn" onClick={() => onSetToolView(null)}>
            ← {world.name}
          </button>
          <h2 className="tool-view-title">Objects</h2>
        </div>
        <ObjectsTab
          objects={world.objects ?? []}
          onSelectObject={onSelectObject}
          onNewObject={onNewObject}
        />
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const tools = [
    {
      id: "characters",
      name: "Characters",
      description: "Build your cast using the Aristotelian framework",
      count: world.characters.length,
      unit: world.characters.length === 1 ? "character" : "characters",
      onClick: () => onSetToolView("characters"),
    },
    {
      id: "scenes",
      name: "Scenes",
      description: "Write dramatic scenes with characters in conflict",
      count: scenes.length,
      unit: scenes.length === 1 ? "scene" : "scenes",
      onClick: () => onSetToolView("scenes"),
    },
    {
      id: "lore",
      name: "Lore",
      description: "World documents, history, and interview-driven world-building",
      count: docs.length,
      unit: docs.length === 1 ? "document" : "documents",
      onClick: () => onSetToolView("lore"),
    },
    {
      id: "objects",
      name: "Objects",
      description: "Artifacts, weapons, documents, and significant things",
      count: (world.objects ?? []).length,
      unit: (world.objects ?? []).length === 1 ? "object" : "objects",
      onClick: () => onSetToolView("objects"),
    },
  ];

  return (
    <div className="screen" style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← Aristotelian</button>
        </div>
        <h1 className="t-heading">{world.name}</h1>
        {onUpdateWorld ? (
          <EditableText
            value={world.description}
            onSave={(v) => onUpdateWorld({ ...world, description: v })}
            multiline
            className="t-body world-desc-editable"
          />
        ) : (
          <p className="t-body">{world.description}</p>
        )}
      </div>
      <div className="divider" />

      {/* Tools grid */}
      <div className="tools-section">
        <p className="tools-section-label">Tools</p>
        <div className="tools-grid">
          {tools.map((tool) => (
            <button key={tool.id} type="button" className="tool-card" onClick={tool.onClick}>
              <div className="tool-card-header">
                <span className="tool-card-name">{tool.name}</span>
                {tool.count !== null && tool.count > 0 && (
                  <span className="tool-card-count">{tool.count} {tool.unit}</span>
                )}
              </div>
              <p className="tool-card-desc">{tool.description}</p>
            </button>
          ))}
          {COMING_SOON.map((tool) => (
            <div key={tool.id} className="tool-card tool-card--disabled" aria-disabled="true">
              <div className="tool-card-header">
                <span className="tool-card-name">{tool.name}</span>
                <span className="tool-card-coming">Soon</span>
              </div>
              <p className="tool-card-desc">{tool.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Library */}
      <WorldLibrary
        characters={world.characters}
        scenes={scenes}
        onSelectCharacter={onSelectCharacter}
        onSelectScene={onSelectScene}
      />

      {/* Bottom bar */}
      <BottomBar>
        {confirmDelete ? (
          <div className="delete-confirm">
            <p className="delete-confirm-msg">
              Delete <strong>{world.name}</strong> and all {world.characters.length} character{world.characters.length !== 1 ? "s" : ""}? This cannot be undone.
            </p>
            <div className="delete-confirm-actions">
              <button type="button" className="btn btn-destroy" onClick={() => onDelete(world.id)}>
                Delete
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn-delete-world" onClick={() => setConfirmDelete(true)}>
            Delete world
          </button>
        )}
      </BottomBar>
    </div>
  );
}
