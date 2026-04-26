import { REFERENCE_SYNTAX_INSTRUCTION } from "./referenceInstruction.js";

const SCRUTINY = {
  low: "Flag only glaring contradictions — things that would confuse any reader. Maximum 2 items.",
  mid: "Flag contradictions a careful reader would notice. Maximum 4 items.",
  high: "Flag even subtle tensions and close-reading friction. Maximum 6 items.",
};

export function buildDocSectionRegenPrompt(world, doc, heading, currentBody, allSections, feedback = null) {
  const otherSections = allSections
    .filter((s) => (s.heading || null) !== (heading || null))
    .map((s) => `## ${s.heading || "Content"}\n${s.body}`)
    .join("\n\n");

  return `Regenerate one section of a world lore document.

WORLD: ${world.name} — ${world.description}

DOCUMENT: "${doc.title}"
${doc.summary ? `Summary: ${doc.summary}` : ""}

${otherSections ? `OTHER SECTIONS (for consistency):\n${otherSections}\n` : ""}
SECTION TO REGENERATE: "${heading || "Content"}"
CURRENT CONTENT:
${currentBody}

TASK: Rewrite only this section. Stay consistent with the other sections and the world's tone.${feedback ? `\nFEEDBACK: ${feedback}` : ""}

${REFERENCE_SYNTAX_INSTRUCTION}
Return ONLY the new section body text. No heading, no labels, no JSON. Plain prose.`;
}

export function buildDocScanPrompt(doc, sections, world, scrutiny) {
  const content = sections
    .map((s) => `## ${s.heading || "Content"}\n${s.body}`)
    .join("\n\n");

  return `You are reviewing a lore document for internal inconsistencies and contradictions.

WORLD: ${world.name} — ${world.description}

DOCUMENT: "${doc.title}"
${doc.summary ? `Summary: ${doc.summary}` : ""}

CONTENT:
${content}

SCRUTINY LEVEL: ${scrutiny.toUpperCase()} — ${SCRUTINY[scrutiny]}

Find inconsistencies within the document — where one section contradicts or undermines another, or where a claim is internally contradicted.

Return a JSON array. Each item:
{
  "fieldKey": "section heading exactly as written (or '__body__' for unsectioned content)",
  "fieldLabel": "Human-readable section name",
  "problem": "What is inconsistent and why it matters",
  "optionA": { "label": "Short label", "instruction": "What to change" },
  "optionB": { "label": "Short label", "instruction": "Alternative approach" },
  "recommended": "A or B"
}

If no inconsistencies found, return [].
Return ONLY the JSON array.`;
}

export function buildDocSectionFixPrompt(doc, sections, sectionHeading, instruction) {
  const otherSections = sections
    .filter((s) => (s.heading || null) !== (sectionHeading || null))
    .map((s) => `## ${s.heading || "Content"}\n${s.body}`)
    .join("\n\n");

  const current = sections.find(
    (s) => (s.heading || "__body__") === (sectionHeading || "__body__")
  );

  return `Rewrite one section of a world lore document based on an instruction.

DOCUMENT: "${doc.title}"
${doc.summary ? `Summary: ${doc.summary}` : ""}

${otherSections ? `OTHER SECTIONS:\n${otherSections}\n` : ""}
SECTION: "${sectionHeading || "Content"}"
CURRENT CONTENT:
${current?.body || ""}

INSTRUCTION: ${instruction}

${REFERENCE_SYNTAX_INSTRUCTION}
Rewrite only this section. Return ONLY the new section body. No heading, no labels. Plain prose.`;
}
