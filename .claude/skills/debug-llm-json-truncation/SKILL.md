---
name: debug-llm-json-truncation
description: Use when an LLM call in this app produces "No JSON in response", returns null from extractJson, or fails silently at the end of a multi-step flow (e.g. after answering all interview questions, during document generation). Also applies when a call that worked before suddenly starts failing after the prompt grew larger.
---

# Debug LLM JSON Truncation

`extractJson` returns null not because the model produced bad JSON, but because the response was cut off mid-object by hitting `maxTokens`. The failure is silent — no API error, just missing content.

## When to use this

Trigger: `extractJson` returns null → error thrown → user sees the error state or the wizard reverts.

Also trigger: a call works for short inputs (5 questions) but fails for long ones (20 questions, complex documents).

Do NOT use for: actual API errors (non-200 status), network failures, malformed JSON that the model genuinely produced wrong.

## How to do it

1. Open `preview_network` and find the failing POST to `/api/anthropic/v1/messages`.
2. Inspect the response body using the `requestId`: `preview_network(requestId: "...")`.
3. Check `stop_reason` in the response:
   - `"end_turn"` → model finished naturally, JSON is complete, problem is elsewhere
   - `"max_tokens"` → response was cut off; this is the bug
4. Estimate output size: response text char count ÷ 4 ≈ output tokens. If close to or exceeding the `maxTokens` value in the call, it's truncation.
5. Fix: set `maxTokens: 8192` in the failing `callClaude(...)` call. That's the ceiling for `claude-sonnet-4-6`.

## Why this works

`callClaude` passes `maxTokens` to the API. When the model hits the limit mid-JSON, it stops and returns whatever was generated so far. `extractJson` scans for a balanced `{...}` object — a truncated object never closes, so it returns null. No error is thrown by the API; the response is HTTP 200. The failure is invisible without inspecting the response body.

The naive fix (retry logic, prompt changes) doesn't help because the content is genuinely too long for the token budget.

## Example

20-question interview response: ~5000 output tokens. With `maxTokens: 4000`, the JSON is truncated. `extractJson` returns null → `"No JSON in response"` error → wizard reverts to length-selection step.

Fix:
```js
// Before
{ maxTokens: 4000 }

// After
{ maxTokens: 8192 }
```

## Pitfalls

- `preview_network` truncates its display output (shows "(truncated, N total chars)") — this is the tool display, not the actual response. The API response itself may be complete even if the tool cuts off the preview.
- The char-count estimate (÷4) is rough. Actual token count can vary. Always check `stop_reason`, not just the length estimate.
- Calls that generate large structured outputs (20 questions with subtexts, multiple lore documents) reliably exceed 4000 tokens. Default `callClaude` to `maxTokens: 8192` for any call that returns a JSON array or multiple objects.
- `callClaudeStreaming` (character generation) uses a different code path — truncation there would manifest as incomplete JSON in the streaming buffer, not a null from `extractJson`. Same fix applies.
