# tlmviewer

tlmviewer is the 3D viewer for [torchlensmaker](https://victorpoughon.github.io/torchlensmaker/), based on ThreeJS. 

This repository contains the following workspaces:

- **[tlmviewer](tlmviewer/)** — published npm library for rendering optical scenes in 3D.
- **[tlmprotocol](protocol/)** — shared TypeScript types for the wire protocol (envelopes) and scene element data.
- **[tlmserver](tlmserver/)** — Node.js HTTP + WebSocket relay server for live scene updates.
- **[tlmviewer-testing](tlmviewer-testing/)** — internal development and test app.
- **[tlmviewer-static](tlmviewer-static/)** — hosted drop-a-JSON static viewer.

## Live mode

`tlmserver` enables a browser tab to auto-update when a scene is pushed.

**Start the server** (requires `npm run build -w tlmviewer` first):

```sh
npm run start -w tlmserver

# or with options:
npx tsx tlmserver/bin/tlmserver.ts --port 8765 --host 127.0.0.1
```

**Open the viewer** at `http://127.0.0.1:8765/` — it connects automatically and waits for a scene.

**Push a scene** from Python or curl:

```sh
curl -X POST http://127.0.0.1:8765/push \
  -H 'content-type: application/json' \
  -d '{"v":1,"type":"scene","topic":"main","mode":"latest","payload":{...}}'
```

The browser updates immediately. Any new tab that opens replays the last scene for each topic.

## JavaScript API

```js
// Embed a scene from a JSON string
tlmviewer.embed(container, jsonString)

// Load a scene from a URL
await tlmviewer.load(container, url)

// Connect to a live WebSocket server
const disconnect = tlmviewer.connect(container, "ws://127.0.0.1:8765/ws")
```
