import { BottomBar } from "./BottomBar.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { EditableText } from "./EditableText.jsx";

const MOOD_COLORS = {
  Tense: "var(--dust)",
  Playful: "var(--sage)",
  Aftermath: "var(--muted)",
  "First Meeting": "var(--amber)",
};

function DialogueCard({ dialogue, world, onClick }) {
  const participants = (dialogue.participantIds ?? [])
    .map((id) => world.characters.find((c) => c.id === id))
    .filter(Boolean);

  const lineCount = (dialogue.lines ?? []).filter((l) => l.type === "line").length;

  return (
    <button
      type="button"
      className="card card-button"
      onClick={onClick}
      aria-label={`Open dialogue: ${dialogue.name || "Untitled"}`}
    >
      <span className="card-top">
        <span className="card-name">{dialogue.name || "Untitled"}</span>
        {dialogue.mood && (
          <span
            className="card-badge"
            style={{ color: MOOD_COLORS[dialogue.mood] ?? "var(--muted)" }}
          >
            {dialogue.mood}
          </span>
        )}
      </span>
      {participants.length > 0 && (
        <span className="dialogue-card-participants">
          {participants.map((c) => (
            <span
              key={c.id}
              className="dialogue-participant-chip"
              style={{ "--chip-color": c.color ?? "var(--muted)" }}
            >
              {c.name}
            </span>
          ))}
        </span>
      )}
      <span className="card-cta" aria-hidden="true">
        {lineCount} {lineCount === 1 ? "exchange" : "exchanges"} · Open →
      </span>
    </button>
  );
}

export function SceneDetail({ scene, world, onBack, onNewDialogue, onSelectDialogue, onUpdateScene }) {
  const update = (field) => (val) => onUpdateScene?.({ ...scene, [field]: val });

  return (
    <div className="screen scene-page" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← {world.name}</button>
        </div>
        {onUpdateScene ? (
          <EditableText value={scene.name} onSave={update("name")} className="t-heading scene-name-editable" />
        ) : (
          <h1 className="t-heading">{scene.name}</h1>
        )}
        {scene.description && (
          onUpdateScene ? (
            <EditableText value={scene.description} onSave={update("description")} multiline className="t-body scene-desc-editable" />
          ) : (
            <p className="t-body">{scene.description}</p>
          )
        )}
      </div>
      <div className="divider" />

      {scene.dialogues?.length === 0 ? (
        <EmptyState
          quote='"Action is the mimesis of life."'
          body="No dialogues yet. Start one to put your characters in a room together."
        />
      ) : (
        <div className="card-list">
          {(scene.dialogues ?? []).map((d, i) => (
            <div key={d.id} style={{ animation: `fadeUp .4s ${i * 0.06}s ease both` }}>
              <DialogueCard
                dialogue={d}
                world={world}
                onClick={() => onSelectDialogue(d.id)}
              />
            </div>
          ))}
        </div>
      )}

      <BottomBar>
        <button type="button" className="btn btn-primary" onClick={onNewDialogue}>
          + New Dialogue
        </button>
      </BottomBar>
    </div>
  );
}
