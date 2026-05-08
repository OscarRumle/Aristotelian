import { getSettingsSync } from "../storage.js";
import { DEFAULT_ANTHROPIC_MODEL } from "../constants.js";

const ENDPOINT = "/api/anthropic/v1/messages";

function currentModel() {
  const s = getSettingsSync();
  return s.anthropicModel || DEFAULT_ANTHROPIC_MODEL;
}

function userHeaders() {
  const s = getSettingsSync();
  const h = { "Content-Type": "application/json" };
  if (s.anthropicKey) h["x-user-anthropic-key"] = s.anthropicKey;
  if (s.anthropicVersion) h["x-user-anthropic-version"] = s.anthropicVersion;
  return h;
}

// ── Token usage accumulator ───────────────────────────────────────────────────

const _usage = { input: 0, output: 0 };

function _trackUsage(input = 0, output = 0) {
  _usage.input += input;
  _usage.output += output;
  window.dispatchEvent(new CustomEvent("tokenusage", { detail: { ..._usage } }));
}

export function resetTokenUsage() {
  _usage.input = 0;
  _usage.output = 0;
  window.dispatchEvent(new CustomEvent("tokenusage", { detail: { ..._usage } }));
}

export function getTokenUsage() {
  return { ..._usage };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function errorFromResponse(res) {
  try {
    const data = await res.json();
    if (data?.error?.message) return `${data.error.type || "API error"}: ${data.error.message}`;
  } catch {
    // body not JSON; fall through
  }
  return `API ${res.status}${res.statusText ? ` — ${res.statusText}` : ""}`;
}

// ── Non-streaming ─────────────────────────────────────────────────────────────

export async function callClaude(system, userMsg, { maxTokens = 2000, signal } = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: userHeaders(),
    body: JSON.stringify({
      model: currentModel(),
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
    signal,
  });
  if (!res.ok) throw new Error(await errorFromResponse(res));

  const data = await res.json();
  _trackUsage(data.usage?.input_tokens, data.usage?.output_tokens);

  const text = data.content?.find((b) => b.type === "text")?.text || "";
  if (!text) throw new Error("Empty response");
  return text;
}

// ── Streaming ─────────────────────────────────────────────────────────────────

export async function callClaudeStreaming(
  system,
  userMsg,
  { maxTokens = 2000, signal, onChunk } = {}
) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: userHeaders(),
    body: JSON.stringify({
      model: currentModel(),
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
    signal,
  });
  if (!res.ok) throw new Error(await errorFromResponse(res));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  let streamInputTokens = 0;
  let streamOutputTokens = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);

        // Extract usage from SSE events without interfering with text handling
        const usageParsed = parseSseUsage(line);
        if (usageParsed.inputTokens) streamInputTokens = usageParsed.inputTokens;
        if (usageParsed.outputTokens) streamOutputTokens = usageParsed.outputTokens;

        const text = handleSseLine(line);
        if (text) {
          accumulated += text;
          onChunk?.(accumulated);
        }
      }
    }
    const tail = buffer.trim();
    if (tail) {
      const usageParsed = parseSseUsage(tail);
      if (usageParsed.inputTokens) streamInputTokens = usageParsed.inputTokens;
      if (usageParsed.outputTokens) streamOutputTokens = usageParsed.outputTokens;
      const text = handleSseLine(tail);
      if (text) {
        accumulated += text;
        onChunk?.(accumulated);
      }
    }
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
    _trackUsage(streamInputTokens, streamOutputTokens);
  }

  if (!accumulated) throw new Error("Empty response");
  return accumulated;
}

function parseSseUsage(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return {};
  const raw = trimmed.slice(5).trim();
  if (!raw || raw === "[DONE]") return {};
  try {
    const evt = JSON.parse(raw);
    if (evt.type === "message_start" && evt.message?.usage) {
      return { inputTokens: evt.message.usage.input_tokens || 0 };
    }
    if (evt.type === "message_delta" && evt.usage) {
      return { outputTokens: evt.usage.output_tokens || 0 };
    }
  } catch { /* ignore */ }
  return {};
}

function handleSseLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return "";
  const raw = trimmed.slice(5).trim();
  if (!raw || raw === "[DONE]") return "";
  try {
    const evt = JSON.parse(raw);
    if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
      return evt.delta.text || "";
    }
    if (evt.type === "error" && evt.error?.message) {
      throw new Error(`Stream error: ${evt.error.message}`);
    }
    return "";
  } catch (err) {
    if (err?.message?.startsWith("Stream error:")) throw err;
    console.warn("[claude] skipped malformed SSE payload:", raw.slice(0, 120), err);
    return "";
  }
}
