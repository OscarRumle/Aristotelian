import { useState } from "react";
import { metaLine } from "../util.js";
import { EmptyState } from "./EmptyState.jsx";

const TABS = ["All", "Characters", "Scenes"];

export function WorldLibrary({ characters, scenes, onSelectCharacter, onSelectScene }) {
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();

  const filteredChars = characters.filter(
    (c) => (tab === "All" || tab === "Characters") && (!q || (c.name || "").toLowerCase().includes(q))
  );
  const filteredScenes = (scenes ?? []).filter(
    (s) => (tab === "All" || tab === "Scenes") && (!q || (s.name || "").toLowerCase().includes(q))
  );

  const isEmpty = filteredChars.length === 0 && filteredScenes.length === 0;
  const hasAny = characters.length > 0 || (scenes ?? []).length > 0;

  return (
    <div className="world-library">
      <div className="world-library-header">
        <p className="world-library-heading">Library</p>
        {hasAny && (
          <input
            className="library-search"
            type="search"
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
      </div>

      <div className="library-tab-bar" role="tablist">
        {TABS.map((t) => {
          const count = t === "Characters" ? characters.length : t === "Scenes" ? (scenes ?? []).length : null;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`library-tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
              {count !== null && count > 0 && (
                <span className="top-tab-count">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="world-library-body">
        {isEmpty && !hasAny ? (
          <EmptyState
            quote='"A world without inhabitants is only geography."'
            body="Create a character or scene to populate your library."
          />
        ) : isEmpty ? (
          <p className="library-empty-search">No results for "{search}"</p>
        ) : (
          <>
            {filteredChars.map((c, i) => {
              const meta = metaLine(c);
              return (
                <div key={c.id} style={{ animation: `fadeUp .3s ${i * 0.04}s ease both` }}>
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
            {filteredScenes.map((s, i) => (
              <div key={s.id} style={{ animation: `fadeUp .3s ${(filteredChars.length + i) * 0.04}s ease both` }}>
                <div className="card" onClick={() => onSelectScene(s.id)}>
                  <div className="card-top">
                    <span className="card-name">{s.name || "Untitled Scene"}</span>
                    {(s.dialogues ?? []).length > 0 && (
                      <span className="card-badge">{s.dialogues.length} dialogue{s.dialogues.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                  {s.description && <p className="card-desc">{s.description}</p>}
                  <span className="card-cta">View scene →</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
