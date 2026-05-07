<!-- generated-by: gsd-doc-writer -->
# Development

This guide covers local setup, build commands, code style, and contribution conventions for working on Aristotelian.

## Local setup

1. Clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd aristotelian
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment file and add your Anthropic API key:

```bash
cp .env.example .env.local
```

Open `.env.local` and set `ANTHROPIC_API_KEY` to a key from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys). This key is used by the Vite dev-server proxy to authenticate calls to `api.anthropic.com` — it is never embedded in the built output.

4. Start the development server:

```bash
npm run dev
```

The app is served at `http://localhost:5173`. The port is set to `strictPort: true` in `vite.config.js`, so if 5173 is already in use the server will refuse to start rather than pick an alternate port.

**Important constraints:**

- Use `window.storage` for persistence, not `localStorage`. The artifact runtime requires `window.storage`.
- Do not add a routing library. Navigation is handled by `hooks/useRoute.js`.
- Do not add external React libraries beyond the current `react` and `react-dom` dependencies. State is managed with `useState`, `useEffect`, and `useRef` only.
- Do not change `STORAGE_KEY` in `src/storage.js` without bumping the version string — changing the key without a version bump corrupts existing user data.

## Build commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5173 with Anthropic API proxy |
| `npm run build` | Production build (outputs to `dist/`). Bundles both `index.html` and `landing.html` entry points |
| `npm run preview` | Preview the production build locally using Vite's built-in preview server |

## Code style

No linter or formatter is currently configured (no `.eslintrc`, `.prettierrc`, or `biome.json` present). Follow the conventions visible in existing source files:

- Use functional React components with hooks only — no class components
- State mutations use immutable `.map()` patterns — never mutate arrays or objects directly
- CSS class names are prefixed by component (e.g., `.dialogue-`, `.char-sheet-`). Add styles in `src/styles.css` under the relevant component section
- Use the four-level color token system defined in `src/styles.css`: `--dark`, `--label`, `--muted`, `--faint`. Do not use `--faint` for any text the user must read — it fails WCAG AA contrast. Use `--label` for interactive labels instead
- Tab state for `CharacterSheet` lives in `App.jsx` as `activeCharTab` — do not add local tab state inside `CharacterSheet`
- Do not remove `MIN_PHASE_MS = 4000` from the generation overlay — it keeps overlay phase text legible

## Branch conventions

No branch naming convention is currently documented. No `.github/PULL_REQUEST_TEMPLATE.md` or `CONTRIBUTING.md` exists in the repository.

## PR process

No formal PR process is currently documented. No `.github/PULL_REQUEST_TEMPLATE.md` exists in the repository.

## Code map

For navigating the source tree quickly, see `src/CLAUDE.md`. Key entry points:

| Area | Files |
|---|---|
| All state (worlds, characters, routing) | `src/App.jsx` |
| Character generation prompt | `src/prompts/build.js` |
| Character JSON schema | `src/prompts/schema.js` |
| Anthropic API call / streaming | `src/api/claude.js` |
| Persistence layer | `src/storage.js` |
| Framework constants (PHASES, PHIL, roles) | `src/constants.js` |
| All CSS | `src/styles.css` |
| Navigation / routing | `src/hooks/useRoute.js` |
