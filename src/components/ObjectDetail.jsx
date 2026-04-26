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

export function ObjectDetail({ object, world, onBack }) {
  const gen = object.generated;
  const charAssocs = (object.associations ?? []).filter((a) => a.kind === "character");

  const typeFieldEntries = Object.entries(object.typeSpecificFields ?? {}).filter(([, v]) => v && v !== "_custom");
  const customNote = object.typeSpecificFields?._custom;

  return (
    <div className="screen obj-det-page" style={{ paddingBottom: "5rem" }}>
      <div className="page-head">
        <div className="page-head-nav">
          <button type="button" className="back-btn" onClick={onBack}>← {world.name}</button>
        </div>
        {(object.type || object.rarity) && (
          <span className="t-eyebrow">
            {[object.type, object.rarity].filter(Boolean).join(" · ")}
          </span>
        )}
        <h1 className="t-heading">{object.name || "Unnamed Object"}</h1>
        {gen?.signature_line && (
          <p className="obj-output-sig" style={{ marginTop: ".35rem" }}>
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

      {gen?.provenance && (
        <div className="cs-section">
          <div className="cs-section-title">Provenance</div>
          <p className="cs-field-body">{gen.provenance}</p>
        </div>
      )}

      {gen?.dramatic_weight && (
        <div className="cs-section">
          <div className="cs-section-title">Dramatic Weight</div>
          <p className="cs-field-body">{gen.dramatic_weight}</p>
        </div>
      )}

      {(object.rarity || object.era || object.condition || typeFieldEntries.length > 0 || customNote) && (
        <div className="cs-section">
          <div className="cs-section-title">Details</div>
          <div className="obj-details-grid">
            <DetailPill label="Rarity" value={object.rarity} />
            <DetailPill label="Era" value={object.era} />
            <DetailPill label="Condition" value={object.condition} />
            {typeFieldEntries.map(([k, v]) => (
              <DetailPill key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
            ))}
            {customNote && <DetailPill label="Kind" value={customNote} />}
          </div>
        </div>
      )}

      {charAssocs.length > 0 && (
        <div className="cs-section">
          <div className="cs-section-title">Associations</div>
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {charAssocs.map((a) => {
              const char = (world.characters ?? []).find((c) => c.id === a.id);
              if (!char) return null;
              return (
                <div key={a.id} className="obj-assoc-row">
                  <div className="assoc-char-top">
                    <div
                      className="assoc-char-swatch"
                      style={{ background: char.color || "var(--amber)" }}
                    />
                    <span className="assoc-char-name">{char.name}</span>
                  </div>
                  {a.note && (
                    <p className="cs-field-body" style={{ marginTop: ".3rem", paddingLeft: "1.5rem" }}>
                      {a.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {object.pitch && (
        <div className="cs-section">
          <div className="cs-section-title" style={{ opacity: 0.5 }}>Original pitch</div>
          <p className="cs-field-body" style={{ fontStyle: "italic", opacity: 0.6 }}>{object.pitch}</p>
        </div>
      )}

      <BottomBar>
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
      </BottomBar>
    </div>
  );
}
