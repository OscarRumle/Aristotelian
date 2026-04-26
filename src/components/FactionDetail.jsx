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

export function FactionDetail({ faction, world, onBack, onUpdate, onNavigate, onCreateFromRef }) {
  const gen = faction.generated ?? {};
  const charAssocs     = (faction.associations ?? []).filter((a) => a.kind === "character");
  const locationAssocs = (faction.associations ?? []).filter((a) => a.kind === "location");
  const typeFieldEntries = Object.entries(faction.typeSpecificFields ?? {}).filter(([k, v]) => v && k !== "_custom");
  const customNote = faction.typeSpecificFields?._custom;

  const [regenningKey, setRegenningKey] = useState(null);
  const [regenError, setRegenError] = useState(null);

  const saveField = (fieldKey, value) => {
    onUpdate({ ...faction, generated: { ...gen, [fieldKey]: value } });
  };

  const regen = async (fieldKey) => {
    setRegenningKey(fieldKey);
    setRegenError(null);
    try {
      const text = await callClaude(
        buildEntityRegenPrompt(world, faction, "faction", fieldKey, gen[fieldKey]),
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
        buildEntityRegenPrompt(world, faction, "faction", fieldKey, gen[fieldKey], feedback),
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
        buildFieldExpandPrompt("faction", faction, world, fieldKey, mode, direction, gen[fieldKey]),
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
          sourceContext={{ entityType: 'faction', entityId: faction.id, fieldKey }}
        />
      ) : null}
    </CharField>
  );

  return (
    <div className="screen fac-det-page" style={{ paddingBottom: "5rem" }}>
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
        {gen.motto && (
          <p className="fac-output-sig" style={{ marginTop: ".35rem" }}>
            "{gen.motto}"
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
      {gen.internal_tension && (
        <div className="cs-section">
          <CharField
            label="Internal Tension"
            value={gen.internal_tension}
            fieldKey="internal_tension"
            onRegen={regen}
            onRegenWithFeedback={regenWithFeedback}
            onSave={saveField}
            onConfirm={saveField}
            onExpand={expandField}
            canExpand
            regenningKey={regenningKey}
          >
            <p className="cs-field-body fac-output-tension">{gen.internal_tension}</p>
          </CharField>
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

      <ReferencedIn
        entity={faction}
        entityType="faction"
        world={world}
        onNavigate={onNavigate}
      />

      <BottomBar>
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
      </BottomBar>
    </div>
  );
}
