# src/ — Architecture Map

React + Vite web app. All runtime code lives here.

---

## Task Routing

| Task | Files |
|---|---|
| Fix dialogue UI or dialogue generation | `components/DialogueWriter.jsx` + search `styles.css` for `.dialogue-` |
| Fix character sheet (fields, tabs, regen) | `components/CharacterSheet.jsx` + `components/CharField.jsx` |
| Fix overlay / streaming progress animation | `components/GeneratingOverlay.jsx` + `hooks/useGeneratingProgress.js` |
| Fix cast analysis panel | `components/CastAnalysis.jsx` + `prompts/buildCastAnalysisPrompt.js` |
| Fix scene viewer or scene list | `components/SceneDetail.jsx` + `components/ScenesTab.jsx` |
| Fix world creation (basic) | `components/CreateWorldScreen.jsx` |
| Fix world creation (advanced / interview) | `components/CreateWorldAdvanced.jsx` + `prompts/buildInterviewPrompt.js` |
| Fix character creation form | `components/CreateCharacterScreen.jsx` |
| Fix global nav / routing | `components/GlobalNav.jsx` + `hooks/useRoute.js` |
| Fix bottom bar | `components/BottomBar.jsx` |
| Fix document library or viewer | `components/DocumentLibrary.jsx` + `components/DocumentViewer.jsx` |
| Change character generation prompt | `prompts/build.js` |
| Change what fields the LLM returns | `prompts/schema.js` (then update `prompts/build.js`) |
| Change API call / streaming logic | `api/claude.js` |
| Change persistence / storage | `storage.js` |
| Change PHIL tooltips, roles, styles, phases | `constants.js` |
| Change theme (dark/light) | `hooks/useTheme.js` + `styles.css` |

---

## File Registry

### Root files
| File | What it does |
|---|---|
| `App.jsx` | Root component. Owns all state: worlds, activeWorldId, route, activeCharTab. Defines addWorld / addCharacter / updateCharacter. Passes charTab + onTabChange to CharacterSheet. |
| `Root.jsx` | Entry wrapper (auth gate + theme provider) |
| `main.jsx` | Vite entry point |
| `landing.jsx` | Landing page entry |
| `constants.js` | PHASES, PHIL, ROLE_OPTIONS, STYLE_OPTIONS — all hardcoded framework content |
| `storage.js` | window.storage wrapper. Defines STORAGE_KEY = "aristotelian-worlds-v2" |
| `util.js` | Shared helpers (isFullRole, isSupport, isMini, etc.) |
| `styles.css` | All CSS. Organized by component — search the component name to find its styles |

### Subdirectories
| Dir | See |
|---|---|
| `components/` | [components/CLAUDE.md](components/CLAUDE.md) |
| `prompts/` | [prompts/CLAUDE.md](prompts/CLAUDE.md) |
| `hooks/` | [hooks/CLAUDE.md](hooks/CLAUDE.md) |
| `api/` | `api/claude.js` — callClaude, callClaudeStreaming |
| `context/` | `context/AuthContext.jsx` — auth state |
| `pages/` | `pages/LandingPage.jsx`, `pages/PlansPage.jsx` |
