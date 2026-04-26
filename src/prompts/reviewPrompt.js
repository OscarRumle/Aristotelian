function characterContext(character) {
  return [
    ["Name", character.name],
    ["Role", character.role],
    ["Style", character.style],
    ["Background", character.background],
    ["Personality", character.personality],
    ["Desires", character.desires],
    ["Fears", character.fears],
    ["Hamartia", character.hamartia],
    ["Consistency", character.consistency],
    ["Moral Core", character.moralCore],
    ["Appearance", character.appearance],
    ["Clothing", character.clothing],
    ["Details", character.details],
    ["Under Pressure", character.underPressure],
    ["Subtext", character.subtext],
    ["Voice Pattern", character.voicePattern],
    ["Quote", character.quote],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
    .join("\n\n");
}

const SCRUTINY_INSTRUCTIONS = {
  low: `Focus only on glaring contradictions — things that would confuse or break immersion for any reader. Ignore subtle tensions, minor variations in tone, and anything a reader could plausibly reconcile themselves. Return at most 2 items.`,
  mid: `Identify meaningful contradictions that a careful reader would notice. Ignore stylistic variations and minor tensions that don't affect character coherence. Return at most 4 items.`,
  high: `Be thorough. Flag all contradictions, including subtle tensions between fields — things that don't outright break the character but create friction on close reading. Return up to 6 items.`,
};

export function buildConsistencyScanPrompt(character, world, scrutiny = "mid") {
  return `Analyse this fictional character for internal inconsistencies — places where one field meaningfully contradicts another.

WORLD: ${world.name} — ${world.description}

CHARACTER:
${characterContext(character)}

SCRUTINY LEVEL: ${scrutiny.toUpperCase()}
${SCRUTINY_INSTRUCTIONS[scrutiny]}

For each inconsistency, name the specific field that should be rewritten and provide exactly two resolution options.

Return ONLY a JSON array:
[
  {
    "fieldKey": "background",
    "fieldLabel": "Background",
    "problem": "One sentence naming the specific contradiction. Be concrete.",
    "optionA": {
      "label": "Short fix label (under 8 words)",
      "instruction": "Clear instruction for rewriting the field to resolve this"
    },
    "optionB": {
      "label": "Short alternative label (under 8 words)",
      "instruction": "Clear instruction for the alternative approach"
    },
    "recommended": "A"
  }
]

If there are no inconsistencies at this scrutiny level, return: []
Return ONLY valid JSON. No preamble.`;
}

export function buildReviewFixPrompt(character, world, fieldKey, fieldLabel, instruction) {
  return `Rewrite one field of this character to resolve an inconsistency.

WORLD: ${world.name} — ${world.description}

CHARACTER:
${characterContext(character)}

FIELD TO REWRITE: ${fieldLabel}
CURRENT VALUE: ${character[fieldKey] || "(empty)"}

INSTRUCTION: ${instruction}

Rewrite the field so it resolves the inconsistency while staying true to the character's voice and the world's tone. Return ONLY the new field text. No labels, no preamble.`;
}
