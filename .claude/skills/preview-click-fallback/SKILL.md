---
name: preview-click-fallback
description: Use when preview_click fails on a button in this app — especially buttons inside the BottomBar (fixed-positioned, z-index 100). Fall back to preview_eval with a JavaScript click instead of spending more attempts on CSS selectors.
---

# Preview Click Fallback via eval

When `preview_click` fails for a button, don't keep trying different CSS selectors. Switch immediately to `preview_eval` with a direct JavaScript `.click()` call.

## When to use this

- `preview_click` returns a "Failed to click element" error.
- The target is inside `.bottom-bar` / `.bottom-bar-inner` (fixed-positioned overlay — the most common failure point in this app).
- Any button that may be visually overlapping or under a z-indexed layer.

Do NOT use this as a first attempt — try `preview_click` first. `preview_eval` for clicking is a fallback, not the default.

## How to do it

**Step 1:** Use `preview_snapshot` to confirm the button's exact text and its position in the DOM.

**Step 2:** Target by text match or index:

```js
// By index within a container
document.querySelectorAll('.bottom-bar-inner button')[1].click()

// By text content (more robust)
[...document.querySelectorAll('button')]
  .find(b => b.textContent.trim() === 'Delete world')
  ?.click()
```

**Step 3:** Call `preview_screenshot` immediately after to confirm the click had its intended effect.

## Why this works

`preview_click` uses a simulated pointer event that can be blocked by overlapping fixed-position elements (the BottomBar sits above the scroll content at `z-index: 100`). JavaScript's `.click()` fires the event handler directly, bypassing pointer-hit-testing entirely.

## Example

```
// Fails:
preview_click selector=".bottom-bar-inner button:last-child"
→ "Failed to click element"

// Works:
preview_eval expression="document.querySelectorAll('.bottom-bar-inner button')[1].click()"
→ undefined  (React state updates, UI changes)
```

## Pitfalls

- `preview_eval` returns `undefined` for `.click()` calls — that's normal. Always follow with a screenshot to verify the click registered.
- Don't use index (`[1]`) if button order can vary by state (e.g. confirm/cancel vs. normal state). Use text-match instead.
- The BottomBar is the main trouble zone, but any fixed/sticky overlay can cause the same issue.
