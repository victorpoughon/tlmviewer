# Preliminary refactors

Preparatory work to do before implementing tlmstudio. Each item is self-contained and can be done independently.

---

## 1. Protocol simplification — remove `mode` from the envelope

**Why:** tlmstudio accumulates all received messages as a log; the server no longer needs to know whether to store-latest or ring-buffer. `mode` is no longer a meaningful concept.

**Changes:**
- `tlmprotocol/src/envelope.ts`: remove `Mode` type and `mode` field from `Envelope`. Bump `PROTOCOL_VERSION` to 2.
- `tlmserver/bin/tlmserver.ts`: remove `TopicState`, `topicStore`, `storeEnvelope()`, `replayTo()`, `--ring-size` CLI arg. On POST `/push`, validate and broadcast only. On WS connect, do nothing (no replay). Remove `mode` from the required-fields validation and log line.
- `python/tlmviewer.py`: remove `mode` parameter from `push_scene()`, remove `mode` from the envelope dict.
- `tlmviewer/` (connect): check if `connect()` or anything in tlmviewer reads/uses `mode` from incoming envelopes — clean up if so.
- `CHANGELOG.md`: document as a breaking change (protocol v1 → v2, `mode` removed, no replay on connect).

---

## 2. Upgrade `python/` to a proper publishable package

**Why:** the current `python/tlmviewer.py` is a loose single file. It should be a proper Python package publishable to PyPI as `tlmviewer`. There is existing Python code in torchlensmaker (separate repo) that will be migrated here as part of this step.

**Changes:**
- Add `python/pyproject.toml` with package metadata: name `tlmviewer`, version, description, Python version constraint, no heavy dependencies.
- Restructure to `python/tlmviewer/__init__.py` (expose `push_scene` and any migrated functions from the top-level import).
- Migrate relevant Python code from torchlensmaker into the package (envelope construction, push helpers, etc.).
- Move logic from the current flat `python/tlmviewer.py` into the package module.
- Add basic unit tests (`python/tests/`) covering envelope construction and push error handling (no live server required — mock the HTTP call).
- Add a `python/README.md` (brief: what it is, install, usage).
- Verify the package builds cleanly with `python -m build`.

---

## 3. Add `tlmstudio/` workspace scaffold

**Why:** get the new workspace wired into the monorepo before building features, so the project structure is right from the start.

**Changes:**
- Create `tlmstudio/` with a standard Vite + Vue 3 + TypeScript scaffold (`npm create vue` or manual).
- Add `tlmstudio` to the root `package.json` workspaces list.
- Add `tlmviewer` and `tlmprotocol` as workspace dependencies.
- Add `dockview` as a dependency.
- Verify `npm install` and `npm run dev -w tlmstudio` work from the repo root.
- No feature code yet — just the skeleton.
