import { BottomBar } from "./BottomBar.jsx";

function DetailPill({ label, value }) {
  if (!value) return null;
  return (
    <div className="obj-detail-pill">
      <span className="obj-detail-pill-label">{label}</span>
      <span className="obj-detail-pill-value">{value}</span>
    </div>
  );
}

export function LocationDetail({ location, world, onBack }) {
  const gen = location.generated;
  const charAssocs    = (location.associations ?? []).filter((a) => a.kind === "character");
  const factionAssocs = (location.associations ?? []).filter((a) => a.kind === "faction");

  const typeFieldEntries = Object.entries(location.typeSpecificFields ?? {}).filter(([k, v]) => v && k !== "_custom");
  const customNote = location.typeSpecificFields?._custom;

  return (
    <div className="screen" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← {world.name}</button>
        </div>
        {(location.type || location.scale) && (
          <span className="t-eyebrow">
            {[location.type, location.scale].filter(Boolean).join(" · ")}
          </span>
        )}
        <h1 className="t-heading">{location.name || "Unnamed Location"}</h1>
        {gen?.signature_line && (
          <p className="loc-output-sig" style={{ marginTop: ".35rem" }}>
            "{gen.signature_line}"
          </p>
        )}
      </div>

      <div className="divider" />

      {gen?.description && (
        <div className="cs-section">
          <div className="cs-section-title">Description</div>
          <p className="cs-field-body">{gen.description}</p>
        </div>
      )}

      {gen?.history && (
        <div className="cs-section">
          <div className="cs-section-title">History</div>
          <p className="cs-field-body">{gen.history}</p>
        </div>
      )}

      {gen?.dramatic_role && (
        <div className="cs-section">
          <div className="cs-section-title">Dramatic Role</div>
          <p className="cs-field-body">{gen.dramatic_role}</p>
        </div>
      )}

      {(location.scale || location.status || location.access || typeFieldEntries.length > 0 || customNote) && (
        <div className="cs-section">
          <div className="cs-section-title">Details</div>
          <div className="obj-details-grid">
            <DetailPill label="Scale"  value={location.scale} />
            <DetailPill label="Status" value={location.status} />
            <DetailPill label="Access" value={location.access} />
            {typeFieldEntries.map(([k, v]) => (
              <DetailPill key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
            ))}
            {customNote && <DetailPill label="Kind" value={customNote} />}
          </div>
        </div>
      )}

      {(charAssocs.length > 0 || factionAssocs.length > 0) && (
        <div className="cs-section">
          <div className="cs-section-title">Associations</div>
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {charAssocs.map((a) => {
              const char = (world.characters ?? []).find((c) => c.id === a.id);
              if (!char) return null;
              return (
                <div key={a.id} className="obj-assoc-row">
                  <div className="assoc-char-top">
                    <div className="assoc-char-swatch" style={{ background: char.color || "var(--amber)" }} />
                    <span className="assoc-char-name">{char.name}</span>
                  </div>
                  {a.note && <p className="cs-field-body" style={{ marginTop: ".3rem", paddingLeft: "1.5rem" }}>{a.note}</p>}
                </div>
              );
            })}
            {factionAssocs.map((a) => {
              const faction = (world.factions ?? []).find((f) => f.id === a.id);
              if (!faction) return null;
              return (
                <div key={a.id} className="obj-assoc-row">
                  <div className="assoc-char-top">
                    <div className="assoc-char-swatch" style={{ background: "var(--fac-accent, #4a6741)" }} />
                    <span className="assoc-char-name">{faction.name}</span>
                  </div>
                  {a.note && <p className="cs-field-body" style={{ marginTop: ".3rem", paddingLeft: "1.5rem" }}>{a.note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {location.pitch && (
        <div className="cs-section">
          <div className="cs-section-title" style={{ opacity: 0.5 }}>Original pitch</div>
          <p className="cs-field-body" style={{ fontStyle: "italic", opacity: 0.6 }}>{location.pitch}</p>
        </div>
      )}

      <BottomBar>
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
      </BottomBar>
    </div>
  );
}
