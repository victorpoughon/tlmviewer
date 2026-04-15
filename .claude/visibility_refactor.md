# Visibility Refactor Plan

## Problem

Element visibility is currently controlled through three unrelated mechanisms:

1. **`object.visible = bool`** — used by surfaces (`setSurfacesVisible`), axes (`setAxisVisible`), and cylinders (`setBcylVisible`). Each has its own hardcoded event type.
2. **Camera layers** — used by points and kinematic joints. Elements assign themselves to numbered THREE.js layers, and the GUI toggles layer visibility on the camera. This is a rendering-level filter, not a scene-level one.
3. **Rays `ColorOption.show` flag** — rays "hide" by rebuilding their geometry as an empty group when `show == false`. Visibility is entangled with color selection.

### Why this is a problem

- Adding a new element type that needs toggling requires inventing a new event (`setFooVisible`), adding it to `SceneEventMap`, wiring up a GUI controller, and choosing which mechanism to use.
- The GUI hardcodes visibility controllers for each element category. The "Visible" folder can't be built generically.
- The camera-layers mechanism couples the GUI to the app's camera object (`app.camera.layers.enable`), which will get worse after the camera refactor.

## Goals

1. **Single mechanism**: all element visibility goes through `object.visible` on the element's root `Object3D`.
2. **Generic visibility event**: one event type that can target any element category, replacing the per-type events.
3. **Decouple rays visibility from color**: rays `show` flag is removed from `ColorOption` and handled by the generic visibility mechanism instead.

## Design

### Categories as a required list of semantic tags

Every element has a `categories: string[]` list — a required, non-optional field on `BaseElementData`. The list can be empty (element is always visible, unaffected by `setVisibility`).

```ts
export type BaseElementData = {
    type: string;
    categories: string[];
};
```

There is no `defaultCategory` on `ElementDescriptor` — each element's `parse` function is responsible for building the categories list. This keeps things explicit and self-contained: each element decides what categories it belongs to, and whether the data can override them.

```ts
export type ElementDescriptor<T extends BaseElementData> = {
    type: T["type"];
    includeInDefaultCamera: boolean;
    parse: (raw: unknown, dim: number) => T;
    render: (data: T, dim: number) => THREE.Object3D;
    initHTML?: (data: T, dim: number, container: Element) => void;
    events?: ElementEventRecord<T>;
    testData2D: any[];
    testData3D: any[];
};
```

### How each element handles categories

Each `parse` function decides its own policy:

- **Surfaces**: always `["surface"]`, not overridable.
- **Axes**: computed from data, e.g. `["axis-x"]`, not overridable.
- **Cylinders**: always `["cylinder"]`, not overridable.
- **Points**: taken from data (`raw.categories ?? []`), fully data-driven.
- **Rays**: taken from data (`raw.categories ?? []`), fully data-driven. Replaces the current `layers` field for semantic grouping.
- **Lights, scene-title**: empty `[]`, always visible.

### Multiple categories

An element can belong to multiple categories. For example a surface element could be `["surface", "lens-1"]`, allowing toggling all surfaces at once or toggling individual lenses. A `setVisibility` event matches if the element's categories list includes the target category.

### New generic event: `setVisibility`

Replace `setSurfacesVisible`, `setAxisVisible`, `setBcylVisible` with:

```ts
setVisibility: { category: string; visible: boolean };
```

When dispatched, elements whose `categories` list includes the target category set `object.visible` accordingly.

Categories (initial set):
- `"surface"` — all surface types
- `"axis-x"`, `"axis-y"`, `"axis-z"` — individual axes
- `"cylinder"` — bounding cylinders
- `"rays-valid"`, `"rays-blocked"`, `"rays-output"` — ray groups (from data)
- `"kinematic-joint"` — kinematic joint points (from data)

### Handle `setVisibility` centrally in `TLMScene.dispatch`

Instead of each element implementing its own visibility handler in `events`, the dispatch loop handles it:

