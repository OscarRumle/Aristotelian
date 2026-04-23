import { BottomBar } from "./BottomBar.jsx";
import { EmptyState } from "./EmptyState.jsx";

export function ObjectsTab({ objects, onSelectObject, onNewObject }) {
  return (
    <>
      {objects.length === 0 ? (
        <EmptyState
          quote='"The things characters carry reveal what they cannot say."'
          body="No objects yet. Give an artifact, weapon, or document its history."
        />
      ) : (
        <div className="card-list">
          {objects.map((obj) => (
            <button
              key={obj.id}
              type="button"
              className="card"
              onClick={() => onSelectObject(obj.id)}
            >
              <div className="card-top">
                <span className="card-name">{obj.name || "Unnamed"}</span>
                {obj.type && <span className="card-badge">{obj.type}</span>}
              </div>
              {obj.rarity && (
                <div className="card-role-line">{obj.rarity}</div>
              )}
              {obj.generated?.signature_line && (
                <div className="card-quote">"{obj.generated.signature_line}"</div>
              )}
              <div className="card-cta">View object →</div>
            </button>
          ))}
        </div>
      )}

      <BottomBar>
        <button type="button" className="btn btn-primary" onClick={onNewObject}>
          + New Object
        </button>
      </BottomBar>
    </>
  );
}
