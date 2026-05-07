<!-- generated-by: gsd-doc-writer -->
# Getting Started

This guide walks you from a fresh checkout to a running Aristotelian development server.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | >= 18 | Required by React 18 and Vite 5 |
| npm | >= 9 (bundled with Node 18) | Used for dependency installation |
| Anthropic API key | — | Needed for all AI generation. Get one at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |

No other runtimes, databases, or services are required. All data is stored in browser localStorage.

---

## Installation Steps

1. Clone the repository:

```bash
git clone <repository-url>
cd aristotelian
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment variable template and fill in your Anthropic API key:

```bash
cp .env.example .env.local
```

Then open `.env.local` and set:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

`.env.local` is gitignored — never commit your real key.

---

## First Run

Start the development server:

```bash
npm run dev
```

Vite starts on port `5173` (strict — it will not fall back to another port). Open the URL shown in your terminal:

```
http://localhost:5173
```

The app proxies all `/api/anthropic` requests through Vite's dev server, attaching your API key server-side. No key is exposed in the browser bundle.

---

## Common Setup Issues

**Port 5173 is already in use**

The dev server uses `strictPort: true`. If port 5173 is occupied, Vite will error rather than pick an alternative. Stop whatever is using port 5173, then run `npm run dev` again.

**AI generation returns 401 Unauthorized**

The Vite proxy could not authenticate with the Anthropic API. Check that:
- `.env.local` exists (not `.env` or `.env.example`)
- `ANTHROPIC_API_KEY` is set to a valid key with no surrounding quotes or whitespace
- You restarted `npm run dev` after editing `.env.local` (Vite reads env variables at startup)

**Characters generate but data disappears on reload**

Aristotelian uses browser `localStorage` under the key `"aristotelian-worlds-v2"`. If the browser's storage is cleared (private/incognito mode, clearing site data, or certain browser privacy settings), all worlds and characters are permanently lost. Use a regular browser session.

**`npm install` fails with peer dependency errors**

Ensure you are running Node.js 18 or later. Run `node --version` to confirm. If you manage Node versions with nvm or fnm, switch to Node 18+ before installing.

---

## Next Steps

Once the server is running:

- See `docs/ARCHITECTURE.md` to understand how the app is structured
- See `docs/CONFIGURATION.md` for all environment variables and application constants
- See `README.md` for usage instructions (creating Worlds, generating Characters, Cast Analysis, Dialogue)
- See `docs/philosophy/` for the Aristotelian framework behind the generation prompts