```ts
if (event.type === "setVisibility") {
    this.sceneGraph.traverse((child) => {
        if (child.userData instanceof SceneEntry) {
            if (child.userData.data.categories.includes(event.category)) {
                child.visible = event.visible;
            }
        }
    });
    return;
}
```

This keeps visibility logic out of individual element descriptors entirely.

## Step-by-step plan

### Step 1: Add `categories` to `BaseElementData`

Change `BaseElementData` in `types.ts` to include the required `categories: string[]` field. No changes to `ElementDescriptor`.

### Step 2: Update all `parse` functions to populate `categories`

Every element's `parse` function must return a `categories` list. This touches all elements:

| Element | `categories` value |
|---|---|
| `SceneAxis` | `["axis-" + axis]` (computed from parsed `axis` field) |
| `Cylinder` | `["cylinder"]` |
| All surfaces (`SurfacePlane`, `SurfaceLathe`, `SurfaceSphereR`, `SurfaceSag`) | `["surface"]` |
| `Rays` | `raw.categories ?? []` (data-driven) |
| `Points` | `raw.categories ?? []` (data-driven) |
| `AmbientLight` | `[]` |
| `DirectionalLight` | `[]` |
| `SceneTitle` | `[]` |

Also update all `testData2D` / `testData3D` entries to include `categories` where needed.

### Step 3: Add `setVisibility` event, handle centrally in `TLMScene`

- Add `setVisibility: { category: string; visible: boolean }` to `SceneEventMap`.
- Handle it in `TLMScene.dispatch` as described above.

### Step 4: Remove old per-type visibility events

- Remove `setSurfacesVisible`, `setAxisVisible`, `setBcylVisible` from `SceneEventMap`.
- Remove the corresponding handlers from surface events, `SceneAxis`, and `Cylinder`.
- Axes no longer render with `group.visible = false` — instead, their initial visibility is controlled by dispatching `setVisibility` during GUI init.

### Step 5: Decouple rays visibility from `ColorOption`

- Remove `show` from `ColorOption` type. It becomes purely about color.
- Remove the `hide` option from the GUI's color dropdown.
- Rays visibility is now controlled by `setVisibility` with category `"rays-valid"` etc.
- The `makeRays` early return on `show == false` is removed.
- Rays still rebuild geometry on color change events, but no longer treat "hidden" as a color option.

### Step 6: Remove camera layers for visibility

- Remove `applyLayerGroup` from `PointsElement.ts`.
- Remove `layers` field from `PointsData`.
- Remove `layers` field from `RaysData` (replaced by `categories`).
- Remove `updateCameraLayers` from `TLMGui` and all `camera.layers.*` calls.
- Points that were kinematic joints now get `"categories": ["kinematic-joint"]` in the data and start hidden via initial `setVisibility` dispatch.

### Step 7: Update GUI

The "Visible" folder dispatches `setVisibility` events:

```ts
folderShow.add(controller, "showSurfaces").onChange((v: boolean) => {
    scene.dispatch({ type: "setVisibility", category: "surface", visible: v });
});
```

Same GUI controls, different underlying event type.

## Breaking changes

- **Scene data format**: `categories` is a new required concept. Elements that need toggling (points, rays) must provide `"categories": [...]` in their data. Document in `CHANGELOG.md`.
- **Scene data format**: `layers` field removed from `points` and `rays` elements, replaced by `categories`. Document in `CHANGELOG.md`.
- **`ColorOption.show` removal**: the `"hide"` color option disappears from the GUI dropdown. Users who set `"blocked_rays": "hide"` in controls JSON will need to use a visibility control instead. Document in `CHANGELOG.md`.

## Order of operations

Steps 1–3 can land first as a purely additive change (new mechanism exists alongside old). Steps 4–6 are the breaking removal of old mechanisms. Step 7 can be interleaved with 4–6 since the GUI needs updating as old events are removed.
