import { BottomBar } from "./BottomBar.jsx";
import { EmptyState } from "./EmptyState.jsx";

export function LocationsTab({ locations, onSelectLocation, onNewLocation }) {
  return (
    <>
      {locations.length === 0 ? (
        <EmptyState
          quote='"A well-written location has atmosphere, history, and dramatic weight — not just coordinates on a map."'
          body="No locations yet. Give a city, ruin, or hidden valley its story."
        />
      ) : (
        <div className="card-list">
          {locations.map((location) => (
            <button
              key={location.id}
              type="button"
              className="card"
              onClick={() => onSelectLocation(location.id)}
            >
              <div className="card-top">
                <span className="card-name">{location.name || "Unnamed"}</span>
                {location.type && <span className="card-badge">{location.type}</span>}
              </div>
              {location.status && (
                <div className="card-role-line">{location.status}</div>
              )}
              {location.generated?.signature_line && (
                <div className="card-quote">"{location.generated.signature_line}"</div>
              )}
              <div className="card-cta">View location →</div>
            </button>
          ))}
        </div>
      )}

      <BottomBar>
        <button type="button" className="btn btn-primary" onClick={onNewLocation}>
          + New Location
        </button>
      </BottomBar>
    </>
  );
}
