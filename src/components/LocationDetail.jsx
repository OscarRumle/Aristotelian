import { useState } from "react";
import { callClaude } from "../api/claude.js";
import { buildEntityRegenPrompt } from "../prompts/entityRegen.js";
import { buildFieldExpandPrompt } from "../prompts/fieldExpand.js";
import { CharField } from "./CharField.jsx";
import { ErrorToast } from "./ErrorToast.jsx";
import { BottomBar } from "./BottomBar.jsx";
import { RichText } from "./RichText.jsx";
import { ReferencedIn } from "./ReferencedIn.jsx";

function DetailPill({ label, value }) {
  if (!value) return null;
  return (
    <div className="obj-detail-pill">
      <span className="obj-detail-pill-label">{label}</span>
      <span className="obj-detail-pill-value">{value}</span>
    </div>
  );
}

export function LocationDetail({ location, world, onBack, onUpdate, onNavigate, onCreateFromRef }) {
  const gen = location.generated ?? {};
  const charAssocs    = (location.associations ?? []).filter((a) => a.kind === "character");
  const factionAssocs = (location.associations ?? []).filter((a) => a.kind === "faction");
  const typeFieldEntries = Object.entries(location.typeSpecificFields ?? {}).filter(([k, v]) => v && k !== "_custom");
  const customNote = location.typeSpecificFields?._custom;

  const [regenningKey, setRegenningKey] = useState(null);
  const [regenError, setRegenError] = useState(null);

  const saveField = (fieldKey, value) => {
    onUpdate({ ...location, generated: { ...gen, [fieldKey]: value } });
  };

  const regen = async (fieldKey) => {
    setRegenningKey(fieldKey);
    setRegenError(null);
    try {
      const text = await callClaude(
        buildEntityRegenPrompt(world, location, "location", fieldKey, gen[fieldKey]),
        `Regenerate ${fieldKey}`,
        { maxTokens: 600 }
      );
      return text.trim();
    } catch {
      setRegenError("Couldn't regenerate. Try again.");
      setTimeout(() => setRegenError(null), 5000);
      return null;
    } finally {
      setRegenningKey(null);
    }
  };

  const regenWithFeedback = async (fieldKey, feedback) => {
    setRegenningKey(fieldKey);
    setRegenError(null);
    try {
      const text = await callClaude(
        buildEntityRegenPrompt(world, location, "location", fieldKey, gen[fieldKey], feedback),
        `Regenerate ${fieldKey} with feedback`,
        { maxTokens: 600 }
      );
      return text.trim();
    } catch {
      setRegenError("Couldn't regenerate. Try again.");
      setTimeout(() => setRegenError(null), 5000);
      return null;
    } finally {
      setRegenningKey(null);
    }
  };

  const expandField = async (fieldKey, mode, direction) => {
    setRegenError(null);
    try {
      const text = await callClaude(
        buildFieldExpandPrompt("location", location, world, fieldKey, mode, direction, gen[fieldKey]),
        `Expand ${fieldKey}`,
        { maxTokens: 800 }
      );
      return text.trim();
    } catch {
      setRegenError("Couldn't expand. Try again.");
      setTimeout(() => setRegenError(null), 5000);
      return null;
    }
  };

  const F = (label, fieldKey) => (
    <CharField
      label={label}
      value={gen[fieldKey]}
      fieldKey={fieldKey}
      onRegen={regen}
      onRegenWithFeedback={regenWithFeedback}
      onSave={saveField}
      onConfirm={saveField}
      onExpand={expandField}
      canExpand
      regenningKey={regenningKey}
    >
      {gen[fieldKey] ? (
        <RichText
          text={gen[fieldKey]}
          world={world}
          onNavigate={onNavigate}
          onCreateFromRef={onCreateFromRef}
          sourceContext={{ entityType: 'location', entityId: location.id, fieldKey }}
        />
      ) : null}
    </CharField>
  );

  return (
    <div className="screen loc-det-page" style={{ paddingBottom: "5rem" }}>
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
        {gen.signature_line && (
          <p className="loc-output-sig" style={{ marginTop: ".35rem" }}>
            "{gen.signature_line}"
          </p>
        )}
      </div>

      <div className="divider" />

      {regenError && <ErrorToast message={regenError} />}

      {gen.description && (
        <div className="cs-section">{F("Description", "description")}</div>
      )}
      {gen.history && (
        <div className="cs-section">{F("History", "history")}</div>
      )}
      {gen.dramatic_role && (
        <div className="cs-section">{F("Dramatic Role", "dramatic_role")}</div>
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

      <ReferencedIn
        entity={location}
        entityType="location"
        world={world}
        onNavigate={onNavigate}
      />

      <BottomBar>
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
      </BottomBar>
    </div>
  );
}
