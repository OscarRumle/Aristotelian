import { BottomBar } from "./BottomBar.jsx";
import { EmptyState } from "./EmptyState.jsx";

export function FactionsTab({ factions, onSelectFaction, onNewFaction }) {
  return (
    <>
      {factions.length === 0 ? (
        <EmptyState
          quote='"Factions are the structural forces that carry characters forward and consume them."'
          body="No factions yet. Give a guild, noble house, or secret society its history."
        />
      ) : (
        <div className="card-list">
          {factions.map((faction) => (
            <button
              key={faction.id}
              type="button"
              className="card"
              onClick={() => onSelectFaction(faction.id)}
            >
              <div className="card-top">
                <span className="card-name">{faction.name || "Unnamed"}</span>
                {faction.type && <span className="card-badge">{faction.type}</span>}
              </div>
              {faction.generated?.internal_tension && (
                <div className="card-role-line">{faction.generated.internal_tension}</div>
              )}
              {faction.generated?.motto && (
                <div className="card-quote">"{faction.generated.motto}"</div>
              )}
              <div className="card-cta">View faction →</div>
            </button>
          ))}
        </div>
      )}

      <BottomBar>
        <button type="button" className="btn btn-primary" onClick={onNewFaction}>
          + New Faction
        </button>
      </BottomBar>
    </>
  );
}
