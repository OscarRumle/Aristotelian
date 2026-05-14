import { useState } from "react";
import { metaLine } from "../util.js";
import { collectUnresolvedAcrossWorld } from "../utils/unresolvedMentions.js";
import { ROLE_OPTIONS } from "../constants.js";
import { BottomBar } from "./BottomBar.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { ScenesTab } from "./ScenesTab.jsx";
import { WorldLibrary } from "./WorldLibrary.jsx";
import { DocumentViewer } from "./DocumentViewer.jsx";
import { EditableText } from "./EditableText.jsx";
import { ObjectsTab } from "./ObjectsTab.jsx";
import { FactionsTab } from "./FactionsTab.jsx";
import { LocationsTab } from "./LocationsTab.jsx";
import { ImageStyleSettings } from "./ImageStyleSettings.jsx";
import { RelationshipWeb } from "./RelationshipWeb.jsx";

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
      <div className="card-list">
        {filtered.map((c, i) => {
          const meta = metaLine(c);
          return (
            <div key={c.id} style={{ animation: `fadeUp .4s ${i * 0.06}s ease both` }}>
              <button
                type="button"
                className="card card-button"
                onClick={() => onSelectCharacter(c.id)}
                aria-label={`View character: ${c.name || "Unnamed"}`}
              >
                <span className="card-top">
                  <span className="card-name">{c.name || "Unnamed"}</span>
                  {meta && <span className="card-badge">{meta}</span>}
                </span>
                {c.role && <span className="card-role-line">{c.role}</span>}
                {c.quote && <p className="card-quote">"{c.quote}"</p>}
                <span className="card-cta" aria-hidden="true">View character →</span>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function LoreView({ world, onBack, onContinueInterview, onExpandDoc, onUpdateDoc, onNavigate, onCreateFromRef }) {
  const [activeDoc, setActiveDoc] = useState(null);
  const docs = world.documents ?? [];

  if (activeDoc) {
    return (
      <DocumentViewer
        doc={activeDoc}
        world={world}
        onClose={() => setActiveDoc(null)}
        onUpdate={(updated) => { onUpdateDoc(updated); setActiveDoc(updated); }}
        onNavigate={onNavigate}
        onCreateFromRef={onCreateFromRef}
      />
    );
  }

  return (
    <div className="screen wd-page" style={{ paddingBottom: "5rem" }}>
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
  onNewFaction,
  onSelectFaction,
  onNewLocation,
  onSelectLocation,
  onOpenLooseEnds,
  onNavigate,
  onCreateFromRef,
  onUpdateCharacter,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const scenes = world.scenes ?? [];
  const docs = world.documents ?? [];

  // ── Characters tool sub-view ──────────────────────────────────────────────
  if (toolView === "characters") {
    return (
      <div className="screen wd-page" style={{ paddingBottom: "5rem" }}>
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
      <div className="screen wd-page" style={{ paddingBottom: "5rem" }}>
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
      <div className="screen wd-page" style={{ paddingBottom: "5rem" }}>
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

  // ── Factions tool sub-view ────────────────────────────────────────────────
  if (toolView === "factions") {
    return (
      <div className="screen wd-page" style={{ paddingBottom: "5rem" }}>
        <div className="tool-view-header">
          <button type="button" className="back-btn" onClick={() => onSetToolView(null)}>
            ← {world.name}
          </button>
          <h2 className="tool-view-title">Factions</h2>
        </div>
        <FactionsTab
          factions={world.factions ?? []}
          onSelectFaction={onSelectFaction}
          onNewFaction={onNewFaction}
        />
      </div>
    );
  }

  // ── Relationship Web tool sub-view ────────────────────────────────────────
  if (toolView === "relationships") {
    return (
      <RelationshipWeb
        world={world}
        onBack={() => onSetToolView(null)}
        onUpdateWorld={onUpdateWorld}
        onUpdateCharacter={onUpdateCharacter}
        onNewCharacter={onNewCharacter}
      />
    );
  }

  // ── Locations tool sub-view ───────────────────────────────────────────────
  if (toolView === "locations") {
    return (
      <div className="screen wd-page" style={{ paddingBottom: "5rem" }}>
        <div className="tool-view-header">
          <button type="button" className="back-btn" onClick={() => onSetToolView(null)}>
            ← {world.name}
          </button>
          <h2 className="tool-view-title">Locations</h2>
        </div>
        <LocationsTab
          locations={world.locations ?? []}
          onSelectLocation={onSelectLocation}
          onNewLocation={onNewLocation}
        />
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const charCount = world.characters.length;
  const looseEndsCount = collectUnresolvedAcrossWorld(world).length;

  const worldBuildingTools = [
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
    {
      id: "factions",
      name: "Factions",
      description: "Noble houses, guilds, secret societies, and power structures",
      count: (world.factions ?? []).length,
      unit: (world.factions ?? []).length === 1 ? "faction" : "factions",
      onClick: () => onSetToolView("factions"),
    },
    {
      id: "locations",
      name: "Locations",
      description: "Places that carry atmosphere, history, and dramatic weight",
      count: (world.locations ?? []).length,
      unit: (world.locations ?? []).length === 1 ? "location" : "locations",
      onClick: () => onSetToolView("locations"),
    },
    {
      id: "relationships",
      name: "Relationship Web",
      description: "Map how characters' flaws pull against each other",
      count: (world.relationships ?? []).length,
      unit: (world.relationships ?? []).length === 1 ? "connection" : "connections",
      onClick: () => onSetToolView("relationships"),
    },
    ...(onOpenLooseEnds ? [{
      id: "looseEnds",
      name: "Loose Ends",
      description: "Mentions in prose that don't yet exist as entities",
      count: looseEndsCount,
      unit: looseEndsCount === 1 ? "loose end" : "loose ends",
      onClick: onOpenLooseEnds,
    }] : []),
  ];

  return (
    <div className="screen wd-page" style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div className="page-head">
        <div className="page-head-nav wd-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← Aristotelian</button>
          <div className="wd-head-menu">
            <button
              type="button"
              className="icon-btn wd-head-menu-trigger"
              aria-label="World options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((p) => !p)}
            >
              ⋯
            </button>
            {menuOpen && (
              <>
                <div className="wd-head-menu-overlay" onClick={() => setMenuOpen(false)} />
                <div className="wd-head-menu-panel" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="wd-head-menu-item wd-head-menu-item--danger"
                    onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                  >
                    Delete world…
                  </button>
                </div>
              </>
            )}
          </div>
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

      {/* Characters — primary tool */}
      <div className="tools-section">
        <p className="tools-section-label">Characters</p>
        <button type="button" className="tool-card tool-card-primary" onClick={() => onSetToolView("characters")}>
          <div className="tool-card-header">
            <span className="tool-card-name">Cast</span>
            {charCount > 0 && (
              <span className="tool-card-count">{charCount} {charCount === 1 ? "character" : "characters"}</span>
            )}
          </div>
          <p className="tool-card-desc">Build your cast using the Aristotelian framework</p>
        </button>
      </div>

      {/* World Building — secondary tools */}
      <div className="tools-section">
        <p className="tools-section-label">World Building</p>
        <div className="tools-grid">
          {worldBuildingTools.map((tool) => (
            <button key={tool.id} type="button" className="tool-card" onClick={tool.onClick}>
              <div className="tool-card-header">
                <span className="tool-card-name">{tool.name}</span>
                {tool.count > 0 && (
                  <span className="tool-card-count">{tool.count} {tool.unit}</span>
                )}
              </div>
              <p className="tool-card-desc">{tool.description}</p>
            </button>
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

      {onUpdateWorld ? (
        <details className="wd-visual-style">
          <summary>Visual style</summary>
          <ImageStyleSettings world={world} onUpdate={onUpdateWorld} />
        </details>
      ) : null}

      {/* Bottom bar */}
      <BottomBar>
        <button type="button" className="btn btn-primary btn-block" onClick={onNewCharacter}>
          + New Character
        </button>
      </BottomBar>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3 id="confirm-delete-title" className="modal-title">Delete this world?</h3>
              <p className="modal-sub">
                <strong>{world.name}</strong> and all {charCount} character{charCount !== 1 ? "s" : ""} will be removed. This cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-destroy" onClick={() => onDelete(world.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
