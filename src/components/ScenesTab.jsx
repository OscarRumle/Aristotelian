import { useState } from "react";
import { EmptyState } from "./EmptyState.jsx";

function SceneCard({ scene, onClick }) {
  const count = scene.dialogues?.length ?? 0;
  return (
    <button
      type="button"
      className="card card-button"
      onClick={onClick}
      aria-label={`Open scene: ${scene.name}`}
    >
      <span className="card-top">
        <span className="card-name">{scene.name}</span>
        <span className="card-badge">
          {count} {count === 1 ? "dialogue" : "dialogues"}
        </span>
      </span>
      {scene.description && (
        <p className="card-desc">{scene.description}</p>
      )}
      <span className="card-cta" aria-hidden="true">Open scene →</span>
    </button>
  );
}

export function ScenesTab({ scenes, onSelectScene, onAddScene }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAddScene({
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      createdAt: Date.now(),
      dialogues: [],
    });
    setName("");
    setDescription("");
    setCreating(false);
  }

  return (
    <div style={{ paddingTop: "1.5rem" }}>
      {scenes.length === 0 && !creating && (
        <EmptyState
          quote='"The plot is the soul of a tragedy."'
          body="No scenes yet. A scene holds the creative work — dialogues, conflicts, moments."
        />
      )}

      {scenes.length > 0 && (
        <div className="card-list" style={{ paddingTop: 0 }}>
          {scenes.map((s, i) => (
            <div key={s.id} style={{ animation: `fadeUp .4s ${i * 0.06}s ease both` }}>
              <SceneCard scene={s} onClick={() => onSelectScene(s.id)} />
            </div>
          ))}
        </div>
      )}

      {creating ? (
        <form onSubmit={handleCreate} className="scene-create-form">
          <div className="f-group">
            <label className="f-label" htmlFor="scene-name">Scene name</label>
            <input
              id="scene-name"
              className="f-input"
              type="text"
              placeholder="The Tavern Confrontation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="f-group">
            <label className="f-label" htmlFor="scene-desc">Premise</label>
            <textarea
              id="scene-desc"
              className="f-input"
              rows={3}
              placeholder="What is this scene about? Where, when, who's there, what's at stake. This becomes the starting context for every dialogue you generate inside it."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", gap: ".6rem", marginTop: ".5rem" }}>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              Create scene
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setCreating(false); setName(""); setDescription(""); }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: scenes.length > 0 ? "1.25rem" : "0" }}
          onClick={() => setCreating(true)}
        >
          + New Scene
        </button>
      )}
    </div>
  );
}
