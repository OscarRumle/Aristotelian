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

export function FactionDetail({ faction, world, onBack }) {
  const gen = faction.generated;
  const charAssocs     = (faction.associations ?? []).filter((a) => a.kind === "character");
  const locationAssocs = (faction.associations ?? []).filter((a) => a.kind === "location");

  const typeFieldEntries = Object.entries(faction.typeSpecificFields ?? {}).filter(([k, v]) => v && k !== "_custom");
  const customNote = faction.typeSpecificFields?._custom;

  return (
    <div className="screen" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← {world.name}</button>
        </div>
        {(faction.type || faction.size) && (
          <span className="t-eyebrow">
            {[faction.type, faction.size].filter(Boolean).join(" · ")}
          </span>
        )}
        <h1 className="t-heading">{faction.name || "Unnamed Faction"}</h1>
        {gen?.motto && (
          <p className="fac-output-sig" style={{ marginTop: ".35rem" }}>
            "{gen.motto}"
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

      {gen?.internal_tension && (
        <div className="cs-section">
          <div className="cs-section-title">Internal Tension</div>
          <p className="cs-field-body fac-output-tension">{gen.internal_tension}</p>
        </div>
      )}

      {(faction.size || faction.status || faction.age || typeFieldEntries.length > 0 || customNote) && (
        <div className="cs-section">
          <div className="cs-section-title">Details</div>
          <div className="obj-details-grid">
            <DetailPill label="Size"   value={faction.size} />
            <DetailPill label="Status" value={faction.status} />
            <DetailPill label="Age"    value={faction.age} />
            {typeFieldEntries.map(([k, v]) => (
              <DetailPill key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
            ))}
            {customNote && <DetailPill label="Kind" value={customNote} />}
          </div>
        </div>
      )}

      {(charAssocs.length > 0 || locationAssocs.length > 0) && (
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
            {locationAssocs.map((a) => {
              const loc = (world.locations ?? []).find((l) => l.id === a.id);
              if (!loc) return null;
              return (
                <div key={a.id} className="obj-assoc-row">
                  <div className="assoc-char-top">
                    <div className="assoc-char-swatch" style={{ background: "var(--loc-accent, #3a5f7a)" }} />
                    <span className="assoc-char-name">{loc.name}</span>
                  </div>
                  {a.note && <p className="cs-field-body" style={{ marginTop: ".3rem", paddingLeft: "1.5rem" }}>{a.note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {faction.pitch && (
        <div className="cs-section">
          <div className="cs-section-title" style={{ opacity: 0.5 }}>Original pitch</div>
          <p className="cs-field-body" style={{ fontStyle: "italic", opacity: 0.6 }}>{faction.pitch}</p>
        </div>
      )}

      <BottomBar>
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
      </BottomBar>
    </div>
  );
}
