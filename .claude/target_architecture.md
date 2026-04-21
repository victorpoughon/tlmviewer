# Target architecture

End-state design for live/interactive tlmviewer usage and the future tlmstudio app.

## Goals

- Run a Python script (torchlensmaker) that pushes a scene; a browser tab updates automatically.
- Support other payload types later (plots, logs, images) without breaking the protocol.
- Share TypeScript types for the protocol across server and browser clients.
- Keep Python-user install friction low (no required Node install on end-user machines).

## Components

All code lives in this single repo (monorepo-ish; workspaces introduced only when needed).

```
tlmviewer/
  src/           # TS: 3D viewer library (existing)
  server/        # TS/Node: tlmserver — generic WS relay
  protocol/      # TS: shared envelope types, topic helpers, version constant
  (future) studio/  # TS: tlmstudio shell app
```

- **tlmviewer** — pure 3D viewer library. Exposes `embed`, `load`, `loadAll` (existing) plus `connect(container, wsUrl, opts)` for live mode. Imports types from `protocol/`.
- **tlmserver** — standalone Node binary. Accepts scene (and later plot/log/…) pushes over HTTP, broadcasts to WebSocket clients. Distributed as a standalone binary (e.g. via `bun build --compile`) so Python users don't need a Node install.
- **protocol/** — single source of truth for the envelope shape, protocol version constant, and topic/mode helpers. Both `src/` and `server/` import from it.
- **tlmstudio** (future) — sibling TS app. Embeds tlmviewer, adds plot/log/image panes with drag-and-drop layout. Connects to tlmserver the same way a browser tlmviewer client does.
- **Python push helper** — ~20 lines of `httpx.post`. Lives inside torchlensmaker itself, not a separate Python package.

## Protocol

Single envelope format, transport-agnostic (used identically over HTTP push and WebSocket broadcast).

```json
{
  "v": 1,
  "type": "scene",
  "topic": "main",
  "mode": "latest",
  "payload": { ... }
}
```

| Field | Values | Meaning |
|---|---|---|
| `v` | integer | Protocol version. Bumped only on incompatible changes. |
| `type` | `"scene"` \| `"plot"` \| `"log"` \| `"image"` \| … | Payload kind. tlmviewer handles `scene`, ignores others. |
| `topic` | string | Named stream (e.g. `"main"`, `"optimizer-loss"`). Routes to panes in tlmstudio. |
| `mode` | `"latest"` \| `"append"` | Per-topic semantics: `latest` = replace + replay last on connect; `append` = ring buffer + replay all on connect. |
| `payload` | any | Type-specific body. For `scene`, this is the existing tlmviewer scene JSON. |

Per-type defaults: `scene`/`plot`/`image` = `latest`; `log` = `append`.

## Server behavior

- **`POST /push`** — accepts a single envelope, validates `v`, stores per-topic state according to `mode`, broadcasts to all subscribed WS clients.
- **`GET /ws`** — WebSocket endpoint. On connect, replays per-topic stored state (last message for `latest`, full buffer for `append`). Clients can optionally send a subscription filter (topic glob, type filter); default is all topics, all types.
- **`GET /`** — serves a minimal HTML page that loads tlmviewer and calls `connect()` against `ws://same-host/ws`. This is the "just run tlmserver and open localhost" experience.
- **Storage** — in-memory only. No persistence; scenes regenerate from Python on demand.
- **Security** — binds `127.0.0.1` by default; `--host 0.0.0.0` opt-in with a stderr warning. No auth.

## Browser client (`tlmviewer.connect`)

```ts
tlmviewer.connect(container, wsUrl, { topic?: "main", type?: "scene" })
```

- Opens WebSocket with auto-reconnect + backoff.
- Filters messages by `type` and `topic`.
- For `scene` messages: calls the re-render path (dispose-and-rebuild under the hood, with camera state preserved across updates).
- Shows a placeholder state while waiting for first message.

## Python push helper (in torchlensmaker)

```python
import tlmviewer_client as tlm  # or whatever namespace
tlm.push_scene(scene_dict, topic="main", url="http://localhost:8765")
```

Thin wrapper over `httpx.post("/push", json={...envelope})`. Generic `push(type, payload, topic, mode)` also available for forward compatibility.

## Breaking-change policy

- Scene format changes → `CHANGELOG.md` in this repo (per `CLAUDE.md`).
- Protocol envelope changes → bump `v`, document in this file and in tlmserver's README. Server rejects mismatched `v` with a clear error; clients warn on mismatch.
- Torchlensmaker is the only producer, so coordinated breaking changes are acceptable but should still be versioned for sanity.

## Non-goals

- Persistence / history beyond in-memory per-topic state.
- Authentication. Localhost-only is the assumption.
- Browser → Python interactivity in v1. Protocol leaves room (`type` field is open), but no implementation.
- Multiple concurrent producers writing to the same topic. Last write wins; undefined behavior if torchlensmaker runs twice in parallel against the same topic.
