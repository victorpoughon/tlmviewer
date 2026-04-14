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

To disable a built-in element, the scene JSON can include a special entry:

```json
{
    "data": [
        { "type": "scene-axis", "enabled": false }
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

### Updated `AbstractSceneElement` constructor

Every element, including built-in ones, receives both a DOM container reference
and the THREE.js scene object. This makes the interface uniform — no element
needs special-casing to interact with the DOM or the scene.

`elementData: any` is removed from the base class entirely (see typed parsing
section below). Each concrete class stores its own fully-typed data fields:

```typescript
export abstract class AbstractSceneElement {
    readonly dim: number;
    readonly container: HTMLElement;   // DOM container for title, overlays, etc.
    readonly threeScene: THREE.Scene;  // for adding lights or other scene-level objects

    constructor(
        dim: number,
        container: HTMLElement,
        threeScene: THREE.Scene,
    ) { ... }
}
```

This is a breaking change to every element constructor — all existing element
classes and the `initSceneGraph` instantiation loop in `scene.ts` must be updated.

---

## Typed element data parsing

### Current problem

All element constructors currently accept `elementData: any` and call
`getRequired` or access properties directly throughout their implementation:

```typescript
// Scattered through SurfaceSagElement:
const diameter = getRequired<number>(this.elementData, "diameter");
const sagFunctionData = getRequired<any>(this.elementData, "sag-function");
const clipPlanes = this.elementData.clip_planes ?? [];
```

This spreads JSON parsing concerns throughout the element implementation, makes
it impossible to statically type element data, and duplicates error-prone
property access everywhere.

### Proposed solution: `static parse` + typed data interfaces

Each element defines a typed interface for its data and a static `parse` method
that handles all JSON access in one place. The concrete element class then works
entirely with typed fields — no `any`, no `getRequired` scattered around.

**Pattern:**

```typescript
// 1. Typed data interface (co-located with element)
interface SurfaceSagData {
    diameter: number;
    sagFunction: SagFunction;
    matrix: number[][];
    bcyl?: [number, number, number];
    clipPlanes?: [number, number, number, number][];
}

// 2. Static parse method — all JSON access in one place
export class SurfaceSagElement extends SurfaceBaseElement {

    static parse(raw: any): SurfaceSagData {
        return {
            diameter: getRequired<number>(raw, "diameter"),
            sagFunction: parseSagFunction(getRequired<any>(raw, "sag-function")),
            matrix: getRequired<number[][]>(raw, "matrix"),
            bcyl: raw.bcyl,
            clipPlanes: raw.clip_planes,
        };
    }

    // 3. Concrete class holds typed data only
    readonly data: SurfaceSagData;

    constructor(data: SurfaceSagData, dim: number, container: HTMLElement, scene: THREE.Scene) {
        super(dim, container, scene);
        this.data = data;
    }

    public makeGeometry2D() {
        // Fully typed — no getRequired, no any
        const { diameter, sagFunction, matrix } = this.data;
        ...
    }
}
```

### Shared base data for surface elements

Surface elements share common fields (`matrix`, `clipPlanes`). These are
handled by `SurfaceBaseElement`:

```typescript
// SurfaceBaseElement defines and parses the shared subset
interface SurfaceBaseData {
    matrix: number[][];
    clipPlanes?: [number, number, number, number][];
}

function parseSurfaceBaseData(raw: any): SurfaceBaseData {
    return {
        matrix: getRequired<number[][]>(raw, "matrix"),
        clipPlanes: raw.clip_planes,
    };
}
```

Concrete surface data interfaces extend it:

```typescript
interface SurfaceSagData extends SurfaceBaseData {
    diameter: number;
    sagFunction: SagFunction;
    bcyl?: [number, number, number];
}
```

### Instantiation loop in `scene.ts`

The `initSceneGraph` loop calls `parse` before constructing the element.
TypeScript doesn't support abstract static methods, so `parse` is accessed via
a type assertion. This is the one place in the codebase that touches untyped
JSON — everywhere else is fully typed:

```typescript
for (const type of matches) {
    const data = (type as any).parse(elementData);
    const instance = new type(data, dim, container, threeScene);
    const obj = instance.makeGroup();
    obj.userData = instance;
    this.sceneGraph.add(obj);
}
```

Any malformed JSON now throws at parse time, before the element is constructed,
with a clear error from `getRequired` pointing to the missing field.

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

Note: elements need access to their own group inside handlers. The simplest
approach is to store the group reference returned by `makeGroup()`:

```typescript
public group!: THREE.Group;

public makeGroup(): THREE.Group {
    this.group = new THREE.Group();
    // ... build geometry
    return this.group;
}
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

### Phase 1 — Typed element data (self-contained, no behaviour change)

1. Update `AbstractSceneElement` constructor to accept `container` and `threeScene`; remove `elementData: any` from the base class. Update the `initSceneGraph` instantiation loop in `scene.ts` to pass the new arguments.
2. Migrate one element end-to-end as a template: add the typed data interface, `static parse`, and update the constructor. Start with `RaysElement` (smallest, most self-contained). Verify `npm run build` passes.
3. Migrate remaining elements one by one: `SurfaceBaseElement` + its concrete subclasses (`SurfaceSagElement`, `SurfaceLatheElement`, `SurfaceSphereRElement`, `SurfacePlaneElement`), then `BcylElement`, `PointsElement`, `ArrowsElement`, `Box3DElement`.
4. Remove `getRequired` calls from element constructors/methods — all `getRequired` usage should now live exclusively in `static parse` methods.

### Phase 2 — Event system

5. Define `ViewerEvent` discriminated union in `src/viewerEvents.ts`.
6. Add `addEventListener` / `onEvent` to `AbstractSceneElement`.
7. Add `dispatch` to `TLMScene`; keep existing specific methods as one-line wrappers for now.
8. Migrate one element (`RaysElement`) to register handlers via `addEventListener` — verify nothing breaks.
9. Migrate remaining elements (`SurfaceBaseElement`, `BcylElement`).

### Phase 3 — Built-in elements

10. Create `SceneAxisElement`, `LightsElement`, `TitleElement`; wire up as built-ins in `TLMScene`. Remove the named properties (`opticalAxis`, `otherAxes`, `ambientLight`, etc.) from `TLMScene`.

### Phase 4 — GUI migration and public API

11. Migrate GUI to use `dispatch` exclusively; remove direct scene property access from `gui.ts`.
12. Expose `dispatch` in the public API via `ViewerHandle`; update `CHANGELOG.md` for the breaking return-type change.
13. Remove now-redundant specific methods from `TLMScene`.
