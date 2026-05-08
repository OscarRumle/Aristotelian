// Compose a Higgsfield image prompt for any asset type. Pure string
// composition; no LLM call. Returns the final prompt that goes to
// generateImage(). The shape mirrors the user's hand-authored example:
//
//   Subject: <derived from asset's visual fields>
//   Location: <preset>
//   Year: <preset>
//   Artist Style: <preset>
//   Game art style inspiration: <preset>
//   Medium: <preset>
//   Expression: <preset>
//   Rendering: <preset>
//   Lighting: <preset>
//   Color: <preset>
//
// Per-asset overrides (asset.imageStyleOverrides) shadow the world preset
// field-by-field. An empty override falls through to the preset.

import { IMAGE_STYLE_FIELDS, getImageFieldLabel } from "../constants.js";

function clean(s) {
  return typeof s === "string" ? s.trim() : "";
}

function joinClean(...parts) {
  return parts.map(clean).filter(Boolean).join(", ");
}

// ── Subject builders, one per asset type ────────────────────────────────────

// Character subject is sourced from the cached LLM-translated visual prompt
// (character.imagePromptDraft). The translator strips proper names,
// nationality labels, and narrative noise — see translateCharacterPrompt.js.
// AssetImage triggers translation lazily on first Generate.
//
// Empty draft → empty subject → caller (AssetImage) auto-translates before
// submitting. We deliberately do NOT fall back to raw character prose, because
// that re-introduces the "FLUX has no idea who Penny Okafor is" problem.
function characterSubject(c) {
  if (!c) return "";
  const draft = clean(c.imagePromptDraft);
  if (!draft) return "";
  return `Portrait of a ${draft}`;
}

// Note: object/location/faction store generated copy under `.generated.*`,
// while character stores fields directly on the record. The subject builders
// below mirror that split.

function typeSpecific(asset) {
  const tsf = asset?.typeSpecificFields || {};
  return Object.entries(tsf)
    .filter(([k, v]) => k !== "_custom" && typeof v === "string" && v.trim())
    .map(([, v]) => v.trim())
    .join(", ");
}

function objectSubject(o) {
  if (!o) return "";
  const gen = o.generated || {};
  const id = joinClean(o.name, o.type, o.rarity, o.condition, typeSpecific(o));
  const desc = clean(gen.description);
  return [id, desc].filter(Boolean).join(". ");
}

function locationSubject(l) {
  if (!l) return "";
  const gen = l.generated || {};
  const id = joinClean(l.name, l.type, l.scale, l.status, typeSpecific(l));
  const desc = clean(gen.description);
  return [id, desc].filter(Boolean).join(". ");
}

function factionSubject(f) {
  if (!f) return "";
  const gen = f.generated || {};
  const id = joinClean(f.name, f.type, f.size, f.status, typeSpecific(f));
  const desc = clean(gen.description);
  return [id, desc].filter(Boolean).join(". ");
}

const SUBJECT_BUILDERS = {
  character: characterSubject,
  object:    objectSubject,
  location:  locationSubject,
  faction:   factionSubject,
};

/**
 * Resolve the effective style preset for an asset by merging world preset and
 * per-asset overrides. Override semantics:
 *   - key absent / value === undefined  → fall through to world preset
 *   - value === ""                      → field is intentionally empty (skipped in prompt)
 *   - value is a non-empty string       → use as override
 */
export function resolveStyle(worldPreset, overrides) {
  const merged = { ...(worldPreset || {}) };
  for (const [k, v] of Object.entries(overrides || {})) {
    if (v === undefined) continue;
    merged[k] = typeof v === "string" ? v.trim() : "";
  }
  return merged;
}

/**
 * Build the final image prompt string for a given asset.
 *
 * @param {object} args
 * @param {"character"|"object"|"location"|"faction"} args.type
 * @param {object} args.asset - The asset record (character/object/etc).
 * @param {object} args.worldPreset - world.imageStyles[type]
 * @returns {string} prompt ready for generateImage
 */
export function buildImagePrompt({ type, asset, worldPreset }) {
  const subjectFn = SUBJECT_BUILDERS[type];
  if (!subjectFn) throw new Error(`buildImagePrompt: unknown type "${type}"`);

  const style = resolveStyle(worldPreset, asset?.imageStyleOverrides);
  const subject = subjectFn(asset);
  if (!subject) return ""; // signals "translation needed" upstream

  // No "Subject:" prefix — the line begins with "Portrait of a …" which is
  // the stronger framing cue for the image model. Style fields follow as
  // labeled lines (Year:, Lighting:, …) matching the user's reference shape.
  const lines = [subject];
  for (const { key } of IMAGE_STYLE_FIELDS) {
    const v = clean(style[key]);
    if (v) lines.push(`${getImageFieldLabel(type, key)}: ${v}`);
  }
  return lines.join("\n");
}
