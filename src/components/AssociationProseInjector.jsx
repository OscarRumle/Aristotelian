import { useState } from "react";
import { callClaude } from "../api/claude.js";
import { buildAssociationProsePrompt } from "../prompts/buildAssociationProse.js";
import { PROSE_FIELDS } from "../utils/backlinks.js";

/**
 * Transient inline UI that appears after a new association is added.
 * Lets the user weave a one-sentence prose mention into a chosen field.
 *
 * Props:
 *   world
 *   entity         — source entity (the one whose field will be appended to)
 *   entityType     — 'character' | 'object' | 'faction' | 'location'
 *   target         — { id, kind, name, relation? } the just-added association
 *   onWrite        — (fieldKey, newText) => void   — caller writes the new value back
 *   onDismiss      — () => void
 */
export function AssociationProseInjector({ world, entity, entityType, target, onWrite, onDismiss }) {
  const fields = PROSE_FIELDS[entityType] ?? [];
  const onGenerated = entityType === 'object' || entityType === 'faction' || entityType === 'location';
  const [fieldKey, setFieldKey] = useState(fields[0]?.key ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!target || fields.length === 0) return null;

  async function handleGenerate() {
    if (!fieldKey) return;
    const fieldDef = fields.find((f) => f.key === fieldKey);
    if (!fieldDef) return;
    const currentValue = onGenerated ? entity.generated?.[fieldKey] : entity[fieldKey];

    setBusy(true);
    setError(null);
    try {
      const sentence = await callClaude(
        buildAssociationProsePrompt({
          world,
          sourceEntity: entity,
          sourceType: entityType,
          fieldKey,
          fieldLabel: fieldDef.label,
          currentValue,
          target,
        }),
        `Add ${target.name} to ${fieldDef.label}`,
        { maxTokens: 220 }
      );
      const trimmed = sentence.trim().replace(/^["']|["']$/g, '');
      const merged = currentValue ? currentValue.trimEnd() + " " + trimmed : trimmed;
      onWrite(fieldKey, merged);
      onDismiss();
    } catch {
      setError("Couldn't generate. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="assoc-prose-injector" role="region" aria-label="Add connection to prose">
      <div className="assoc-prose-injector-head">
        <span className="assoc-prose-injector-title">
          Mention <strong>{target.name}</strong> in a field?
        </span>
        <button
          type="button"
          className="assoc-prose-injector-dismiss"
          onClick={onDismiss}
          aria-label="Skip"
        >
          ✕
        </button>
      </div>

      <div className="assoc-prose-injector-row">
        <select
          className="assoc-prose-injector-select"
          value={fieldKey}
          onChange={(e) => setFieldKey(e.target.value)}
          disabled={busy}
          aria-label="Field to extend"
        >
          {fields.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary assoc-prose-injector-go"
          onClick={handleGenerate}
          disabled={busy}
        >
          {busy ? "Writing…" : "Write a line →"}
        </button>
      </div>

      {error && <p className="assoc-prose-injector-error">{error}</p>}
    </div>
  );
}
