import { callClaude } from "./claude.js";
import { buildVisualTranslationPrompt } from "../prompts/buildVisualTranslationPrompt.js";

/**
 * Translate a character profile into an image-model-friendly visual subject.
 * Cached on character.imagePromptDraft by the caller.
 *
 * @param {object} world
 * @param {object} character
 * @param {object} [opts]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<string>} the visual prompt text (without "Portrait of a " prefix)
 */
export async function translateCharacterPrompt(world, character, opts = {}) {
  const { system, user } = buildVisualTranslationPrompt(world, character);
  const text = await callClaude(system, user, { maxTokens: 400, signal: opts.signal });
  const trimmed = (text || "").trim().replace(/^["']|["']$/g, "");
  if (!trimmed) throw new Error("Translator returned empty response");
  return trimmed;
}
