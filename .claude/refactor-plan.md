# Refactor plan: split into workspaces

Precedes the work in `plan.md`. Goal: convert the repo into an npm-workspaces monorepo with three workspaces — `tlmviewer/` (published library), `tlmviewer-testing/` (internal dev/test app), `tlmviewer-static/` (hosted drop-a-JSON viewer).

At each step the repo must build, `npm test` must pass, and the existing test page must still be usable.

## End state

```
<repo root>/
  package.json                 # workspaces root; no app code
  tsconfig.json                # root config, extended per workspace
  LICENSE                      # repo-wide
  README.md                    # short monorepo overview, links to each workspace
  tlmviewer/                   # published npm package (same name, same API)
    src/                       # existing library source
    package.json               # "name": "tlmviewer", version, exports → dist/
    vite.config.js             # lib build only
    tsconfig.json
    README.md                  # the real library README (current content)
    CHANGELOG.md               # moved from repo root
    LICENSE                    # copy of repo LICENSE — required so npm ships it in the tarball
    dist/                      # build output (gitignored)
  tlmviewer-testing/
    index.html
    src/
      main.ts                  # was test/test.ts
      builtinScenes.ts         # was src/elements_registry/testScenes.ts
      vertexShaderTest.ts      # was test/vertexShaderTest.ts
    public/tests/*.json        # moved from root public/tests/
    plugins/generate-test-manifest.js
    package.json               # private, depends on "tlmviewer": "*"
    vite.config.js             # app build; source-alias to ../tlmviewer/src
  tlmviewer-static/
    index.html
    src/main.ts                # drag-drop + file picker, calls tlmviewer.embed
    public/                    # favicon etc
    package.json               # private, depends on "tlmviewer": "*"
    vite.config.js             # app build; source-alias to ../tlmviewer/src
```

Build artifacts after the refactor:
1. `tlmviewer/dist/tlmviewer-{version}.{es,umd}.js` — unchanged, still published to npm.
2. `tlmviewer-testing/dist/` — static site (used mostly via `npm run dev`).
3. `tlmviewer-static/dist/` — static site, deployable.

## Library import strategy (used by both apps)

Each app declares `"tlmviewer": "*"` as a workspace dep, so `node_modules/tlmviewer` symlinks into `../tlmviewer/`. Each app's `vite.config.js` adds a resolve alias:

```js
resolve: {
  alias: { tlmviewer: path.resolve(__dirname, "../tlmviewer/src/main.ts") },
}
```

This bypasses the lib's `dist/` entirely — apps always bundle from source. Fast HMR, no pre-build step before `npm run dev`, and any lib API break lights up immediately in both apps' builds. The dist bundle is only consumed by external npm installers.

