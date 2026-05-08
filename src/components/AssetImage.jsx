import { useState, useRef, useEffect, useMemo } from "react";
import { generateImage } from "../api/higgsfield.js";
import { translateCharacterPrompt } from "../api/translateCharacterPrompt.js";
import { buildImagePrompt } from "../prompts/buildImagePrompt.js";
import {
  IMAGE_STYLE_FIELDS,
  IMAGE_ASPECT_RATIOS,
  IMAGE_STYLE_DEFAULTS,
  IMAGE_MODELS,
  IMAGE_MODEL_DEFAULT,
  getImageFieldLabel,
} from "../constants.js";

const STATUS_LABELS = {
  queued:      "Queued",
  in_progress: "Painting",
  completed:   "Done",
  failed:      "Failed",
  nsfw:        "Blocked by moderation",
};

function diffOverrides(a, b) {
  const ka = Object.keys(a || {});
  const kb = Object.keys(b || {});
  if (ka.length !== kb.length) return true;
  for (const k of ka) if ((a[k] ?? null) !== (b[k] ?? null)) return true;
  return false;
}

/**
 * Visual panel for any asset type.
 *
 * For characters specifically: the "Subject" line shown to FLUX is sourced
 * from `character.imagePromptDraft` — a cached, image-model-friendly visual
 * description produced by the translator (translateCharacterPrompt). The user
 * can edit the textarea directly, or click "Refresh from character" to
 * re-translate from the latest profile fields. On Generate, if no draft
 * exists yet, we translate first, persist, then submit to FLUX.
 *
 * Style override semantics (per-field):
 *   - key absent              → use world preset
 *   - value === ""            → field is intentionally empty (omitted from prompt)
 *   - value === non-empty str → override
 *
 * Note: object/location/faction subjects still use the auto-built composer in
 * buildImagePrompt — translator coverage for those is a follow-up.
 */
