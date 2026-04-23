export const uid = () => Math.random().toString(36).slice(2, 9);

export const metaLine = (c) =>
  [c.race, c.gender, c.age].filter(Boolean).join(" · ") || null;

export const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const isFullRole = (r) =>
  !r || r === "Lead" || r === "Deuteragonist" || r === "Ensemble";
export const isMini = (r) => r === "Minor";
export const isSupport = (r) => r === "Supporting";

/**
 * Extract the first balanced JSON object from a string.
 * More robust than stripping markdown fences: tolerates prose before/after,
 * escaped quotes, and nested objects/arrays.
 */
export function extractJson(text) {
  if (!text) return null;
  const src = text.trim();

  let start = -1;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "{") {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}
