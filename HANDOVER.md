**Handover — 2026-04-23 | Session: Implemented Advanced World Building feature end-to-end**

---

## 1. Project snapshot

Aristotelian is a Vite + React SPA that generates dramatically structured characters using Aristotle's Poetics framework, calling the Anthropic API directly from the browser. Users create named Worlds, then generate Characters inside them; each character is a structured JSON sheet built by injecting world context + existing cast into a schema-constrained prompt. The `src/` directory is the runnable app; `aristotelian-3.jsx` in the project root is a read-only reference artifact.

---

## 2. What we did this session

The entire "Advanced World Building" feature was designed and implemented from scratch.

**Plan phase:** Read `docs/design/world-building-advanced.md`, produced a full implementation plan (stored at `/Users/anna/.claude/plans/please-read-the-world-purring-island.md`), got approval, then implemented.

**Files created:**

- `src/prompts/buildInterviewPrompt.js` — builds the system prompt for generating N interview questions. Two-phase structure: gap-fill (ceil(N/3) questions) then Aristotelian pressure (remainder), across 5 lenses (mimesis, necessity, polis, hamartia, possible). Accepts `existingDocs` array for continue mode, filtering out "Interview Transcript" to avoid re-covering ground. Returns `{"questions":[...]}` wrapper so `extractJson` can find it.

- `src/prompts/buildDocumentsPrompt.js` — builds prompt for synthesising all interview sessions into lore documents. Enforces "only include what was actually provided" rule. Always generates "World Primer" and "Interview Transcript"; other documents (Power & Conflict, Society & Culture, History & Myth, Geography & Setting, Rules of the World) generated only when the transcript supports them. Returns `{"documents":[...]}` wrapper.

- `src/components/CreateWorldAdvanced.jsx` — 512-line multi-step wizard. Step flow: `basic → extended → upload → length → interview → generating`. Continue mode (`existingWorld` prop) skips to `length`. `startInterview(length)` calls API for questions (maxTokens: 4000). `advanceQuestion()` records answers and triggers `generateDocuments()` on the final question. `generateDocuments(transcript)` calls API, merges docs into world object, calls `onDone`. On error in generating step shows retry button that re-fires `generateDocuments(answers)`.

- `src/components/DocumentLibrary.jsx` — grid of doc cards with title + summary. Manages `activeDoc` state locally. Mounts `DocumentViewer` overlay.

- `src/components/DocumentViewer.jsx` — full-screen overlay for reading a single document. Back button closes.

**Files modified:**

- `src/constants.js` — `STORAGE_VERSION` bumped to 4. Added `GENRE_OPTIONS` (Fantasy/Sci-Fi/Historical/Contemporary/Horror/Mixed) and `SCALE_OPTIONS` (City/Nation/World/Cosmos).

- `src/storage.js` — Added v3→v4 migration: backfills `mode: "simple"`, `extendedInputs: null`, `documents: []`, `interviews: []`, `uploadedFiles: []` on all existing worlds using spread-with-defaults pattern.

- `src/prompts/build.js` — Added `worldDocsBlock`: when `world.mode === "advanced"` and docs exist, injects `WORLD DOCUMENTS:` section (all docs except "Interview Transcript") before user inputs in the character generation prompt.

- `src/components/CreateWorldScreen.jsx` — Added `mode` state and pill toggle. Advanced selected → mounts `<CreateWorldAdvanced>`. Simple still sets `extendedInputs: null, documents: [], interviews: [], uploadedFiles: []` on the created world object.

- `src/components/WorldDetail.jsx` — Imports `DocumentLibrary`; renders it above character list for advanced worlds. Shows "Continue Interview" button in BottomBar when `onContinueInterview` prop is provided and `world.mode === "advanced"`.

- `src/App.jsx` — Added `updateWorld` state helper. Added `'continueInterview'` view that mounts `<CreateWorldAdvanced existingWorld={activeWorld} onDone={(updatedWorld) => { updateWorld(updatedWorld); setView("world"); }} onBack={() => setView("world")} />`. `WorldDetail` now receives `onContinueInterview` that navigates to this view.

- `src/styles.css` — Large addition: wizard step dots, mode toggle, length cards, dropzone, interview progress bar + options + Aristotle badge, document library + viewer overlay, `btn-continue-interview` button.

**Key design decisions:**

- `extractJson` only handles `{...}` not `[...]`, so both prompts return wrapper objects — never bare arrays.
- `maxTokens: 4000` for both interview and document calls; the default 2000 is too low for 20-question interviews and multi-document synthesis.
- Document generation in continue mode *replaces* the full documents array (not appends); the prompt sees all interview sessions combined and synthesises fresh. This avoids orphaned partial docs.
- "Interview Transcript" doc is excluded from character generation prompt injection (too noisy; the synthesis docs are what matters for characters).

