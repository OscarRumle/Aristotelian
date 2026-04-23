# prompts/ — Prompt Builder Registry

All LLM prompt construction lives here. Each file exports one function.

---

## Task Routing

| Task | File |
|---|---|
| Change character generation output / structure | `build.js` |
| Change role instructions (Lead, Supporting, etc.) | `build.js` — `roleInstructions` object inside buildPrompt |
| Change style instructions (Tragic, Comic, Mixed) | `build.js` — `styleInstructions` object inside buildPrompt |
| Improve Comic character generation | `build.js` styleInstructions.comic + `docs/philosophy/Aristotle_Comedy_Guide.md` |
| Change how partial characters are filled in | `expand.js` |
| Change single-field regeneration | `regen.js` |
| Change what fields the LLM returns | `schema.js` — then update `build.js` field instructions too |
| Change cast analysis prompt | `buildCastAnalysisPrompt.js` (also check `buildAnalysisPrompt.js`) |
| Change dialogue generation prompt | `buildDialoguePrompt.js` |
| Change document/export generation prompt | `buildDocumentsPrompt.js` |
| Change world-building interview prompt | `buildInterviewPrompt.js` |

---

## File Registry

| File | Exported function | Used by | Returns |
|---|---|---|---|
| `build.js` | `buildPrompt(world, existingChars, inputs, targetLead)` | `CreateCharacterScreen` | Full character JSON |
| `expand.js` | `buildExpandPrompt(world, character)` | `CharacterSheet` (Generate Dialogue path), Minor/Supporting gen | Complete character JSON (fills missing fields) |
| `regen.js` | `buildRegenPrompt(world, character, fieldKey)` | `CharField` regen button | Plain string for one field |
| `schema.js` | `CHARACTER_SCHEMA` (constant) | `build.js`, `expand.js` | JSON schema injected into prompts |
| `buildCastAnalysisPrompt.js` | `buildCastAnalysisPrompt(world, characters)` | `CastAnalysis` | Ensemble analysis text |
| `buildAnalysisPrompt.js` | `buildAnalysisPrompt(...)` | `CastAnalysis` (older path) | Analysis text |
| `buildDialoguePrompt.js` | `buildDialoguePrompt(world, charA, charB)` | `DialogueWriter` | Scripted dialogue |
| `buildDocumentsPrompt.js` | `buildDocumentsPrompt(world, character, docType)` | `DocumentLibrary` | Export document text |
| `buildInterviewPrompt.js` | `buildInterviewPrompt(answers, step)` | `CreateWorldAdvanced` | Interview follow-up or world JSON |

---

## Prompt Architecture Notes

`buildPrompt` assembles in this order:
1. World name + description
2. Existing cast (name, role, summary[0])
3. Role instruction block — varies by role, defined in `roleInstructions` inside the function
4. Style instruction block — varies by style, defined in `styleInstructions` inside the function
5. Aristotle's framework (hardcoded — source of truth is `docs/philosophy/`)
6. Dialogue framework (hardcoded)
7. User seed inputs (only non-empty fields)
8. Field instructions + JSON schema from `schema.js`
