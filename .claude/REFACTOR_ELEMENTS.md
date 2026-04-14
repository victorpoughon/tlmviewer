# Refactor plan: elements and event system

## Scene elements

The general goal is to make everything into a scene element. Currently a lot of
functionality is currently special logic in scene.ts, but could be a generic
scene element. This would improve modularity of the code. It may require adding
things to the abstract element interface, and this is ok.

List of candidates:

* Axes helpers
* Scene title
* Lights

### Current problem

In `src/scene.ts`, the constructor hard-codes the creation of lights, axes, and
title handling as named properties of `TLMScene`:

```typescript
public ambientLight: THREE.Light;
public directionalLight: THREE.Light;
public opticalAxis: THREE.Group;
public otherAxes: THREE.Group;
public title: string;
```

`gui.ts` then reaches directly into these properties to bind visibility controls:

```typescript
folderShow.add(this.scene.opticalAxis, "visible").name("Optical axis");
folderShow.add(this.scene.otherAxes, "visible").name("Other axes");
```

This makes `TLMScene` grow every time a new built-in feature is added, and the
GUI is tightly coupled to the scene's internal structure.

### Unified element instantiation

There is no distinction between "built-in" and "data" elements — all elements
use the same interface and can be instantiated from either code or JSON data.
Built-in elements are simply elements that `TLMScene` adds to the scene
unconditionally, in addition to the elements found in the JSON `data` array.

To disable a default element, the scene JSON can include a special entry:

```json
{
    "default_elements": [
        { "name": "optical-axis", "enabled": false },
        { "name": "ambient-light", "enabled": false }
    ]
}
```

When `TLMScene` encounters such an entry before adding built-ins, it skips the
corresponding built-in. This keeps the data array as the single place to
configure the scene.

### New element: `SceneAxisElement`

The current optical axis (a line along X) and other axes (a Y line in 2D, or a
Three.js `AxesHelper` in 3D) are merged into a single parametric element:

```
src/elements/sceneAxis/SceneAxisElement.ts
```

Element data shape:

```typescript
{
    type: "scene-axis",
    length: 500,       // default: 500
    color: "#e3e3e3",  // default: "#e3e3e3"
    axis: "x" | "y" | "coordinate"
    // "coordinate" renders a Three.js AxesHelper (3D only)
}
```

The two current built-ins become two default instances of this element, added
by `TLMScene` unless disabled:

```typescript
// TLMScene adds these unconditionally, before processing JSON data:
const builtins = [
    new SceneAxisElement({ type: "scene-axis", axis: "x", length: 500, color: "#e3e3e3" }, dim, container, threeScene),
    new SceneAxisElement({ type: "scene-axis", axis: "coordinate", length: 5, color: "#e3e3e3" }, dim, container, threeScene),
    new LightsElement({ type: "lights" }, dim, container, threeScene),
    new TitleElement({ type: "title" }, dim, container, threeScene),
];
```

New files to create:

```
src/elements/sceneAxis/SceneAxisElement.ts
src/elements/lights/LightsElement.ts
src/elements/title/TitleElement.ts
```

The named properties (`opticalAxis`, `otherAxes`, `ambientLight`, etc.) are
removed from `TLMScene` once the migration is complete.

### Built-in elements instantiated from code

Built-in elements are constructed directly with typed data — no JSON involved:

```typescript
new SceneAxisElement(
    { axis: "x", length: 500, color: "#e3e3e3" },
    dim, container, threeScene
);
```

`getRequired` is never called for built-ins; defaults are applied inline at the
call site.

---

## GUI: event system

In order to make the gui implementation more scalable, it will be refactored to
an event system. When a gui action is triggered, an event is propagated to all
elements. It's up to elements to subscribe to event types and handle them.

The public interface to the tlmviewer library should include a way for clients
to trigger events programatically. That way eventually, the gui code would even
be refactored to be very independent from the core code and call this new API
function.

### Step 1 — Define `ViewerEvent` as a discriminated union

Create `src/viewerEvents.ts`:

```typescript
import * as THREE from "three";
import { ColorOption } from "./elements/index.ts";

export type ViewerEvent =
    | { type: "setValidRaysColor";   value: ColorOption }
    | { type: "setBlockedRaysColor"; value: ColorOption }
    | { type: "setOutputRaysColor";  value: ColorOption }
    | { type: "setRaysOpacity";      value: number }
    | { type: "setRaysThickness";    value: number }
    | { type: "setSurfacesVisible";  value: boolean }
    | { type: "setSurfacesColor";    value: THREE.Color }
    | { type: "setAxisVisible";      value: { axis: "x" | "coordinate"; visible: boolean } }
    | { type: "setBcylVisible";      value: boolean }
    | { type: "setBackground";       value: THREE.Color }
    | { type: "resetView" };
```

The discriminated union gives exhaustive type-checking: adding a new event type
surfaces all the places that need to handle it at compile time.

### Step 2 — Add `addEventListener` to `AbstractSceneElement`

Rather than requiring elements to implement a `switch` statement over all event
types, elements register typed handler functions in their constructor. The base
class dispatches events to registered handlers automatically:

```typescript
import { ViewerEvent } from "../viewerEvents.ts";

export abstract class AbstractSceneElement {
    private eventHandlers = new Map<string, (event: any) => void>();

    protected addEventListener<K extends ViewerEvent["type"]>(
        type: K,
        handler: (event: Extract<ViewerEvent, { type: K }>) => void,
    ): void {
        this.eventHandlers.set(type, handler);
    }

    public onEvent(event: ViewerEvent): void {
        this.eventHandlers.get(event.type)?.(event);
    }
}
```

Elements register handlers in their constructor, with the correct event payload
type inferred automatically:

```typescript
// In RaysElement constructor:
this.addEventListener("setRaysOpacity", (e) => {
    // e.value is typed as number
    this.setOpacity(this.group, e.value);
});

this.addEventListener("setRaysThickness", (e) => {
    this.setThickness(this.group, e.value);
});
```

### Step 3 — Add `dispatch` to `TLMScene`

```typescript
// In TLMScene
public dispatch(event: ViewerEvent): void {
    this.sceneGraph.traverse((child: THREE.Object3D) => {
        if (child.userData instanceof AbstractSceneElement) {
            child.userData.onEvent(event);
        }
    });
}
```

The existing specific methods (`setRaysOpacity`, `setSurfacesVisible`, etc.)
become one-line wrappers calling `dispatch`, and can be removed once the GUI is
migrated.

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

---

## Implementation order

### Phase 1 — Event system

1. Define `ViewerEvent` discriminated union in `src/viewerEvents.ts`.
2. Add `addEventListener` / `onEvent` to `AbstractSceneElement`.
3. Add `dispatch` to `TLMScene`; keep existing specific methods as one-line wrappers for now.
4. Migrate one element (`RaysElement`) to register handlers via `addEventListener` inside `makeGroup()` — verify nothing breaks.
5. Migrate remaining elements (`SurfaceBaseElement`, `BcylElement`).

### Phase 2 — Built-in elements

6. Create `SceneAxisElement`, `LightsElement`, `TitleElement`; wire up as built-ins in `TLMScene`. Remove the named properties (`opticalAxis`, `otherAxes`, `ambientLight`, etc.) from `TLMScene`.

### Phase 3 — GUI migration and public API

7. Migrate GUI to use `dispatch` exclusively; remove direct scene property access from `gui.ts`.
8. Expose `dispatch` in the public API via `ViewerHandle`; update `CHANGELOG.md` for the breaking return-type change.
9. Remove now-redundant specific methods from `TLMScene`.