---

## 3. Current state

**Working:**
- Full simple world creation (unchanged)
- Full advanced world creation wizard (all 6 steps)
- 5-question and 20-question interview modes
- Document generation from interview transcripts
- DocumentLibrary on WorldDetail for advanced worlds
- DocumentViewer overlay
- Continue Interview flow from WorldDetail
- World documents injected into character generation prompts for advanced worlds
- Storage migration v3→v4 (backfills new fields on existing worlds)

**Known rough edges:**
- File upload step is a UI placeholder only — the dropzone renders and looks correct but accepts no files. `uploadedFiles` is always `[]`.
- The `storage.js` migration uses `localStorage` directly (standard browser API, correct for the `src/` Vite build). The `CLAUDE.md` says `window.storage` but that refers to the read-only `aristotelian-3.jsx` artifact, not the `src/` app.
- No error boundary around the interview — if the API fails mid-interview the wizard shows an error message in the length step, but answers already typed are not preserved.
- The continue mode generates a brand new full document set each time (re-synthesises everything). This is correct per spec, but a long-running world with many interview sessions will have an increasingly large prompt for document synthesis.

**Not done:**
- File ingestion (explicitly deferred per spec)

---

## 4. Critical context

**`src/` vs `aristotelian-3.jsx`:** `aristotelian-3.jsx` is read-only reference. Everything runs from `src/`. Do not edit the JSX file.

**`CLAUDE.md` refers to `window.storage`** — that's the artifact runtime API used inside the single-file JSX. The `src/` Vite app uses standard `localStorage` via `src/storage.js`. These are different environments.

**`STORAGE_KEY = "aristotelian-worlds-v2"`** — the key has not changed since v2. Only `STORAGE_VERSION` (the value inside the envelope) was bumped to 4. Don't change the key without warning the user their stored data will be lost.

**`extractJson` limitation:** The utility in `src/util.js` extracts the first `{...}` JSON object from a string using brace counting. It does not handle bare arrays. All LLM calls that return multiple items must use a wrapper object (`{"questions":[...]}`, `{"documents":[...]}`).

**`callClaude` signature:** `callClaude(systemPrompt, userMessage, options?)`. Default `maxTokens` is 2000. Pass `{ maxTokens: 4000 }` for interview and document generation calls.

**No routing library** — navigation is pure state (`view` string in `App.jsx`). Don't add one.

**World schema (as of v4):**
```js
{
  id, name, description, characters,
  mode: 'simple' | 'advanced',
  extendedInputs: { genre, tone, era, scale, inspiration, distinctive } | null,
  documents: [{ id, title, summary, content, generatedAt }],
  interviews: [{ id, startedAt, length: 'short'|'long', transcript: [{question, answer, phase, lens}] }],
  uploadedFiles: [],  // always empty, placeholder only
}
```

**`buildInterviewPrompt` continue mode:** Pass `existingWorld.documents` as the third arg. The function filters out "Interview Transcript" internally to avoid telling the model to skip Q&A it hasn't seen.

---

## 5. Next steps (priority order)

1. **Export** — Most actionable next step. PDF character sheet / copy as markdown. Start in `CharacterSheet.jsx`. No complex deps needed: `window.print()` for PDF, clipboard API for markdown copy. Character data is all in the `character` prop.

2. **Improve comic character generation** — `buildPrompt` comic style instruction in `src/prompts/schema.js` is thin. `docs/philosophy/Aristotle_Comedy_Guide.md` has full framework (six types, gap theory). Needs to be worked into `STYLE_INSTRUCTIONS["Comic"]`.

3. **File upload** — The dropzone UI exists in `CreateWorldAdvanced.jsx` step `"upload"`. Needs FileReader API, type detection (text vs PDF), and injection into `buildInterviewPrompt` and `buildDocumentsPrompt`.

4. **Scene generation** — Two characters + world → dramatic scene with hamartias in collision. New prompt + new view. Spec in `docs/Design Doc.md`.

---

## 6. Open questions

- **File upload scope:** Should the upload step support PDF (requires server-side extraction or PDF.js) or text-only files? No decision made.
- **Continue interview document strategy:** Currently replaces all documents on each continue. Should there be a way to keep previous documents and only generate new ones based on fresh interview answers? No decision made.
- **Interview error recovery:** If the API fails after the user has answered several questions, their answers are lost. Worth persisting answers to localStorage mid-interview? No decision made.
- **20-question interview UX:** Not tested in browser (5Q was verified end-to-end). The 20Q prompt fits in 4000 tokens but hasn't been confirmed live.
