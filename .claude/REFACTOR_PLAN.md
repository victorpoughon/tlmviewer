# Plan: Code Structure Refactoring — tlmviewer

## Context

The user wants targeted, high-value refactors to improve code organization so that adding new scene elements and rendering modes is easier. This plan identifies four concrete "quick wins" that address real structural issues without over-engineering. The codebase is ~3,000 lines of TypeScript, well-structured overall, but with a few specific pain points.

---

## Prioritized Refactors

### ~~1. Move line utilities out of `RaysElement.ts` → `src/lineUtils.ts`~~ ✓ Done

---

### 2. Extract lathe-flip transform into `SurfaceBaseElement`

**Problem:** `SurfaceLatheElement.makeGeometry3D()` and `SurfaceSphereRElement.makeGeometry3D()` contain *identical* code for the axis-flip matrix and transform composition. The comments are even copy-pasted. Any future lathe-based surface must reproduce this boilerplate.

Duplicated code (identical in both files):
```typescript
const flip = new THREE.Matrix4().fromArray([0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const transform = new THREE.Matrix4();
transform.multiplyMatrices(userTransform, flip);
```

**Change:**
- Add `protected makeLatheTransform(userTransform: THREE.Matrix4): THREE.Matrix4` to `SurfaceBaseElement`
- Replace the duplicated blocks in `SurfaceLatheElement` and `SurfaceSphereRElement` with a call to this method

**Files:** `src/elements/SurfaceBaseElement.ts`, `src/elements/SurfaceLatheElement.ts`, `src/elements/SurfaceSphereRElement.ts`

---

### 3. Fix type bug in `scene.ts` — `setSurfacesVisible`

**Problem:** `setSurfacesVisible` in `scene.ts` calls `updateElements(SurfaceBaseElement, ...)` but the callback types the element as `BcylElement` instead of `SurfaceBaseElement`. This is a real (silent) type error that TypeScript's strict mode should catch.

Current (wrong) code at `src/scene.ts:210-216`:
```typescript
public setSurfacesVisible(visible: boolean) : void {
    this.updateElements(
        SurfaceBaseElement,
        (group: THREE.Group, element: BcylElement) => {  // ← wrong type
            element.setVisible(group, visible);
        }
    );
}
```

**Change:** Fix the callback type to `SurfaceBaseElement`.

**Files:** `src/scene.ts`

---

### 4. Remove WIP files

**Problem:** `WIPVertexShaderElement.ts` and `WIPXYElement.ts` are dead code — they're not registered in `matchingElementTypes()` in `scene.ts`, so they are never instantiated. They clutter the `elements/` directory and create confusion for anyone exploring the codebase to add a new element.

**Change:** Delete both files. The concepts they explore (`SurfaceSagElement` already handles custom vertex shaders; XY polynomial sag already exists as `XYPolynomialSag` within `SurfaceSagElement.ts`).

**Files:** Delete `src/elements/WIPVertexShaderElement.ts`, `src/elements/WIPXYElement.ts`

---

### 5. Self-contained test scenes as TypeScript builders

See [REFACTOR_TEST_SCENES.md](./REFACTOR_TEST_SCENES.md) for the full plan.

---

## Verification

1. Run `npm run build` — TypeScript compilation must pass with zero errors
2. Run `npm run dev` and load the test scene manifest to confirm scenes still render correctly
3. Visually confirm 2D and 3D rendering modes still work for surface elements

## Out of Scope

- Typing `elementData: any` throughout — valuable but a large cross-cutting change best done separately
- GUI refactoring — current structure is repetitive but functional; no pressing pain point
- `matchingElementTypes` multiple-match handling — intended flexibility, not a bug