`three`, `three-custom-shader-material`, and `lil-gui` remain declared as `devDependencies` of `tlmviewer` (matching today's published `package.json`). npm workspace hoisting makes them reachable from the sibling apps' source-alias imports. The published dependency declarations are unchanged, so external consumers see no diff.

## Step 1 — Root workspace skeleton

**Goal**: convert root `package.json` into a workspaces manifest; no code moved yet, everything still works.

- Create root `package.json` with:
  ```json
  {
    "name": "tlmviewer-monorepo",
    "private": true,
    "workspaces": ["tlmviewer", "tlmviewer-testing", "tlmviewer-static"],
    "scripts": {
      "dev": "npm run dev -w tlmviewer-testing",
      "build": "npm run build --workspaces --if-present",
      "test": "npm run test --workspaces --if-present"
    }
  }
  ```
- Move the **current** `package.json` wholesale into a new `tlmviewer/` directory (keep `"name": "tlmviewer"`, version, exports, scripts, devDependencies).
- Create empty placeholder `tlmviewer-testing/package.json` and `tlmviewer-static/package.json` so `npm install` doesn't complain (`"name"`, `"private": true`, no scripts yet).
- Move nothing else yet.

**Test**: `npm install` at root succeeds; `node_modules/tlmviewer` is a symlink to `./tlmviewer/`.

**Exit criteria**: workspace tree exists; lib code hasn't physically moved.

## Step 2 — Move the library into `tlmviewer/`

**Goal**: all library source lives under `tlmviewer/`; nothing under `src/` at the root. Published npm surface is byte-for-byte identical in the parts consumers rely on.

- Move `src/` → `tlmviewer/src/`.
- Move `tsconfig.json` → `tlmviewer/tsconfig.json` (update `"include"` if needed; stays `["src"]`).
- Move `vite.config.js` → `tlmviewer/vite.config.js`. Adjust `resolve(__dirname, "src/main.ts")` — still correct.
- **In the lib's vite config**: drop only the test-manifest plugin. **Keep `cssInjectedByJsPlugin()` and `version()`** — both are load-bearing for the published bundle (CSS inlining, `import.meta.env.PACKAGE_VERSION` replacement).
- Move `CHANGELOG.md` → `tlmviewer/CHANGELOG.md`.
- Move the current `README.md` → `tlmviewer/README.md`.
- **Copy** `LICENSE` → `tlmviewer/LICENSE` (leave the original at the repo root too). npm auto-ships `LICENSE` from the package directory, so the published tarball currently contains it; without this copy the new tarball would silently drop it.
- Add a placeholder **root** `README.md` with a 5-line overview + links to each workspace.
- Library still publishes the same: `npm run build -w tlmviewer` emits `tlmviewer/dist/tlmviewer-{version}.{es,umd}.js`.
- **Temporary**: keep the root `index.html`, `test/`, `public/`, and `plugins/` in place — the testing app will adopt them in Step 3. They won't work right now (the lib source moved) — that's fine; we'll fix in one shot.

**Test**:
- `npm run build -w tlmviewer` produces `tlmviewer-{version}.es.js` + `tlmviewer-{version}.umd.js` with the same byte sizes (±a few %) as the current build.
- `npm test -w tlmviewer` runs the existing `*.test.ts` files.
- `npm pack --dry-run -w tlmviewer` → tarball contains `package.json`, `README.md`, `LICENSE`, and `dist/tlmviewer-{version}.{es,umd}.js`. **Expected delta vs. today**: the tarball drops the accidentally-included `dist/tests/*.json`, `dist/testscenes.json`, and `dist/test_unpkg.html` (~40 MB of fixtures Vite was copying from `public/` into `dist/`). This is an intentional improvement; no real consumer relies on those files.

**Exit criteria**: library workspace builds the same JS artifacts; published tarball contains `LICENSE` + `README.md` + the two JS files; no unintended file additions or removals beyond the fixture cleanup called out above.

## Step 3 — Stand up `tlmviewer-testing/`

**Goal**: the existing test page moves into its own workspace and works identically, now consuming `tlmviewer` as a dep (aliased to source).

- Flesh out `tlmviewer-testing/package.json`:
  ```json
  {
    "name": "tlmviewer-testing",
    "private": true,
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "preview": "vite preview"
    },
    "dependencies": { "tlmviewer": "*" },
    "devDependencies": { "vite": "...", "typescript": "..." }
  }
  ```
- Move:
  - `index.html` → `tlmviewer-testing/index.html`
  - `test/test.ts` → `tlmviewer-testing/src/main.ts`
  - `test/vertexShaderTest.ts` → `tlmviewer-testing/src/vertexShaderTest.ts`
  - `test_unpkg.html` → `tlmviewer-testing/test_unpkg.html`
  - `public/tests/` → `tlmviewer-testing/public/tests/`
  - `plugins/generate-test-manifest.js` → `tlmviewer-testing/plugins/generate-test-manifest.js`
  - `tlmviewer/src/elements_registry/testScenes.ts` → `tlmviewer-testing/src/builtinScenes.ts`
- Update imports in the testing app to consume the lib by name:
  ```ts
  import tlmviewer from "tlmviewer";
  import { builtinScenes } from "./builtinScenes.ts";
  ```
- `builtinScenes.ts` currently imports `./registry.ts` (`allDescriptors`) from inside the lib. The testing app imports it via a **Vite alias only** — `tlmviewer/registry` → `../tlmviewer/src/elements_registry/registry.ts`. **Do not** add this subpath to `tlmviewer/package.json`'s `"exports"` field: it would point at a `.ts` source file that isn't in the published tarball, silently breaking npm consumers that try to use it. The alias lives only in `tlmviewer-testing/vite.config.js`, so the published API surface is unchanged.
- Write `tlmviewer-testing/vite.config.js`:
  ```js
  import { defineConfig } from "vite";
  import path from "node:path";
  import testJsonManifestPlugin from "./plugins/generate-test-manifest.js";

  export default defineConfig({
    resolve: {
      alias: {
        tlmviewer: path.resolve(__dirname, "../tlmviewer/src/main.ts"),
        "tlmviewer/registry": path.resolve(__dirname, "../tlmviewer/src/elements_registry/registry.ts"),
      },
    },
    plugins: [
      testJsonManifestPlugin({ root: __dirname, tests: "public/tests", manifest: "testscenes.json" }),
    ],
  });
  ```
- `tlmviewer-testing/tsconfig.json` extends root, `"include": ["src", "index.html"]`.
- Delete the now-empty root `test/`, `public/`, `plugins/`, and the root `index.html`.

**Test**:
- `npm run dev` at repo root → test page loads, all builtin scenes render, all JSON fixtures listed in the manifest render, the `loadAll()` auto-viewers render.
- Edit a file under `tlmviewer/src/` → HMR updates the testing app immediately.
- `npm run build -w tlmviewer-testing` produces a static site under `tlmviewer-testing/dist/`.

**Exit criteria**: testing page behavior is byte-for-byte the same, driven from its own workspace.

## Step 4 — Create `tlmviewer-static/`

**Goal**: a new minimal static app that loads a user-supplied JSON file into the viewer — no server, no network.

- `tlmviewer-static/package.json` mirrors the testing app (private, `tlmviewer` workspace dep, vite/typescript devDeps).
- `tlmviewer-static/vite.config.js` mirrors the testing app's config minus the test-manifest plugin.
- `index.html`: single full-viewport container, title, a drop-zone overlay with "drop a scene JSON here or click to browse".
- `src/main.ts`:
  - Mount a container div, show the overlay.
  - Handle `dragover`, `drop`, and `<input type="file">` change.
  - On file: `file.text()` → `tlmviewer.embed(container, text)`. On parse or render error, show an inline error banner and keep the overlay accessible.
  - After a successful load, shrink the overlay into a small "load another" button in a corner.
  - No routing, no URL params, no localStorage — deliberately minimal.
- Small README noting the deploy target is any static host.

**Test**:
- `npm run dev -w tlmviewer-static` → drop one of the `tlmviewer-testing/public/tests/*.json` files into the window; it renders.
- Drop a malformed JSON → error banner, app doesn't crash, overlay stays usable.
- `npm run build -w tlmviewer-static` produces a self-contained `dist/` suitable for static hosting.

**Exit criteria**: dropping a valid scene JSON renders it; building produces a deployable static bundle.

## Step 5 — Root scripts, CI, and docs

**Goal**: one-command workflows from the repo root; docs reflect the new layout.

- Root `package.json` scripts:
  - `npm run dev` → runs `tlmviewer-testing` dev server (primary developer loop).
  - `npm run dev:static` → runs `tlmviewer-static` dev server.
  - `npm run build` → builds all three workspaces (`--workspaces --if-present`).
  - `npm run test` → runs tests in all workspaces.
- Update `.gitignore` to cover each workspace's `dist/` and `node_modules/`.
- Update CI (`.github/workflows/node.js.yml` or equivalent) to run `npm ci && npm run build && npm test` at the root.
- Root `README.md`: short overview of the three workspaces with one-line descriptions and links to each workspace's README.
- Update `.claude/target_architecture.md` — the directory-layout section needs to reflect the new top-level workspace names (`tlmviewer/`, `tlmviewer-testing/`, `tlmviewer-static/`, future `tlmstudio/`, future `tlmserver/`, future `protocol/`).
- Update `.claude/plan.md` Step 3 + Step 4 references — `connect()` is still added to the `tlmviewer` lib; the "minimal static HTML" served by tlmserver in Step 4 of the live-update plan can now reuse `tlmviewer-static`'s build or a tiny inline page.
- Library publish unchanged: `npm publish -w tlmviewer` from a clean build. Before tagging the first post-refactor release, run `npm pack --dry-run -w tlmviewer` and diff the file list against a pre-refactor `npm pack --dry-run` to confirm only the intentional fixture removal differs.

**Exit criteria**: root-level `npm run dev`, `npm run build`, `npm test` all work; CI green; docs match reality; `npm pack --dry-run -w tlmviewer` shows only the expected tarball delta.

## Order-of-work notes

- Steps 1 → 2 → 3 must be sequential: each assumes the previous landed.
- Step 4 is independent of Step 3 once Step 2 is done, but doing Step 3 first proves the workspace-dep + alias strategy before replicating it.
- Step 5 is cleanup; do last.

## Deferred (not part of this refactor)

- Future `tlmstudio/` workspace — the pattern established here (private workspace, `tlmviewer` dep, source alias) applies directly when it arrives.
- Future `tlmserver/` + `protocol/` workspaces — these show up in `plan.md` (the live-update plan). The workspace structure here accommodates them with no further changes.
- Switching package manager (pnpm/bun). Staying on npm.
- Type declaration emission for the lib. Current `tsconfig` has `"noEmit": true`; types aren't published today. Out of scope.
