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

export function buildConsistencyScanPrompt(character, world) {
  return `Analyse this fictional character for internal inconsistencies — places where one field meaningfully contradicts another.

WORLD: ${world.name} — ${world.description}

CHARACTER:
${characterContext(character)}

Identify up to 4 of the most significant contradictions. For each, name the specific field that should be rewritten and provide exactly two resolution options.

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

If there are no meaningful inconsistencies, return: []
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
