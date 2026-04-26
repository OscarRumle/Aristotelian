import { EmptyState } from "./EmptyState.jsx";

export function WorldHub({ worlds, onSelectWorld, onNewWorld }) {
  return (
    <div className="screen wh-page">
      <div className="page-head">
        <span className="t-eyebrow">Aristotelian</span>
        <h1 className="t-display">Your Worlds</h1>
        <button type="button" className="btn btn-primary wh-new-btn" onClick={onNewWorld}>
          + New World
        </button>
      </div>
      <div className="divider" />
      {worlds.length === 0 ? (
        <EmptyState
          quote='"A character who has no real choices is not a character. They are a prop."'
          body="Create a world to begin. Every character you forge will be shaped by its tone, rules, and history."
        />
      ) : (
        <div className="card-list">
          {worlds.map((w, i) => (
            <div key={w.id} style={{ animation: `fadeUp .4s ${i * 0.06}s ease both` }}>
              <div className="card" onClick={() => onSelectWorld(w.id)}>
                <div className="card-top">
                  <span className="card-name">{w.name}</span>
                  <span className="card-badge">
                    {w.characters.length === 0
                      ? "Empty"
                      : `${w.characters.length} character${w.characters.length !== 1 ? "s" : ""}`}
                  </span>
                </div>
                <p className="card-desc">{w.tagline || w.description}</p>
                <span className="card-cta">Enter →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
