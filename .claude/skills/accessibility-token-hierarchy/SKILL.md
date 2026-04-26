---
name: accessibility-token-hierarchy
description: Use when improving contrast, fixing accessibility issues, or styling any interactive text element (labels, tabs, back buttons, nav). Also use when adding new components that need text color choices.
---

# Accessibility Token Hierarchy

This project uses a four-level color token system for text. Using the wrong token — especially touching `--faint` — will either break the design aesthetic or fail contrast requirements. Know which level to use before reaching for a color.

## When to use this

Any time you are:
- Adding a new label, tab, nav element, button, or back button
- Fixing a contrast/accessibility issue
- Tempted to use `--faint` on anything the user needs to read
- Choosing a text color for a UI element

Do NOT apply this to purely decorative elements (dividers, rules, ambient glows, placeholder dots) — those can stay on `--faint`.

## How to do it

The four levels in `src/styles.css` `:root`:

| Token | Value | Contrast vs --bg | Use for |
|---|---|---|---|
| `--dark` | #2B2018 | ~12:1 | Headings, primary content, active states |
| `--label` | #7A6E68 | ~4.2:1 | Interactive labels, tabs, back buttons, card CTAs, field labels, nav links |
| `--muted` | #8B7D74 | ~3.8:1 | Secondary body text, role lines, descriptions |
| `--faint` | #B0A49C | ~2.1:1 | Decorative only — dividers, placeholders, ambient rules |

**Rule:** Any text the user must read to operate the UI → `--label` minimum. Field labels, tab buttons, back buttons, card CTAs, eyebrows → `--label`. Never `--faint`.

The classes already using `--label` (maintained from the UX review pass):
- `.tab-btn`, `.back-btn`, `.card-cta`, `.cs-field-label`, `.f-label`, `.s-label`, `.t-eyebrow`, `.cs-section-title`, `.icon-btn`

Dark mode equivalent: use `var(--dk-muted)` where light mode uses `--label`.

## Why this works

`--faint` (#B0A49C on #F4EDE4) is only ~2.1:1 contrast — far below WCAG AA (4.5:1 for normal text). The design relies on faintness for decorative hierarchy, which is fine for non-readable elements. Changing `--faint` globally would break ~30 decorative uses. Introducing `--label` as an intermediate token lets readable interactive elements meet contrast requirements without touching the decorative layer.

## Example

**Wrong — new field label:**
```css
.my-new-label { color: var(--faint); } /* fails contrast, user can't read it */
```

**Right:**
```css
.my-new-label { color: var(--label); } /* ~4.2:1, meets WCAG AA */
body.theme-dark .my-new-label { color: var(--dk-muted); }
```

## Pitfalls

- `--muted` (~3.8:1) technically fails WCAG AA for small text (<18px). Only use it for larger body text (≥0.9rem) or decorative secondary text.
- Don't add `--label` to the dark mode `:root` — the dark mode equivalent is `--dk-muted`. The `--label` token only exists in light mode.
- If you see a new component using `color: var(--faint)` for anything interactive, treat it as a bug and switch to `--label`.
