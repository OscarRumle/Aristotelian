<!-- generated-by: gsd-doc-writer -->
# Configuration

Aristotelian is a client-side React application. Its only runtime configuration is the Anthropic API key used by the Vite dev-server proxy. There is no server process and no config file beyond environment variables.

---

## Environment Variables

Copy `.env.example` to `.env.local` before running the dev server. `.env.local` is gitignored — never commit a real key.

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | **Required** | — | Authenticates requests to `api.anthropic.com`. Obtained from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys). Without this key the dev-server proxy returns 401 and no AI generation works. |
| `ANTHROPIC_VERSION` | Optional | `2023-06-01` | Overrides the `anthropic-version` header sent with every API request. |

### Minimal `.env.local`

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

---

## How Variables Are Loaded

Environment variables are loaded at build/dev time by Vite using `loadEnv`. They are **not** exposed to the browser bundle — they are read only by `vite.config.js` on the Node side and injected into the dev-server proxy configuration.

```
ANTHROPIC_API_KEY  →  vite.config.js (Node)
                    →  proxy proxyReq header: x-api-key
                    →  forwarded to https://api.anthropic.com
```

The browser code in `src/api/claude.js` calls `/api/anthropic/v1/messages` — the proxy rewrites this to `https://api.anthropic.com/v1/messages` and attaches the key. No API key is ever present in browser-side JavaScript.

---

## Dev-Server Configuration

Defined in `vite.config.js`. These values are hardcoded, not environment-variable driven.

| Setting | Value | Notes |
|---|---|---|
| Dev-server port | `5173` | `strictPort: true` — Vite will error rather than pick a fallback port |
| Proxy path prefix | `/api/anthropic` | Rewritten to `https://api.anthropic.com` |
| `anthropic-version` header | `ANTHROPIC_VERSION` env var or `2023-06-01` | Applied to every proxied request |

---

## Application Constants

Runtime behavior is controlled by constants in `src/constants.js`. These are compile-time values — changing them requires a code edit, not an environment variable.

| Constant | Value | Effect |
|---|---|---|
| `STORAGE_KEY` | `"aristotelian-worlds-v2"` | LocalStorage key for all persisted data. Bump the version string when the data schema changes — changing it without migration loses existing user data. |
| `STORAGE_VERSION` | `8` | Current schema version. The storage layer migrates older blobs up to this version automatically on load. |
| `MIN_PHASE_MS` | `4000` | Minimum milliseconds each generation phase overlay is shown. Do not lower — it keeps the overlay readable. |

---

## Storage

Aristotelian persists all worlds, characters, objects, factions, locations, and scenes to browser `localStorage` under the key `"aristotelian-worlds-v2"`.

The stored blob shape is:

```json
{
  "__version": 8,
  "worlds": [ ... ]
}
```

Each world contains arrays: `characters`, `scenes`, `objects`, `factions`, `locations`, `documents`, `interviews`, `uploadedFiles`.

There is no backend database. Clearing browser storage removes all user data permanently.

---

## API Model

The Anthropic model used for all generation is hardcoded in `src/api/claude.js`:

```js
const MODEL = "claude-sonnet-4-6";
```

To change the model, edit that constant directly. There is no environment variable for model selection.

---

## Per-Environment Overrides

There are no `.env.production` or `.env.staging` files. The application has no server-side deployment — it is a pure client app served as static files. Environment-specific configuration is limited to:

- Providing the correct `ANTHROPIC_API_KEY` in the target environment's secret store. <!-- VERIFY: confirm how the API key is supplied in production/staging deployments -->
- The Vite proxy is only active during `npm run dev`. Production builds communicate directly with the Anthropic endpoint or through whatever reverse proxy is configured at the hosting layer. <!-- VERIFY: confirm production proxy/CORS setup if the app is deployed to a hosting platform -->
