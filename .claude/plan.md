# Implementation plan

Step-by-step path to the architecture in `target_architecture.md`. Each step is small, independently testable, and leaves the repo in a working state.

## Step 1 — Make tlmviewer re-renderable

**Goal**: calling `embed()` twice on the same container doesn't leak a WebGL context and doesn't jump the camera.

- Add `TLMViewerApp.dispose()` — release the `WebGLRenderer`, disconnect controls, remove the GUI, drop the animation loop.
- Track live apps per container (e.g. `WeakMap<HTMLElement, TLMViewerApp>` module-local in `main.ts`). On `embed()`, if one exists, dispose it first.
- Save/restore camera state across dispose/recreate so live updates don't reset the view. Serialize from `rig` before dispose, reapply after `resetView()` (or skip `resetView` when restoring).

**Test**:
- In browser console on the existing test page: `tlmviewer.embed(el, json1); tlmviewer.embed(el, json2);` — verify second scene replaces first, no console warnings about WebGL context loss, camera stays put.
- Do it in a tight loop (20×) and check DevTools memory / WebGL context count doesn't climb.

**Exit criteria**: existing test page still works identically; double-embed works cleanly.

## Step 2 — Add `protocol/` directory with shared types

**Goal**: single source of truth for the envelope shape, importable from both viewer and (future) server.

- New dir `protocol/` with `index.ts` exporting:
  - `PROTOCOL_VERSION = 1`
  - `type Envelope<T = unknown>`
  - `type MessageType = "scene" | "plot" | "log" | "image"` (open-ended via string widening later)
  - `type Mode = "latest" | "append"`
  - Helper: `defaultModeForType(type)`.
- Wire it into `tlmviewer/tsconfig.json` paths so `tlmviewer/src/` can `import { Envelope } from "../protocol"`.
- No server yet; no runtime behavior change.

**Test**: `npm run build` still succeeds. Import the types from `src/` in a scratch file to confirm resolution.

**Exit criteria**: types exist, build green, nothing else changed.

## Step 3 — Add `tlmviewer.connect(container, wsUrl, opts)`

**Goal**: browser can receive scenes over WebSocket and re-render via Step 1's infra. Still no real server — use `websocat` or a 10-line Node script to test.

- New file `src/connect.ts`, exported from `main.ts`.
- Signature: `connect(container, wsUrl, { topic?: string, type?: MessageType })`.
- Opens `WebSocket`, auto-reconnect with exponential backoff (cap ~10s).
- Shows "waiting for scene…" placeholder until first matching message.
- On message: `JSON.parse` → validate `v === PROTOCOL_VERSION` (warn on mismatch) → filter by `topic`/`type` → if `type === "scene"`, call the same re-render path `embed()` uses.
- Ignore non-scene types silently (forward-compatible).

**Test**:
- `websocat -s 0.0.0.0:9000` in one terminal, paste an envelope JSON manually, watch browser update.
- Disconnect the server mid-session, confirm reconnect banner/behavior.
- Send a message with wrong `v`, confirm warning but no crash.

**Exit criteria**: manual end-to-end live update works against an ad-hoc WS server.

## Step 4 — tlmserver MVP in `server/`

**Goal**: real relay server implementing the protocol, with per-topic `latest`/`append` semantics.

- New dir `server/` with its own `package.json` (or a workspace entry — defer workspaces until it actually hurts; a sibling `package.json` is fine for now).
- Stack: Node stdlib `http` + `ws` library. No framework needed.
- Endpoints:
  - `POST /push` — parse envelope, validate `v` + required fields, store in per-topic state (map keyed by topic, value = `{mode, latest?, buffer?}`), broadcast to all WS clients.
  - `GET /ws` — upgrade to WebSocket; on connect, replay stored state across all topics (last message for `latest`, full ring buffer for `append`).
  - `GET /` — serve a minimal static HTML page that loads the built tlmviewer and calls `connect(document.body, "ws://host/ws")`.
- Imports envelope types from `../protocol/`.
- Config: `--port` (default 8765), `--host` (default `127.0.0.1`, warn on `0.0.0.0`), `--ring-size` (default 1000 for `append` topics).
- CLI entry point: `bin/tlmserver.ts`.

**Test**:
- Start server: `node server/bin/tlmserver.ts`.
- `curl -X POST localhost:8765/push -d @test-scene.json -H 'content-type: application/json'` → browser tab at `localhost:8765/` updates.
- Open two browser tabs → both update.
- Open a tab *after* pushing → replay delivers the latest scene (for `mode: latest`).
- Push an `append`-mode `log` envelope repeatedly → new tab receives the full buffer on connect. (Viewer ignores log type, but the replay mechanism works.)

**Exit criteria**: push from curl, see in browser, across multiple clients, with replay.

## Step 5 — Python push helper

**Goal**: one-line Python call that pushes a scene from torchlensmaker.

- Lives inside torchlensmaker (not a separate package). If this repo needs it for integration tests, copy the ~20 lines into a test fixture.
- Signatures:
  - `push_scene(payload, topic="main", url="http://localhost:8765")`
  - `push(type, payload, topic, mode=None, url=...)` — generic form.
- Thin wrapper over `httpx.post(url + "/push", json={envelope}).raise_for_status()`.

**Test**:
- From a Python REPL while tlmserver is running and a browser tab is open: call `push_scene(scene)` → browser updates.
- End-to-end: run a torchlensmaker script that recomputes a scene in a loop with sleeps, watch browser animate.

**Exit criteria**: the motivating user story works — edit Python, run, browser updates.

## Step 6 — Distribute tlmserver as a standalone binary

**Goal**: Python users install and run tlmserver without needing Node.

- Build path: `bun build server/bin/tlmserver.ts --compile --outfile tlmserver` (or `pkg`, whichever works cleanly on Linux/macOS/Windows).
- Add to CI: on tag, build binaries for the three OSes and attach to the GitHub release.
- Document install as `curl -L <release-url> -o tlmserver && chmod +x tlmserver` in tlmserver's README section.
- Also keep `npm install -g tlmserver` publishing as a secondary path for Node users.

**Test**:
- Download the binary on a machine without Node installed, run it, push a scene, see it render.

**Exit criteria**: Python-only users have a one-file install.

## Step 7 — Documentation

- Update this repo's README with a new "Live mode" section covering `connect()` and the tlmserver workflow.
- Document the protocol envelope in tlmserver's README (or a `protocol/README.md`).
- Add a `CHANGELOG.md` entry noting the new `connect()` public API (per `CLAUDE.md`).

**Exit criteria**: a new user can follow the README from zero to a live-updating browser tab.

## Deferred (not part of this plan)

- tlmstudio itself. The architecture supports it, but it's a separate effort.
- Subscription filters sent from client to server (all clients currently receive all topics). Add when tlmstudio's pane model needs it.
- Authentication. Localhost-only until there's a reason otherwise.
- Browser → Python messages. Protocol envelope is open enough to accommodate; no implementation until a use case exists.

## Order-of-work notes

- Steps 1 and 2 are independent; either can go first. Step 1 is more contentful (real code changes to viewer); Step 2 is scaffolding.
- Steps 3 and 4 both depend on Step 2. Step 3 can be tested without Step 4 (use `websocat`), so do Step 3 before Step 4 to keep integration surface small at each stage.
- Step 5 depends on Step 4. Step 6 depends on Step 4. Step 7 depends on 1–5.
