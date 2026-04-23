# hooks/ — Registry

Three hooks. Each has a single responsibility.

---

## Task Routing

| Task | File |
|---|---|
| Fix overlay phase sequencing or timing | `useGeneratingProgress.js` |
| Fix verb cycling during generation | `useGeneratingProgress.js` — verbs come from `PHASES` in `constants.js` |
| Fix navigation / screen routing | `useRoute.js` |
| Fix dark/light theme switching | `useTheme.js` + `styles.css` CSS variables |

---

## Hook Registry

### `useGeneratingProgress.js`
Drives the GeneratingOverlay animation during LLM streaming.

- **Input:** accumulated JSON string from the stream
- **Watches for:** `PHASES[i].streamMarker` substrings appearing in the text
- **On match:** schedules phase completion after minimum `MIN_PHASE_MS = 4000ms` from phase start
- **Holds:** green "done" state for 900ms before advancing to next phase
- **Drives:** animated verb cycling every 1.6s from each phase's `verbs` array
- **Consumed by:** `GeneratingOverlay.jsx`

### `useRoute.js`
State-driven navigation. No routing library.

- Manages current screen/view as state
- Exposes `route`, `navigate(screen, params)`
- **Consumed by:** `GlobalNav.jsx`, `App.jsx`, screen components
- Do not replace with React Router — intentional choice for this scope

### `useTheme.js`
Dark / light mode toggle.

- Reads/writes theme preference to storage
- Applies CSS class to document root
- **Consumed by:** `Root.jsx`, `GlobalNav.jsx`
