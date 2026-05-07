# Design & UX Pass — Desktop-First Overhaul

**Session context:** April 2026. First desktop-first redesign pass, starting from the CharacterSheet.
The app was built mobile-first (max-width: 520px single column). All screens need to be revisited for desktop usability, typographic consistency, and component hygiene.

**Reference files:**
- Style guide: `Aristotelian Style Guide.html` (root of project)
- Design system: `docs/Design Doc.md` § 4
- CSS: `src/styles.css`
- Breakpoint used: `@media(min-width:1024px)` — activate desktop layouts here

---

## What was done (CharacterSheet — April 2026)

`src/components/CharacterSheet.jsx` + `src/styles.css`

- Added two-column CSS grid layout at ≥1024px: **400px sticky sidebar** (character name, role, meta, tags, summary, quote) + **1fr scrollable main panel** (tabs + fields)
- Sidebar uses `position: sticky; top: var(--nav-h)` with a `border-right` separator
- `.cs-page` overrides `.screen` max-width to `1440px` at desktop
- `.cs-fields-grid` introduces a `grid-template-columns: 1fr 1fr` two-column field layout inside the right panel — used in Overview, Identity, Psychology, and Dialogue tabs
- Desktop typography scale: `char-name` 2.1rem → 3.4rem, field bodies .87rem → .98rem, labels .63rem → .7rem
- Mobile (< 1024px) unchanged — sidebar renders as stacked block before main content

**Branch:** `feature/desktop-character-sheet` (merged to main)

---

## Full design pass — scope

Every screen listed below needs the same treatment:
1. **Desktop layout** — break out of 520px single column, use available horizontal space
2. **Typography** — scale up for desktop readability, enforce type scale from style guide
3. **Component consistency** — audit buttons, labels, and field patterns against the style guide

Target minimum viewport: **1920×1080**. All layouts must also work at 1280×800.
Mobile (< 1024px) must remain functional — don't break it, just don't prioritize it.

---

## Screen-by-screen audit

---

### D-01 · WorldHub — world list screen · `[x]`

**File:** `src/components/WorldHub.jsx`
**CSS:** search `.world-hub`, `.card`

**Current state:** World cards stack in a single narrow column, centred at 520px. On a 1920px screen this looks like a receipt.

**Desktop target:**
- Increase max-width to ~1200px
- World cards → **2-column or 3-column card grid** at desktop (CSS grid, `repeat(auto-fill, minmax(360px, 1fr))`)
- Card typography: world name and description text should be larger — currently `.card-name` and `.card-desc` are tiny
- The `+ New World` CTA should sit at the top of the list, not only in the bottom bar

**Typography to fix:**
- `.card-name`: currently ~1rem serif — bump to 1.3rem at desktop
- `.card-desc`: currently ~.83rem — bump to .95rem
- `.card-quote`: currently ~.82rem italic — bump to .9rem

---

### D-02 · WorldDetail — world dashboard · `[x]`

**File:** `src/components/WorldDetail.jsx`
**CSS:** search `.world-detail`, `.tool-card`, `.library`

**Current state:** Tools grid and library list are already a step up from the old single-column, but still constrained to ~520px.

**Desktop target:**
- Increase max-width to ~1200px
- World name/description header: name should be much larger (3rem+ serif)
- Tools grid: already uses CSS grid — ensure columns fill the wider container properly
- Library section: character/scene cards can go 2-column at desktop
- World description text: currently `.card-desc` size — bump to 1rem, 1.85 line-height

**Typography to fix:**
- World heading: currently ~1.8rem — bump to ~2.8rem at desktop
- World description body: ~.83rem → 1rem

---

### D-03 · CreateCharacterScreen · `[x]`

**File:** `src/components/CreateCharacterScreen.jsx`
**CSS:** search `.create-char`, `.form-stack`, `.pill`, `.f-label`, `.f-input`, `.f-area`

**Current state:** Single narrow form column. On desktop it looks like a mobile form floating in the middle of the screen.

