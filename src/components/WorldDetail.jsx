import { useState } from "react";
import { metaLine } from "../util.js";
import { ROLE_OPTIONS } from "../constants.js";
import { BottomBar } from "./BottomBar.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { DocumentLibrary } from "./DocumentLibrary.jsx";
import { ScenesTab } from "./ScenesTab.jsx";

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

export function WorldDetail({
  world,
  onBack,
  onSelectCharacter,
  onNewCharacter,
  onDelete,
  onContinueInterview,
  onSelectScene,
  onAddScene,
  onAnalyseCast,
}) {
  const [topTab, setTopTab] = useState("Characters");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isAdvanced = world.mode === "advanced";

  return (
    <div className="screen" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← Aristotelian</button>
        </div>
        <h1 className="t-heading">{world.name}</h1>
        <p className="t-body">{world.description}</p>
      </div>
      <div className="divider" />

      {isAdvanced && <DocumentLibrary documents={world.documents} />}
      {isAdvanced && world.documents?.length > 0 && <div className="divider" style={{ marginBottom: "1rem" }} />}

      {/* Top-level Characters | Scenes tab switcher */}
      <div className="top-tab-bar" role="tablist" style={{ marginTop: "1rem" }}>
        {["Characters", "Scenes"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={topTab === t}
            className={`top-tab-btn ${topTab === t ? "active" : ""}`}
            onClick={() => setTopTab(t)}
          >
            {t}
            {t === "Characters" && world.characters.length > 0 && (
              <span className="top-tab-count">{world.characters.length}</span>
            )}
            {t === "Scenes" && (world.scenes ?? []).length > 0 && (
              <span className="top-tab-count">{(world.scenes ?? []).length}</span>
            )}
          </button>
        ))}
      </div>

      {topTab === "Characters" && (
        <CharactersPanel world={world} onSelectCharacter={onSelectCharacter} />
      )}

      {topTab === "Scenes" && (
        <ScenesTab
          scenes={world.scenes ?? []}
          onSelectScene={onSelectScene}
          onAddScene={onAddScene}
        />
      )}

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
        ) : topTab === "Characters" ? (
          <>
            <button type="button" className="btn btn-primary" onClick={onNewCharacter}>
              + New Character
            </button>
            {isAdvanced && onContinueInterview && (
              <button type="button" className="btn-continue-interview" onClick={onContinueInterview}>
                Continue Interview
              </button>
            )}
            {world.characters.length >= 2 && onAnalyseCast && (
              <button type="button" className="btn-analyse-cast" onClick={onAnalyseCast}>
                Analyse Cast
              </button>
            )}
            <button type="button" className="btn-delete-world" onClick={() => setConfirmDelete(true)}>
              Delete world
            </button>
          </>
        ) : (
          <button type="button" className="btn-delete-world" onClick={() => setConfirmDelete(true)}>
            Delete world
          </button>
        )}
      </BottomBar>
    </div>
  );
}
