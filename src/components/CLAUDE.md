# components/ — Registry

---

## Task Routing

| Task | Files |
|---|---|
| Dialogue UI or generation flow | `DialogueWriter.jsx` |
| Character sheet (view/edit/regen fields) | `CharacterSheet.jsx` + `CharField.jsx` |
| Streaming progress overlay | `GeneratingOverlay.jsx` + `Typewriter.jsx` + `AnimatedVerbs.jsx` |
| Cast analysis panel | `CastAnalysis.jsx` |
| Scene list or scene viewer | `ScenesTab.jsx` + `SceneDetail.jsx` |
| World detail view | `WorldDetail.jsx` |
| World hub (list screen) | `WorldHub.jsx` |
| Create new world (basic) | `CreateWorldScreen.jsx` |
| Create new world (advanced/interview) | `CreateWorldAdvanced.jsx` |
| Create new character form | `CreateCharacterScreen.jsx` |
| Role / style selector pill | `PillSelect.jsx` |
| Global nav bar | `GlobalNav.jsx` |
| Bottom bar (fixed footer) | `BottomBar.jsx` |
| Token counter display | `TokenCounter.jsx` |
| Document library / export viewer | `DocumentLibrary.jsx` + `DocumentViewer.jsx` |
| Loading dots animation | `AnimatedDots.jsx` |
| Empty state placeholder | `EmptyState.jsx` |
| Error toast notification | `ErrorToast.jsx` |
| Confirm / destructive modal | `ConfirmModal.jsx` |

---

## Component Registry

| Component | What it does |
|---|---|
| `App.jsx` | *(in src/ root)* — owns all state, renders active screen via route |
| `WorldHub.jsx` | World list screen. Single btn-primary "+ New World" in page-head. No BottomBar. |
| `WorldDetail.jsx` | World dashboard. Tools split: "Characters" (primary full-width card) + "World Building" (5-card grid: Scenes, Lore, Objects, Factions, Locations). Dashboard BottomBar shows "+ New Character" as primary CTA. |
| `CreateWorldScreen.jsx` | Simple world creation form (name + description) |
| `CreateWorldAdvanced.jsx` | AI-interview world-building flow — multi-step, uses buildInterviewPrompt |
| `CreateCharacterScreen.jsx` | Character creation form: role, style, optional seed fields |
| `CharacterSheet.jsx` | Full character editor/viewer. All tabs (Identity, Psychology, Aristotelian, Dialogue). Handles single-field regen inline. Tab state is controlled: accepts `charTab` + `onTabChange` props from App.jsx — do not add local tab state here. |
| `CharField.jsx` | Single editable field with [?] tooltip (PHIL), regen button, label. Used throughout CharacterSheet. |
| `CastAnalysis.jsx` | AI analysis of the full character roster — ensemble dynamics, hamartia collisions |
| `DialogueWriter.jsx` | AI dialogue generation: pick two characters, generate a scripted scene |
| `SceneDetail.jsx` | Scene viewer/editor for generated scenes |
| `ScenesTab.jsx` | List of scenes within a world |
| `DocumentLibrary.jsx` | Library of generated export documents |
| `DocumentViewer.jsx` | Renders a single generated document |
| `GeneratingOverlay.jsx` | Full-screen streaming progress overlay. Driven by useGeneratingProgress. Accepts `onCancel` prop — wired to AbortController in App.jsx via `handleNavigateAway`. |
| `Typewriter.jsx` | Animated text reveal component — used in GeneratingOverlay |
| `AnimatedVerbs.jsx` | Cycles through verb list during generation phases |
| `AnimatedDots.jsx` | Loading ellipsis animation (BUG B-02: appends instead of cycling) |
| `PillSelect.jsx` | Role / Style selector. Renders pill buttons. (BUG B-03: type badge color) |
| `GlobalNav.jsx` | Top navigation bar. Reads route from useRoute. |
| `BottomBar.jsx` | Fixed footer with context actions |
| `TokenCounter.jsx` | Displays estimated token usage |
| `EmptyState.jsx` | Placeholder when list is empty |
| `ErrorToast.jsx` | Dismissable error notification |
| `ConfirmModal.jsx` | Confirm dialog for destructive actions. Restores focus to the triggering element on close. Handles Escape key. |
