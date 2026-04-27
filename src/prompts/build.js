import {
  CHARACTER_SCHEMA,
  ROLE_INSTRUCTIONS,
  STYLE_INSTRUCTIONS,
  FRAMEWORK_BLOCK,
} from "./schema.js";
import { REFERENCE_SYNTAX_INSTRUCTION } from "./referenceInstruction.js";

export function buildPrompt(world, existingChars, inputs, targetLead) {
  const { role, style, pitch, mentionContext, ...fields } = inputs;

  const existing = existingChars.length
    ? existingChars
        .map(
          (c) =>
            `- ${c.name} (${c.role || "Unknown role"}) — ${c.consistency || c.summary?.[0] || ""}`
        )
        .join("\n")
    : "None yet";

  const userInput =
    Object.entries({ pitch, ...fields })
      .filter(([, v]) => v?.trim?.())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n") || "None — generate freely.";

  const roleBlock = role
    ? typeof ROLE_INSTRUCTIONS[role] === "function"
      ? ROLE_INSTRUCTIONS[role](targetLead)
      : ROLE_INSTRUCTIONS[role]
    : "Choose the most dramatically appropriate role for this character given the world and existing cast.";

  const styleBlock = style ? STYLE_INSTRUCTIONS[style] || "" : "";

  const worldDocsBlock =
    world.mode === "advanced" && world.documents?.length > 0
      ? `\nWORLD DOCUMENTS:\n${world.documents
          .filter((d) => d.title !== "Interview Transcript")
          .map((d) => `--- ${d.title} ---\n${d.content}`)
          .join("\n\n")}\n`
      : "";

  return `You are a character creation assistant trained on Aristotle's Poetics, Rhetoric, and the full dramatic framework.

WORLD: ${world.name}
${world.description}
${worldDocsBlock}
EXISTING CHARACTERS:
${existing}

${roleBlock}
${styleBlock ? styleBlock + "\n" : ""}
${FRAMEWORK_BLOCK}

USER INPUT:
${userInput}

FIELD INSTRUCTIONS:
- "role": If not specified by user, choose the most dramatically interesting role given the world and cast.
- "style": If not specified, choose Tragic/Comic/Mixed based on what serves this character's story best.
- "summary": Array of exactly 3 strings. One punchy sentence each — the most dramatically interesting things. Not backstory. The stuff that makes someone lean in.
- "quote": One line of dialogue or internal thought that perfectly captures their voice.
- "aristotelianNote": 3-5 sentences on how this character satisfies Aristotle's four requirements.
- "collectiveHamartia": For Ensemble only — the shared assumption or worldview the ensemble collectively carries into their downfall. Empty string otherwise.

${mentionContext ? mentionContext + "\n\n" : ""}${REFERENCE_SYNTAX_INSTRUCTION}
Return ONLY valid JSON. No preamble. No markdown fences.
${CHARACTER_SCHEMA}`;
}
