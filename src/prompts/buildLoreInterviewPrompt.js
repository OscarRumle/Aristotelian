import { REFERENCE_SYNTAX_INSTRUCTION } from "./referenceInstruction.js";

export function buildLoreInterviewPrompt(world, doc) {
  return `You are preparing a focused 3-question interview to deepen a specific lore document.

WORLD: ${world.name}
WORLD PITCH: ${world.description}

DOCUMENT TITLE: ${doc.title}
DOCUMENT CONTENT:
${doc.content}

Generate exactly 3 interview questions that probe gaps, tensions, or underdeveloped areas in this specific document. Each question should have 3 options.

Focus on what is NOT yet answered in the document — what would most enrich or clarify its content if answered.

${REFERENCE_SYNTAX_INSTRUCTION}
Return ONLY valid JSON. No preamble. No markdown fences.
{"questions":[{"question":"","options":[{"key":"A","text":"","subtext":"","recommended":false},{"key":"B","text":"","subtext":"","recommended":false},{"key":"C","text":"","subtext":"","recommended":true}]}]}`;
}
