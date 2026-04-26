import { useState, useEffect } from "react";
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

export function ObjectDetail({ object, world, onBack, onUpdate, onNavigate, onCreateFromRef, scrollToFieldKey, onScrollConsumed }) {
  const gen = object.generated ?? {};
  const charAssocs = (object.associations ?? []).filter((a) => a.kind === "character");
  const typeFieldEntries = Object.entries(object.typeSpecificFields ?? {}).filter(([, v]) => v && v !== "_custom");
  const customNote = object.typeSpecificFields?._custom;

  const [regenningKey, setRegenningKey] = useState(null);
  const [regenError, setRegenError] = useState(null);

  useEffect(() => {
    if (!scrollToFieldKey) return;
    const el = document.getElementById(`field-${scrollToFieldKey}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onScrollConsumed?.();
  }, [scrollToFieldKey]);

  const saveField = (fieldKey, value) => {
    onUpdate({ ...object, generated: { ...gen, [fieldKey]: value } });
  };

  const regen = async (fieldKey) => {
    setRegenningKey(fieldKey);
    setRegenError(null);
    try {
      const text = await callClaude(
        buildEntityRegenPrompt(world, object, "object", fieldKey, gen[fieldKey]),
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
        buildEntityRegenPrompt(world, object, "object", fieldKey, gen[fieldKey], feedback),
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
        buildFieldExpandPrompt("object", object, world, fieldKey, mode, direction, gen[fieldKey]),
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
          sourceContext={{ entityType: 'object', entityId: object.id, fieldKey }}
        />
      ) : null}
    </CharField>
  );

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
        {gen.signature_line && (
          <p className="obj-output-sig" style={{ marginTop: ".35rem" }}>
            "{gen.signature_line}"
          </p>
        )}
      </div>

      <div className="divider" />

      {regenError && <ErrorToast message={regenError} />}

      {gen.description && (
        <div id="field-description" className="cs-section">{F("Description", "description")}</div>
      )}
      {gen.provenance && (
        <div id="field-provenance" className="cs-section">{F("Provenance", "provenance")}</div>
      )}
      {gen.dramatic_weight && (
        <div id="field-dramatic_weight" className="cs-section">{F("Dramatic Weight", "dramatic_weight")}</div>
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
                    <div className="assoc-char-swatch" style={{ background: char.color || "var(--amber)" }} />
                    <span className="assoc-char-name">{char.name}</span>
                  </div>
                  {a.note && (
                    <p className="cs-field-body" style={{ marginTop: ".3rem", paddingLeft: "1.5rem" }}>{a.note}</p>
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

      <ReferencedIn
        entity={object}
        entityType="object"
        world={world}
        onNavigate={onNavigate}
      />

      <BottomBar>
        <button type="button" className="btn btn-ghost" onClick={onBack}>← Back</button>
      </BottomBar>
    </div>
  );
}