export function AssetImage({ type, asset, world, onUpdate }) {
  const isCharacter = type === "character";
  const worldPreset =
    world?.imageStyles?.[type] ??
    IMAGE_STYLE_DEFAULTS[type] ??
    {};
  const savedOverrides = asset?.imageStyleOverrides || {};
  const savedDraft = asset?.imagePromptDraft ?? "";
  const aspectRatio = IMAGE_ASPECT_RATIOS[type] || "3:4";
  const modelEndpoint = IMAGE_MODELS[type] || IMAGE_MODEL_DEFAULT;

  const [generating, setGenerating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(savedOverrides);
  const [subjectDraft, setSubjectDraft] = useState(savedDraft);
  // "translated" / "edited" / "empty" — tracks whether the textarea is the
  // raw translator output, has been hand-edited since translation, or empty.
  const [subjectState, setSubjectState] = useState(() => savedDraft ? "translated" : "empty");
  const [subjectStamp, setSubjectStamp] = useState(null);
  const abortRef = useRef(null);
  const translateAbortRef = useRef(null);

  useEffect(() => () => { abortRef.current?.abort(); translateAbortRef.current?.abort(); }, []);

  // Reset everything when the asset itself changes (navigation).
  useEffect(() => {
    setDraft(savedOverrides);
    setSubjectDraft(savedDraft);
    setSubjectState(savedDraft ? "translated" : "empty");
    setSubjectStamp(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  const overridesDirty = useMemo(() => diffOverrides(draft, savedOverrides), [draft, savedOverrides]);
  const subjectDirty = subjectDraft !== savedDraft;
  const dirty = overridesDirty || subjectDirty;

  const promptForRun = useMemo(() => {
    const liveDraft = isCharacter ? (editing ? subjectDraft : savedDraft) : undefined;
    const assetForPrompt = {
      ...asset,
      imageStyleOverrides: editing ? draft : savedOverrides,
      ...(isCharacter ? { imagePromptDraft: liveDraft } : {}),
    };
    return buildImagePrompt({ type, asset: assetForPrompt, worldPreset });
  }, [asset, editing, draft, savedOverrides, subjectDraft, savedDraft, worldPreset, type, isCharacter]);

  const autoTriedRef = useRef(new Set());
  useEffect(() => {
    if (!world?.autoGenerateImages) return;
    if (asset?.image?.url) return;
    if (!asset?.id) return;
    if (autoTriedRef.current.has(asset.id)) return;
    if (generating) return;
    autoTriedRef.current.add(asset.id);
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id, world?.autoGenerateImages]);

  // Field controls --------------------------------------------------------

  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const clearOverride = (key) => setDraft((d) => { const n = { ...d }; delete n[key]; return n; });
  const setEmpty = (key) => setDraft((d) => ({ ...d, [key]: "" }));

  const saveDraft = () => {
    const patch = { imageStyleOverrides: draft };
    if (isCharacter) patch.imagePromptDraft = subjectDraft || null;
    onUpdate?.(patch);
  };

  const discardDraft = () => {
    setDraft(savedOverrides);
    setSubjectDraft(savedDraft);
    setSubjectState(savedDraft ? "translated" : "empty");
    setSubjectStamp(null);
    setEditing(false);
  };

  const resetAllToPreset = () => {
    setDraft({});
    if (isCharacter) {
      setSubjectDraft("");
      setSubjectState("empty");
      setSubjectStamp(null);
    }
  };

  // Translation -----------------------------------------------------------

  const translate = async ({ silent = false } = {}) => {
    if (translating) return null;
    if (!silent) setError(null);
    setTranslating(true);
    const ctrl = new AbortController();
    translateAbortRef.current = ctrl;
    try {
      const text = await translateCharacterPrompt(world, asset, { signal: ctrl.signal });
      setSubjectDraft(text);
      setSubjectState("translated");
      setSubjectStamp(new Date());
      return text;
    } catch (err) {
      if (err?.name !== "AbortError") {
        setError(err?.message || "Translation failed");
      }
      return null;
    } finally {
      setTranslating(false);
      translateAbortRef.current = null;
    }
  };

  // Generation ------------------------------------------------------------

  const run = async () => {
    if (generating) return;
    setError(null);

    // For characters: ensure a translated subject exists before submitting.
    let promptToSend = promptForRun;
    if (isCharacter && !savedDraft && !subjectDraft) {
      const text = await translate({ silent: true });
      if (!text) return; // translation failed — error is already set
      // Persist the freshly translated draft so it survives reload.
      onUpdate?.({ imagePromptDraft: text });
      // Recompose the prompt with the new draft.
      const assetForPrompt = {
        ...asset,
        imageStyleOverrides: editing ? draft : savedOverrides,
        imagePromptDraft: text,
      };
      promptToSend = buildImagePrompt({ type, asset: assetForPrompt, worldPreset });
    }

    setStatus("queued");
    setGenerating(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const result = await generateImage(promptToSend, {
        aspectRatio,
        modelEndpoint,
        signal: ctrl.signal,
        onStatus: (s) => setStatus(s),
      });
      onUpdate?.({
        image: {
          url: result.url,
          prompt: result.prompt,
          model: result.model,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      if (err?.name === "AbortError") {
        // user cancelled
      } else {
        setError(err?.message || "Image generation failed");
      }
    } finally {
      setGenerating(false);
      setStatus(null);
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();

  // ── Render ─────────────────────────────────────────────────────────────

  let subjectHelper = null;
  if (isCharacter) {
    if (translating)                 subjectHelper = "Translating from character profile…";
    else if (!subjectDraft)          subjectHelper = "Empty — click Refresh to translate from the character profile";
    else if (subjectState === "edited")     subjectHelper = "Custom-edited";
    else if (subjectStamp)           subjectHelper = `Translated from character at ${subjectStamp.toLocaleTimeString()}`;
    else                              subjectHelper = "Translated from character";
  }

  return (
    <section className="asset-image">
      <div className="asset-image-frame" style={{ aspectRatio: aspectRatio.replace(":", " / ") }}>
        {asset?.image?.url ? (
          <img src={asset.image.url} alt={asset?.name || "asset image"} className="asset-image-img" />
        ) : (
          <div className="asset-image-placeholder">
            <span className="asset-image-placeholder-mark">◯</span>
            <span className="asset-image-placeholder-text">
              {generating ? STATUS_LABELS[status] || "Generating" : translating ? "Translating" : "No image yet"}
            </span>
          </div>
        )}
        {generating && asset?.image?.url ? (
          <div className="asset-image-overlay">{STATUS_LABELS[status] || "Generating"}</div>
        ) : null}
      </div>

      <div className="asset-image-actions">
        {!generating ? (
          <button type="button" className="btn btn-sage btn-sm" onClick={run} disabled={translating}>
            {asset?.image?.url ? "Regenerate" : "Generate image"}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}>
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => { if (editing) discardDraft(); else setEditing(true); }}
        >
          {editing ? "Close" : "Edit prompt"}
        </button>
        {dirty && !editing ? <span className="asset-image-dirty">unsaved</span> : null}
      </div>

      {error ? <div className="asset-image-error">{error}</div> : null}

      {editing ? (
        <div className="asset-image-prompt-editor">
          <div className="asset-image-editor-head">
            <p className="t-eyebrow">Visual style · {type}</p>
            <p className="asset-image-editor-hint">
              {isCharacter
                ? "The subject is translated from this character's profile into a description an image model can render. Edit it directly, or refresh from the character. Style fields below set the rest of the prompt."
                : `Overrides apply to this ${type} only. Leave a field on its preset to inherit the world default. Set a field to empty to omit it from the prompt entirely.`}
            </p>
          </div>

          {isCharacter ? (
            <div className="asset-image-subject">
              <div className="asset-image-field-row">
                <label className="asset-image-field-label">Subject (visual prompt)</label>
                <div className="asset-image-field-controls">
                  <button
                    type="button"
                    className="asset-image-link-btn"
                    onClick={() => translate()}
                    disabled={translating}
                  >
                    {translating ? "translating…" : (subjectDraft ? "refresh from character" : "translate from character")}
                  </button>
                </div>
              </div>
              <textarea
                className="asset-image-subject-textarea"
                value={translating ? "" : subjectDraft}
                placeholder={translating ? "Translating from character profile…" : "young East Asian girl, eleven years old, slight build, …"}
                disabled={translating}
                rows={5}
                onChange={(e) => {
                  setSubjectDraft(e.target.value);
                  setSubjectState(e.target.value ? "edited" : "empty");
                }}
              />
              <p className="asset-image-field-helper asset-image-subject-state">
                {subjectHelper}
              </p>
            </div>
          ) : null}

          <div className="asset-image-fields">
            {IMAGE_STYLE_FIELDS.map(({ key }) => {
              const label = getImageFieldLabel(type, key);
              const presetVal = worldPreset[key] || "";
              const draftVal = draft[key];
              const hasOverride = draftVal !== undefined;
              const isExplicitEmpty = draftVal === "";
              const inputValue = hasOverride ? draftVal : "";

              let helper;
              if (!hasOverride) helper = <>Using preset{presetVal ? <>: <em>{presetVal}</em></> : null}</>;
              else if (isExplicitEmpty) helper = "Empty — omitted from prompt";
              else helper = "Overridden";

              return (
                <div key={key} className="asset-image-field">
                  <div className="asset-image-field-row">
                    <label className="asset-image-field-label">{label}</label>
                    <div className="asset-image-field-controls">
                      {hasOverride ? (
                        <button type="button" className="asset-image-link-btn" onClick={() => clearOverride(key)}>
                          use preset
                        </button>
                      ) : null}
                      {!isExplicitEmpty ? (
                        <button type="button" className="asset-image-link-btn" onClick={() => setEmpty(key)}>
                          leave empty
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <input
                    type="text"
                    className="asset-image-field-input"
                    value={inputValue}
                    placeholder={hasOverride && isExplicitEmpty ? "" : presetVal}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                  <p className="asset-image-field-helper">{helper}</p>
                </div>
              );
            })}
          </div>

          <details className="asset-image-prompt-preview">
            <summary>Preview composed prompt</summary>
            <pre>{promptForRun || "(subject empty — click translate or write one above)"}</pre>
          </details>

          <div className="asset-image-editor-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={resetAllToPreset}
              disabled={Object.keys(draft).length === 0 && (!isCharacter || !subjectDraft)}
            >
              Reset all
            </button>
            <div className="asset-image-editor-actions-right">
              <button type="button" className="btn btn-ghost btn-sm" onClick={discardDraft}>
                {dirty ? "Discard" : "Close"}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => { saveDraft(); setEditing(false); }}
                disabled={!dirty}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {asset?.image?.generatedAt ? (
        <div className="asset-image-meta">
          Generated {new Date(asset.image.generatedAt).toLocaleString()}
        </div>
      ) : null}
    </section>
  );
}
