<!-- generated-by: gsd-doc-writer -->
# Testing

## Test framework and setup

Aristotelian has no automated test framework configured. The `package.json` `scripts` block contains only `dev`, `build`, and `preview` — there is no `test` script, and no test runner (`jest`, `vitest`, `mocha`, `playwright`, or similar) appears in `dependencies` or `devDependencies`.

The project is a browser-only React + Vite application that calls the Anthropic API directly. Most behaviour is either UI interaction or LLM-output handling, which makes pure unit testing a small fraction of the overall surface.

---

## What a test setup would look like

Vitest is the natural fit for this stack because it shares the same Vite config and supports ESM modules natively.

**To add Vitest:**

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add a `test` script to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Add a `test` block to `vite.config.js`:

```js
// inside defineConfig(...)
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.js'],
}
```

Create a setup file at `src/test/setup.js`:

```js
import '@testing-library/jest-dom';
```

Test files would follow the naming convention `*.test.js` or `*.spec.js` co-located with source files, or placed in a `src/test/` directory.

---

## Units worth testing first

Two pure utility modules in the codebase have no browser, React, or API dependencies and are ideal starting points for automated tests.

### `src/utils/referenceParser.js`

Exports `parseReferences`, `hasReferences`, `stripReferences`, and `resolveEntity`. These are pure functions that parse and resolve `[[Name|type]]` reference markup. Edge cases worth covering:

- Input with no tags returns a single `text` segment
- Tags without a type hint (`[[Name]]`) set `typeHint` to `null`
- Tags with an invalid type hint treat `typeHint` as `null`
- Escaped `\[[` renders as a literal `[[` rather than a tag
- `resolveEntity` matches by exact name, then prefix, then substring — in that order
- `resolveEntity` searches entity arrays in the order: character → faction → location → object → lore

Example test structure:

```js
import { parseReferences, resolveEntity } from '../utils/referenceParser.js';

describe('parseReferences', () => {
  it('returns a text segment when input contains no tags', () => {
    expect(parseReferences('plain text')).toEqual([{ kind: 'text', value: 'plain text' }]);
  });

  it('parses a typed reference tag', () => {
    const result = parseReferences('See [[Elara|character]] for details.');
    expect(result).toContainEqual({ kind: 'tag', name: 'Elara', typeHint: 'character', raw: '[[Elara|character]]' });
  });
});
```

### `src/util.js`

Exports `extractJson`, `uid`, `metaLine`, `isFullRole`, `isMini`, `isSupport`, and `randItem`.

`extractJson` is the most valuable to test — it extracts the first balanced JSON object from a string that may contain surrounding prose or markdown fences. Edge cases:

- Returns `null` for empty or non-JSON input
- Handles nested objects and arrays correctly
- Tolerates escaped quotes inside strings
- Extracts from strings with prose before and after the JSON block

### `src/storage.js`

The `migrate` function (unexported) and the `loadWorlds` / `saveWorlds` pair are testable with a mocked `localStorage`. Migration steps v2 through v8 each have discrete data shape changes that are worth covering to prevent regression when the next version is added.

---

## Running tests (once added)

| Command | What it does |
|---|---|
| `npm test` | Run the full test suite once |
| `npm run test:watch` | Run in watch mode, re-running on file changes |

---

## Manual QA conventions

Because there is no automated test suite, changes are validated manually before committing. The following checks cover the main risk areas:

**Character generation flow**
1. Create a new world.
2. Create a character with each role type (Lead, Deuteragonist, Supporting, Minor, Ensemble).
3. Confirm the generating overlay shows phase labels and animated verbs, and that each phase advances.
4. Confirm the completed character sheet renders all fields without blank sections.

**Storage and migration**
- Open the browser console and run `localStorage.getItem("aristotelian-worlds-v2")` to confirm data is saved with a `__version` key matching the current `STORAGE_VERSION` constant (`8` as of this writing).
- After any change to `storage.js` that bumps `STORAGE_VERSION`, verify that worlds created on the previous version load correctly.

**Reference markup**
- Write `[[CharacterName]]` in any rich-text field and confirm it renders as a clickable link.
- Use `[[Name|character]]` with an explicit type hint and confirm the hover preview shows the correct entity.

**Theme**
- Toggle between light and dark mode (via the theme button in the global nav) and confirm no text uses `--faint` colour where readable labels are expected.

---

## Coverage requirements

No coverage thresholds are configured. When a test suite is introduced, the recommended starting thresholds for a utility-first test strategy are:

| Type | Suggested threshold |
|---|---|
| Lines | 70% |
| Branches | 60% |
| Functions | 70% |

Apply these only to `src/util.js` and `src/utils/` initially, not to React components or prompt builders, which require more setup to test meaningfully.

---

## CI integration

No CI/CD pipeline is configured. There is no `.github/workflows/` directory. If a pipeline is added, the recommended step is:

```yaml
- name: Run tests
  run: npm test
```

This should run on `push` to `main` and on all pull requests.
