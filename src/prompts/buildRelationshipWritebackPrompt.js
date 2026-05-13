// Build the system prompt for relationship write-back: weave a confirmed
// connection into the existing prose fields on each character's sheet, so it
// reads as part of the character — not as an appended "relationships" note.

import { REFERENCE_SYNTAX_INSTRUCTION, buildEntityIdListing } from "./referenceInstruction.js";

// Fields where a relationship can be woven in. Excludes appearance (visual,
// not relational), hamartia / consistency (core identity invariants), and
// desires / fears (abstract — best left to the character interview).
const ELIGIBLE_FIELDS = [
  { key: "background",       label: "Background" },
  { key: "personality",      label: "Personality" },
  { key: "moralCore",        label: "Moral Core" },
  { key: "subtext",          label: "Subtext" },
  { key: "voicePattern",     label: "Voice Pattern" },
  { key: "aristotelianNote", label: "Aristotelian Note" },
];

export const RELATIONSHIP_WRITEBACK_FIELDS = ELIGIBLE_FIELDS.map((f) => f.key);

function characterFields(c) {
  const lines = [`NAME: ${c.name || "Unnamed"} (id: ${c.id})  ROLE: ${c.role || "—"}`];
  for (const f of ELIGIBLE_FIELDS) {
    const v = c[f.key];
    lines.push(`--- ${f.key} (${f.label}) ---`);
    lines.push(v && v.trim() ? v.trim() : "(empty)");
  }
  return lines.join("\n");
}

export function buildRelationshipWritebackPrompt(world, charA, charB, connection) {
  const allowed = ELIGIBLE_FIELDS.map((f) => f.key).join(", ");

  return `You are a careful editor enriching two character sheets after a dramatic connection between them has been established.

WORLD: ${world.name}
${(world.description || "").slice(0, 600)}

THE CONNECTION
Type: ${connection.type}
Direction: ${connection.direction}
Title: ${connection.title}
Description: ${connection.description}
${connection.note ? `Aristotelian note: ${connection.note}` : ""}

CHARACTER A
${characterFields(charA)}

CHARACTER B
${characterFields(charB)}

${buildEntityIdListing(world)}
${REFERENCE_SYNTAX_INSTRUCTION}

TASK
- For EACH character, pick 1–2 fields where this connection naturally belongs and re-write those fields, weaving the connection in as part of the existing prose. Not as an appended note. Not as a "Relationships:" header.
- Allowed fields: ${allowed}. Never invent or rename fields.
- Preserve the existing voice, tone, and structural shape of each field. Don't lose what's already there — extend it.
- If a field is empty you may still use it, but never invent biography that contradicts the rest of the sheet.
- When you mention the other character in the new prose, use the reference syntax above with their id.
- Keep edits tight. One or two added sentences woven naturally is the bar. Don't rewrite the whole field if you don't need to.

OUTPUT
Return ONLY valid JSON. No preamble. No markdown fences. No commentary.

{"a":{"<fieldKey>":"<full replacement text>"},"b":{"<fieldKey>":"<full replacement text>"}}

Where each fieldKey is one of: ${allowed}. The value is the FULL replacement text for that field — not a delta, not a snippet. Omit fields you do not edit. Keys missing from the JSON are left unchanged.`;
}
