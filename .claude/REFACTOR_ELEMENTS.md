# Refactor plan: elements and event system



### Step 4 — Migrate GUI to use `dispatch`

Replace every direct scene method call in `gui.ts` with a dispatch call:

```typescript
// Before:
this.scene.setRaysOpacity(value);

// After:
this.scene.dispatch({ type: "setRaysOpacity", value });
```

The GUI no longer needs to import element-specific types or know about scene
internals. It only speaks in `ViewerEvent` terms.

### Step 5 — Expose `dispatch` in the public API

Currently `embed()`, `load()`, and `loadAll()` return `void`/`Promise<void>`.
Change them to return a viewer handle:

```typescript
// src/main.ts
export type ViewerHandle = {
    dispatch: (event: ViewerEvent) => void;
};

function embed(container: HTMLElement, json_data: string): ViewerHandle {
    const app = setupApp(container, JSON.parse(json_data));
    return { dispatch: (event) => app.scene.dispatch(event) };
}
```

This lets embedding code control the viewer programmatically without going
through the GUI:

```javascript
const viewer = tlmviewer.embed(container, json);
viewer.dispatch({ type: "setRaysOpacity", value: 0.5 });
viewer.dispatch({ type: "setSurfacesVisible", value: false });
```

> **Breaking change:** Changing the return type of `embed`, `load`, and
> `loadAll` must be documented in `CHANGELOG.md`.