**Desktop target:**
- Max-width: ~720px (forms don't need to be as wide as content pages, but 520px is too narrow)
- Two-column layout for the optional specifics section ("Add specifics"): Identity fields left, Physical fields right
- Role and Style pill selectors: make pills slightly larger, give more padding
- The concept textarea: make it taller by default (4–5 rows vs current 3)

**Typography to fix:**
- `.f-label`: .66rem → .75rem at desktop
- `.f-input`, `.f-area`: .87rem → 1rem font-size
- Pill labels: .8rem → .9rem

---

### D-04 · CreateWorldScreen + CreateWorldAdvanced · `[x]`

**Files:** `src/components/CreateWorldScreen.jsx`, `src/components/CreateWorldAdvanced.jsx`
**CSS:** search `.create-world`, `.interview`, `.mode-toggle`

**Current state:** Same narrow column problem as CreateCharacterScreen.

**Desktop target:**
- Max-width: ~680px (still a form, but breathing room)
- World name input and description textarea: larger font, more padding
- Interview view (advanced): question text should be much larger — this is a conversational UI, the question is the centrepiece
- Interview answer textarea: minimum 4 rows, larger text

**Typography to fix:**
- Interview question text: currently ~1rem — should be ~1.5–1.8rem serif italic at desktop
- Answer textarea: .87rem → 1rem

---

### D-05 · CharactersTab / character list within a world · `[x]`

**File:** wherever character cards are listed inside WorldDetail (likely `WorldDetail.jsx` or a `CharactersTab` component)
**CSS:** `.card`, `.card-quote`, `.card-role-line`, `.card-cta`

**Current state:** Character cards stack vertically, single column.

**Desktop target:**
- 2-column card grid at desktop (`repeat(auto-fill, minmax(380px, 1fr))`)
- Character quote inside card: increase from ~.82rem to .95rem
- Card name: 1rem → 1.2rem serif

---

### D-06 · DialogueWriter · `[x]`

**File:** `src/components/DialogueWriter.jsx`
**CSS:** search `.dialogue-screen`, `.dialogue-feed`, `.dialogue-line`, `.stage-direction`

**Current state:** Dialogue lines render in a narrow feed, ~520px.

**Desktop target:**
- Dialogue feed max-width: ~800px (dialogue is a reading experience — wider column, bigger text)
- Character speaker name: needs to be more prominent
- Dialogue line text: .87rem → 1rem, line-height 1.9
- Stage directions: .88rem → .95rem italic

---

### D-07 · SceneDetail · `[x]`

**File:** `src/components/SceneDetail.jsx`

**Current state:** Scenes are long-form prose — currently cramped at 520px.

**Desktop target:**
- Max-width: ~820px (optimal reading column for long prose)
- Scene body text: .87rem → 1.05rem, line-height 1.9
- Scene header (title, participants): bump heading to ~2rem serif

---

### D-08 · LoreExpandInterview / DocumentViewer · `[x]`

**Files:** `src/components/DocumentLibrary.jsx`, `src/components/DocumentViewer.jsx`
**CSS:** `.doc-viewer-inner`, `.doc-viewer-back`

**Current state:** `.doc-viewer-inner` is `max-width: 520px` — documents are often long, dense text that needs room.

**Desktop target:**
- Max-width: ~860px
- Body text: .87rem → 1rem, line-height 1.9
- Document title: bump to ~2.2rem serif

---

## Typography audit — global fixes · `[x]`

These apply across the whole app. Make them in `src/styles.css` inside a single `@media(min-width:1024px)` block at the bottom of the file (or extend the existing one).

| Element | Mobile (current) | Desktop target | CSS class |
|---|---|---|---|
| Page/screen headings | 1.8rem | 2.6–3rem | `.t-heading`, screen-specific `h1` |
| Body text | .87–.88rem | 1rem | `.t-body`, `.cs-field-body`, `.card-desc` |
| Form inputs/textareas | .87rem | 1rem | `.f-input`, `.f-area` |
| Field labels (uppercase) | .63rem | .72rem | `.cs-field-label`, `.f-label` |
| Tab buttons | .66rem | .72rem | `.tab-btn` |
| Card names | ~1rem | 1.2rem | `.card-name` |
| Card descriptions | .83rem | .95rem | `.card-desc` |
| Interview questions | ~1rem | 1.6rem serif italic | screen-specific |
| Back button | .68rem | .68rem (fine as-is) | `.back-btn` |
| Quotes (amber) | .98rem | 1.1rem | `.char-quote`, `.card-quote`, `.t-quote` |

**Rule:** No text below `.72rem` in any interactive or content-bearing element at desktop. `.62rem` labels are fine for metadata/eyebrows only.

---

## Component consistency audit · `[x]`

Things to check and normalise across all screens before finishing the pass:

### Buttons
- Every destructive action should use `.btn-delete-world` (text-only link style) or `.btn-destroy` (only inside confirm modal). Audit all screens for any ad-hoc red/warning button styles.
- Every primary AI-action ("Generate", "Forge", "Expand") should be `.btn-primary`. Check `CreateCharacterScreen` and `CreateWorldAdvanced` for consistency.
- `.btn-sage` is for feature-unlock / AI actions only (✦ Expand Character, ✦ Generate Dialogue). Nowhere else.
- No `.btn-primary` should ever appear outside the bottom bar or a modal — audit for violations.

### Labels
- All field labels must be `.f-label` (forms) or `.cs-field-label` (character sheet fields). No one-off `font-size: .6rem; text-transform: uppercase` inline styles — find them and replace.

### Section headers (eyebrows)
- "TOOLS", "LIBRARY", "CHARACTERS" section labels should consistently use `.cs-section-title` or a shared `.section-eyebrow` class. Currently some screens use inline styles for these.

### Amber
- Amber (`var(--amber)`) should appear **only** in: brand dot, `.char-quote`, `.card-quote`, `.t-quote`. Audit `styles.css` for any other `var(--amber)` usage and remove it (replace with `var(--muted)` or `var(--dark)`).

### Borders
- All borders must use `var(--border)` or `var(--border-hover)`. No hardcoded `rgba()` border values except those already in the design token definitions.

---

## How to run this pass in a new session

1. Open `docs/backlog/DESIGN_PASS_01.md` and `Aristotelian Style Guide.html` in the Claude Code session context
2. Work screen by screen — one component per commit
3. After each screen: restart the preview server, screenshot at 1920×1080, confirm layout looks correct before moving on
4. Run the global typography block last (it touches everything — do it after individual screen layouts are locked)
5. Component consistency audit is a final cleanup sweep — grep for the patterns described above

---

## Design Pass 02 — May 2026 · `[x]`

**Session context:** Triggered by `/design:design-critique` after Pass 01 was complete. The desktop layout work from Pass 01 had landed cleanly, but a usability audit surfaced six structural issues independent of layout: button affordance, action adjacency, navigation cost, scene structure, field action density, and card semantics. All six shipped on `design-critique` → merged to `main` (commit `2bb3719`).

**Reference critique:** captured live in the session that triggered this pass. Summary preserved below.

### What changed

#### 1. Unified button system · `[x]`

**Problem:** Primary CTAs were italic Cormorant Garamond at three different sizes across screens (`+ New World` at 12.8px, `+ New Character` at 18.4px banner, `Generate dialogue` at 18.4px). Secondary CTAs were uppercase Jost. Two typefaces in the same BottomBar read as "label + button," not "primary + secondary."

**Fix:** One sans typeface (Jost) for **all** buttons. Three sizes (`btn-sm` / `btn` / `btn-lg`). Four intents: `btn-primary` (solid dark fill), `btn-ghost` (outlined neutral), `btn-sage` (AI feature), `btn-destroy`. Italic Cormorant retired from buttons — reserved for prose, headings, and epigraphs only.

**Files:** [styles.css `.btn` block](../../src/styles.css#L119) (~line 119–155).

#### 2. DELETE WORLD decoupled from primary CTA · `[x]`

**Problem:** Destructive `DELETE WORLD` sat one row beneath the primary `+ New Character` action in the WorldDetail BottomBar. Real foot-gun.

**Fix:** Moved into a `⋯` overflow menu in the WorldDetail header (`.wd-head-menu`). Delete action opens a proper confirm modal using the existing `.modal-overlay` / `.modal-card` pattern. BottomBar now contains only the primary CTA.

**Files:** [WorldDetail.jsx](../../src/components/WorldDetail.jsx); CSS `.wd-head-menu*` rules.

#### 3. Character switcher in CharacterSheet sidebar · `[x]`

**Problem:** Switching between characters in the same world cost 4 clicks (Back → Back → Cast → Character). Painful when balancing two voices for a dialogue.

**Fix:** "Other characters" list at the bottom of `.cs-sidebar`. One click to jump. New `onSelectCharacter` prop wired through App.jsx → CharacterSheet → renders `.char-switcher`.

**Files:** [CharacterSheet.jsx:57](../../src/components/CharacterSheet.jsx#L57); [App.jsx](../../src/App.jsx); CSS `.char-switcher*` rules.

#### 4. Scene premise field + Dialogue pitch prefill · `[x]`

**Problem:** Scene had no body — only a name. The "Setup note" was a one-line `<input>` and the dialogue setup re-asked for a pitch from scratch every time, even inside a scene that already had context.

**Fix:** Promoted to a multi-line `<textarea>` labelled **Premise** with explicit prompt copy. The DialogueWriter `SetupScreen` now pre-fills `pitch` from `scene.description`. Scene becomes meaningful on its own and seeds the dialogue context.

**Files:** [ScenesTab.jsx](../../src/components/ScenesTab.jsx); [DialogueWriter.jsx `SetupScreen`](../../src/components/DialogueWriter.jsx#L93).

#### 5. CharField action diet · `[x]`

**Problem:** Each field exposed five buttons next to a single label: `?  Edit  ✦  ✎  ↻`. Two visually-similar edit affordances, ambiguous icons, sub-spec touch targets (~7×12 glyph in a 24×22 container).

**Fix:** Reduced to two visible icon buttons (`Edit`, `↻ Regen`) plus a `⋯` overflow that holds `✦ Expand` and `✎ Regenerate with feedback`. The `?` philosophy hint moved onto the label as a small clickable chip (`.cs-field-label-btn` with `cursor: help`). `.icon-btn` minimum height bumped from ~22px to 32px.

**Files:** [CharField.jsx](../../src/components/CharField.jsx); CSS `.cs-field-label-btn`, `.cs-field-overflow*`, `.icon-btn`.

#### 6. Cards as proper buttons · `[x]`

**Problem:** World, character, scene, and dialogue cards were `<div class="card" onClick={...}>` with no `role`, not focusable, and inaccessible to keyboard / screen reader. Tab order skipped them.

**Fix:** All four card types are now `<button class="card card-button">` elements with explicit `aria-label`s and visible `:focus-visible` outlines. Visual identity preserved (added `.card-button` class to neutralize button defaults: `text-align: left`, `font: inherit`, full width).

**Files:** [WorldHub.jsx](../../src/components/WorldHub.jsx), [WorldDetail.jsx](../../src/components/WorldDetail.jsx), [ScenesTab.jsx](../../src/components/ScenesTab.jsx), [SceneDetail.jsx](../../src/components/SceneDetail.jsx); CSS `.card-button`.

### Out of scope for Pass 02 (carried forward)

These appeared in the critique but were not addressed:

- **Token Counter widget** floats over the bottom-right and overlaps the BottomBar — relocate to header chip.
- **Back-button labels are inconsistent**: `← Back`, `← Aristotelian`, `← Scene`, `← BROKEN STATE`. Pick one pattern.
- **WorldDetail description** is full prose with no truncation — every re-entry forces scrolling past your own setup material.
- **Speaker names in dialogue** could deep-link into Character → Dialogue tab to close the "great line → tweak voice profile" loop.
- **Dialogue setup "Available for mention"** visually duplicates participants when nothing's selected yet.

These belong in a future **Design Pass 03** if the priorities still hold.
