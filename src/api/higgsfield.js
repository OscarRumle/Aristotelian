// Higgsfield image generation client.
// Routes through the dev-server proxy at /api/higgsfield, which injects the
// `Authorization: Key KEY_ID:KEY_SECRET` header from .env.local.
// Higgsfield refuses direct browser calls (BrowserNotSupportedError on the
// official SDK), so the proxy is mandatory — never call platform.higgsfield.ai
// directly from the app.

const ENDPOINT_BASE = "/api/higgsfield";
const DEFAULT_MODEL_ENDPOINT = "flux-pro/kontext/max/text-to-image";
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_MS = 120_000;

const TERMINAL_STATUSES = new Set(["completed", "failed", "nsfw"]);

async function errorFromResponse(res) {
  try {
    const data = await res.json();
    if (data?.error?.message) return `Higgsfield ${res.status}: ${data.error.message}`;
    if (data?.detail) return `Higgsfield ${res.status}: ${typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)}`;
  } catch {
    // body not JSON
  }
  return `Higgsfield ${res.status}${res.statusText ? ` — ${res.statusText}` : ""}`;
}

async function submitGeneration(input, { modelEndpoint = DEFAULT_MODEL_ENDPOINT, signal } = {}) {
  const res = await fetch(`${ENDPOINT_BASE}/${modelEndpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!res.ok) throw new Error(await errorFromResponse(res));
  return res.json();
}

async function fetchStatus(requestId, { signal } = {}) {
  const res = await fetch(`${ENDPOINT_BASE}/requests/${requestId}/status`, {
    method: "GET",
    signal,
  });
  if (!res.ok) throw new Error(await errorFromResponse(res));
  return res.json();
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    }
  });
}

async function pollUntilDone(requestId, { signal, onStatus } = {}) {
  const start = Date.now();
  while (true) {
    if (Date.now() - start > POLL_MAX_MS) {
      throw new Error("Higgsfield: generation timed out");
    }
    const result = await fetchStatus(requestId, { signal });
    onStatus?.(result.status);
    if (TERMINAL_STATUSES.has(result.status)) return result;
    await delay(POLL_INTERVAL_MS, signal);
  }
}

function extractImageUrl(result) {
  const arr = Array.isArray(result?.images) ? result.images : [];
  for (const img of arr) {
    if (img && typeof img === "object" && typeof img.url === "string" && img.url) return img.url;
    if (typeof img === "string" && img) return img;
  }
  // Some endpoints return result_url / output_url / first content url.
  if (typeof result?.result_url === "string") return result.result_url;
  if (typeof result?.output_url === "string") return result.output_url;
  return null;
}

/**
 * Generate an image. Submits a job, polls until terminal, returns the URL.
 *
 * @param {string} prompt - Composed visual prompt string.
 * @param {object} opts
 * @param {string} [opts.aspectRatio="3:4"]
 * @param {object} [opts.extraInput] - Additional model-specific input fields, merged into the body.
 * @param {string} [opts.modelEndpoint] - Override the model endpoint path.
 * @param {AbortSignal} [opts.signal]
 * @param {(status: string) => void} [opts.onStatus] - Called on every poll cycle.
 * @returns {Promise<{ url: string, model: string, requestId: string, prompt: string }>}
 */
export async function generateImage(prompt, opts = {}) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("generateImage: prompt is required");
  }
  const {
    aspectRatio = "3:4",
    extraInput = {},
    modelEndpoint = DEFAULT_MODEL_ENDPOINT,
    signal,
    onStatus,
  } = opts;

  const body = { prompt, aspect_ratio: aspectRatio, ...extraInput };
  const submitted = await submitGeneration(body, { modelEndpoint, signal });
  const requestId = submitted?.request_id || submitted?.id;
  if (!requestId) {
    throw new Error("Higgsfield: submit response missing request_id");
  }
  onStatus?.(submitted?.status || "queued");

  // If the submit response already contains a terminal status (rare), short-circuit.
  if (TERMINAL_STATUSES.has(submitted?.status)) {
    const url = extractImageUrl(submitted);
    if (submitted.status === "nsfw") throw new Error("Higgsfield: image rejected by content moderation (nsfw)");
    if (submitted.status === "failed") throw new Error("Higgsfield: generation failed");
    if (!url) throw new Error("Higgsfield: completed but no image URL returned");
    return { url, model: modelEndpoint, requestId, prompt };
  }

  const result = await pollUntilDone(requestId, { signal, onStatus });
  if (result.status === "nsfw") throw new Error("Higgsfield: image rejected by content moderation (nsfw)");
  if (result.status === "failed") throw new Error("Higgsfield: generation failed");
  const url = extractImageUrl(result);
  if (!url) throw new Error("Higgsfield: completed but no image URL returned");

  return { url, model: modelEndpoint, requestId, prompt };
}
