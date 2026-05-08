import { STORAGE_KEY, STORAGE_VERSION, IMAGE_STYLE_DEFAULTS, DEFAULT_SETTINGS } from "./constants.js";

/**
 * Storage schema versioning.
 * Stored blob shape: { __version: number, worlds: World[], settings: Settings }
 * Older versions (pre-versioning) stored a bare World[] array — handled as v2.
 */

function migrate(parsed) {
  // Legacy: bare array saved before versioning was introduced.
  if (Array.isArray(parsed)) {
    return { __version: STORAGE_VERSION, worlds: parsed, settings: { ...DEFAULT_SETTINGS } };
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Stored data is not an object");
  }

  let version = parsed.__version ?? 2;
  let worlds = Array.isArray(parsed.worlds) ? parsed.worlds : [];
  let settings = parsed.settings && typeof parsed.settings === "object" ? parsed.settings : null;

  // v2 → v3: no data shape change, just introducing the envelope.
  if (version < 3) version = 3;

  // v3 → v4: add advanced world fields to all worlds.
  if (version < 4) {
    worlds = worlds.map((w) => ({
      mode: "simple",
      extendedInputs: null,
      documents: [],
      interviews: [],
      uploadedFiles: [],
      ...w,
    }));
    version = 4;
  }

  // v4 → v5: add scenes array to worlds, color field to characters.
  if (version < 5) {
    worlds = worlds.map((w) => ({
      ...w,
      scenes: w.scenes ?? [],
      characters: (w.characters ?? []).map((c) => ({ color: null, ...c })),
    }));
    version = 5;
  }

  // v5 → v6: add tagline field to worlds.
  if (version < 6) {
    worlds = worlds.map((w) => ({ tagline: "", ...w }));
    version = 6;
  }

  // v6 → v7: add objects array to each world.
  if (version < 7) {
    worlds = worlds.map((w) => ({ ...w, objects: w.objects ?? [] }));
    version = 7;
  }

  // v7 → v8: add factions and locations arrays to each world.
  if (version < 8) {
    worlds = worlds.map((w) => ({ ...w, factions: w.factions ?? [], locations: w.locations ?? [] }));
    version = 8;
  }

  // v8 → v9: backfill empty `associations: []` on lore documents, scenes,
  // and dialogues so future cross-references can attach without per-entity
  // null checks. No mutation of existing association entries on
  // characters / objects / factions / locations — the optional `relation`
  // field is added on demand.
  if (version < 9) {
    worlds = worlds.map((w) => ({
      ...w,
      documents: (w.documents ?? []).map((d) => ({ associations: [], ...d })),
      scenes: (w.scenes ?? []).map((s) => ({
        ...s,
        associations: s.associations ?? [],
        dialogues: (s.dialogues ?? []).map((d) => ({ associations: [], ...d })),
      })),
    }));
    version = 9;
  }

  // v9 → v10: add image generation fields. Each asset (character, object,
  // location, faction) gets `image: null`. Each world gets `imageStyles`
  // (per-asset-type style preset map) and `autoGenerateImages: false`.
  // Per-asset prompt overrides also live as `imageStyleOverrides: {}` on each
  // asset — empty object means "use the world preset as-is".
  if (version < 10) {
    worlds = worlds.map((w) => ({
      ...w,
      imageStyles: w.imageStyles ?? {
        character: { ...IMAGE_STYLE_DEFAULTS.character },
        object:    { ...IMAGE_STYLE_DEFAULTS.object },
        location:  { ...IMAGE_STYLE_DEFAULTS.location },
        faction:   { ...IMAGE_STYLE_DEFAULTS.faction },
      },
      autoGenerateImages: w.autoGenerateImages ?? false,
      characters: (w.characters ?? []).map((c) => ({ image: null, imageStyleOverrides: {}, ...c })),
      objects:    (w.objects ?? []).map((o)    => ({ image: null, imageStyleOverrides: {}, ...o })),
      locations:  (w.locations ?? []).map((l)  => ({ image: null, imageStyleOverrides: {}, ...l })),
      factions:   (w.factions ?? []).map((f)   => ({ image: null, imageStyleOverrides: {}, ...f })),
    }));
    version = 10;
  }

  // v10 → v11: characters get `imagePromptDraft: null`. This is the cached
  // image-model-friendly visual subject, populated lazily by the translator
  // (src/api/translateCharacterPrompt.js) on first generate. User-editable.
  if (version < 11) {
    worlds = worlds.map((w) => ({
      ...w,
      characters: (w.characters ?? []).map((c) => ({ imagePromptDraft: null, ...c })),
    }));
    version = 11;
  }

  // v11 → v12: introduce the `settings` envelope. Empty-string keys mean
  // "use the .env fallback on the proxy side" — never seed real keys here.
  if (version < 12) {
    settings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
    version = 12;
  }

  if (!settings) settings = { ...DEFAULT_SETTINGS };
  return { __version: version, worlds, settings };
}

// ── Worlds ─────────────────────────────────────────────────────────────────

export function loadWorlds() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { worlds: [], corrupted: false };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn("[storage] failed to parse; treating as corrupted", err);
    return { worlds: [], corrupted: true };
  }

  try {
    const migrated = migrate(parsed);
    return { worlds: migrated.worlds, corrupted: false };
  } catch (err) {
    console.warn("[storage] migration failed", err);
    return { worlds: [], corrupted: true };
  }
}

export function saveWorlds(worlds) {
  const settings = loadSettings();
  const blob = { __version: STORAGE_VERSION, worlds, settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
    return true;
  } catch (err) {
    console.error("[storage] save failed", err);
    return false;
  }
}

export function resetStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("[storage] reset failed", err);
  }
}

// ── Settings ───────────────────────────────────────────────────────────────

function readEnvelope() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadSettings() {
  const parsed = readEnvelope();
  if (!parsed) return { ...DEFAULT_SETTINGS };
  try {
    return migrate(parsed).settings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(partial) {
  const parsed = readEnvelope();
  let worlds = [];
  let prevSettings = { ...DEFAULT_SETTINGS };
  if (parsed) {
    try {
      const migrated = migrate(parsed);
      worlds = migrated.worlds;
      prevSettings = migrated.settings;
    } catch {
      // fall through with defaults
    }
  }
  const next = { ...prevSettings, ...partial };
  const blob = { __version: STORAGE_VERSION, worlds, settings: next };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
    window.dispatchEvent(new CustomEvent("settingschange", { detail: next }));
    return next;
  } catch (err) {
    console.error("[storage] saveSettings failed", err);
    return prevSettings;
  }
}

// Synchronous read for non-React consumers (api/claude.js, api/higgsfield.js).
// Reads on every call; localStorage is fast enough and the storage blob is small.
export function getSettingsSync() {
  return loadSettings();
}

// ── Full-store export / import / wipe ──────────────────────────────────────

export function exportAll() {
  const parsed = readEnvelope();
  const blob = parsed || { __version: STORAGE_VERSION, worlds: [], settings: { ...DEFAULT_SETTINGS } };
  return JSON.stringify(blob, null, 2);
}

export function importAll(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error("Import file is not valid JSON");
  }
  // Run through migrate to validate and bring forward.
  const migrated = migrate(parsed);
  const blob = { __version: STORAGE_VERSION, worlds: migrated.worlds, settings: migrated.settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
  return { worldCount: migrated.worlds.length };
}
