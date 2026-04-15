# Camera Refactor Plan

Extract camera/controls pairs from `app.ts` into standalone files behind an abstract interface in `src/cameras/`.

## 1. Define `CameraRig` interface — `src/cameras/CameraRig.ts` (new)

```ts
interface CameraRig {
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    controls: OrbitControls;

    // Fit the camera to a bounding box (replaces resetView logic)
    fitToBox(bbox: THREE.Box3, viewportAspect: number): void;

    // Handle viewport resize
    onResize(width: number, height: number): void;

    // Cleanup
    dispose(): void;
}
```

- `fitToBox` absorbs the camera-type-specific frustum math currently in `resetView`.
- `onResize` replaces the branching `onWindowResize` method.
- `dispose` calls `controls.dispose()`.

## 2. One file per camera rig (new files)

- `src/cameras/XYCamera.ts` — 2D locked camera (no rotation, pan-only). Extracted from `setupXYCamera`.
- `src/cameras/OrthographicCamera.ts` — 3D orthographic with free orbit. Extracted from `setupOrthographicCamera`.
- `src/cameras/PerspectiveCamera.ts` — perspective with free orbit. Extracted from `setupPerspectiveCamera`.

Each file exports a factory function (e.g. `createXYCamera(viewport, renderer)`) returning a `CameraRig`.

## 3. Add `setCamera` event — `src/core/events.ts` (edit)

Add to `SceneEventMap`:

```ts
setCamera: { value: string };  // "XY", "orthographic", "perspective"
```

Defined now so the GUI has a typed key and future camera-aware elements can subscribe.

## 4. Refactor `TLMViewerApp` — `src/app.ts` (edit)

- Remove `setupXYCamera`, `setupOrthographicCamera`, `setupPerspectiveCamera` private methods.
- Remove `onWindowResize`.
- Replace `camera` and `controls` fields with `rig: CameraRig`.
- Add `setCamera(type: string)` method that:
  1. Calls `this.rig.dispose()` (if existing)
  2. Creates new rig via factory lookup
  3. Assigns `this.rig`
  4. Calls `this.rig.fitToBox(...)` to fit the view
- `resetView` delegates to `this.rig.fitToBox(this.scene.getBB(), aspect)`.
- `animate` uses `this.rig.controls.update()` and `this.rig.camera`.
- Constructor calls `setCamera(cameraType)` instead of the switch block.

## 5. Update `TLMGui` — `src/gui.ts` (edit)

- "Reset Camera" button continues calling `app.resetView()`.
- Camera selector dropdown can be added later using `setCamera`.

## 6. Update `src/main.ts` (edit)

- Resize handler: `app.onWindowResize()` → `app.rig.onResize(width, height)`.

## File summary

| File | Action |
|---|---|
| `src/cameras/CameraRig.ts` | New — interface |
| `src/cameras/XYCamera.ts` | New — from `setupXYCamera` + XY `fitToBox` |
| `src/cameras/OrthographicCamera.ts` | New — from `setupOrthographicCamera` + ortho `fitToBox` |
| `src/cameras/PerspectiveCamera.ts` | New — from `setupPerspectiveCamera` + perspective `fitToBox` |
| `src/core/events.ts` | Edit — add `setCamera` |
| `src/app.ts` | Edit — replace camera fields/methods with `rig` |
| `src/gui.ts` | Edit — `app.camera` → `app.rig.camera` |
| `src/main.ts` | Edit — resize handler |

## What stays the same

- Scene data format unchanged (camera type remains a top-level field, not an element).
- `CameraRig` is owned by the app, not a scene element.
- Animation loop structure unchanged, just references `rig`.
