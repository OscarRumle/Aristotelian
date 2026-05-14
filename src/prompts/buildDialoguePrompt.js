import { ROLE_OPTIONS } from "../constants.js";
import { REFERENCE_SYNTAX_INSTRUCTION, buildEntityIdListing } from "./referenceInstruction.js";
import { getLensFraming } from "./lensFraming.js";

function formatExistingLines(lines) {
  return lines
    .map((l) =>
      l.type === "stage" ? l.text : `${l.speaker}: "${l.text}"`
    )
    .join("\n");
}

/**
 * Build the system prompt for dialogue generation.
 * Returns the full system string for callClaudeStreaming.
 *
 * @param {object} world
 * @param {object[]} participants - full character objects who speak
 * @param {object[]} mentions - characters who may be referenced but don't speak
 * @param {object} opts - { pitch, mood, lens, existingLines, direction, directionTarget }
 */
export function buildDialoguePrompt(world, participants, mentions, opts) {
  const {
    pitch = "",
    mood = "",
    lens,
    existingLines = [],
    direction = "",
    directionTarget = "@everyone",
    mentionContext = "",
  } = opts;

  const participantBlock = participants
    .map((c) => {
      const lines = [
        `- ${c.name} (${c.role || "character"}, ${c.style || "Tragic"})`,
      ];
      if (c.hamartia) lines.push(`  Hamartia: ${c.hamartia}`);
      if (c.speechMode) lines.push(`  Speech mode: ${c.speechMode}`);
      if (c.voicePattern) lines.push(`  Voice pattern: ${c.voicePattern}`);
      if (c.underPressure) lines.push(`  Under pressure: ${c.underPressure}`);
      if (c.subtext) lines.push(`  Subtext: ${c.subtext}`);
      return lines.join("\n");
    })
    .join("\n\n");

  const mentionBlock =
    mentions.length > 0
      ? mentions
          .map((c) => {
            const summary = Array.isArray(c.summary) ? c.summary[0] : c.summary;
            return `- ${c.name}: ${summary || c.consistency || ""}`;
          })
          .join("\n")
      : null;

  const existingBlock =
    existingLines.length > 0
      ? `EXISTING DIALOGUE (continue from the last line — do not repeat any existing lines):\n${formatExistingLines(existingLines)}`
      : null;

  const directionBlock =
    direction.trim()
      ? `DIRECTION (apply to ${directionTarget}):\n${direction.trim()}`
      : null;

  // Lens-driven framing replaces the old hamartiaOn toggle.
  // lens === undefined here means a caller hasn't been migrated yet — default
  // to "hamartia" to preserve current behaviour. lens === null is the explicit
  // opt-out and produces no framing block.
  const lensFraming = getLensFraming(lens === undefined ? "hamartia" : lens);

  const actionVerb = existingLines.length > 0 ? "Continue" : "Generate";

  const sections = [
    `World: ${world.name} — ${world.description}`,
    `PARTICIPANTS (speakers):\n${participantBlock}`,
    mentionBlock
      ? `BACKGROUND CAST (may be referenced naturally; they do not speak):\n${mentionBlock}`
      : null,
    pitch ? `SCENE PITCH:\n${pitch}` : null,
    mood ? `MOOD: ${mood}` : null,
    lensFraming,
    existingBlock,
    directionBlock,
  ]
    .filter(Boolean)
    .join("\n\n");

  return `You are a dramatic dialogue writer working within the Aristotelian framework.

${sections}
${mentionContext ? `\n${mentionContext}` : ""}
${buildEntityIdListing(world)}
${REFERENCE_SYNTAX_INSTRUCTION}
OUTPUT RULES — follow exactly:
- Output ONLY newline-delimited JSON objects. One object per line. No array wrapper. No preamble. No explanation.
- Each line must be exactly one of:
  {"type":"line","speaker":"Character Name","text":"What they say."}
  {"type":"stage","text":"*Physical stage direction in italics. Spare and specific.*"}
- Speakers alternate naturally — not rigidly line-by-line.
- Stage directions are physical actions only, not emotional commentary.
- ${actionVerb} 6–10 dialogue exchanges. Each exchange is one speaker's line.
- Do not write anything outside the JSON objects.

${actionVerb} the dialogue now.`;
}
