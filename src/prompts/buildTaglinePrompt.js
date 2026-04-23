export function buildTaglinePrompt(name, description) {
  return `Write a 1–2 sentence tagline for this fictional world. Capture the tone, setting, and atmosphere. Be specific — use the actual details given, not generic phrases.

WORLD: ${name}
DESCRIPTION: ${description}

Return ONLY the tagline text. No preamble, no quotes, no punctuation beyond what the tagline itself needs.`;
}
