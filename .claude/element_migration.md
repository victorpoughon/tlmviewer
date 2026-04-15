# Element Migration Guide

Migrate old class-based elements (extending `AbstractSceneElement`) to the new functional descriptor pattern.

## Reference files

- New elements examples: `src/elements/SceneAxis.ts`, `src/elements/DirectionalLight.ts`
- Descriptor type: `src/elements/types.ts` (`ElementDescriptor<T>`)
- New registry: `src/elements/registry.ts`
- Old registry: `src/elements/index.ts`

## Steps

### 1. Create `src/elements/basics/<ElementName>.ts`

The file exports a data type and a descriptor. Structure:

Key differences from the old class:
- The data type must include a `type` field with a **string literal type** (not just `string`).
- `parse` takes `(raw: any, _dim: number)` instead of just `(raw: any)`.
- `render` is a standalone function taking the data, replacing the `makeGroup()` method.
- The old `static match()` method is gone; matching is handled by the `type` field in the descriptor.
- The old constructor parameters (`dim`, `container`, `threeScene`) are not passed to `render` (yet).

### 2. Register in `src/elements/registry.ts`

- Import the data type and descriptor.
- Add the data type to the `SceneElementData` union.
- Add the descriptor to the `allDescriptors` array.

### 3. Remove from old registry `src/elements/index.ts`

- Remove the import of the old class.
- Remove it from the `export {}` block.
- Remove it from `_allSceneElementTypes`.
- Remove it from `src/elements/testScenes.ts` legacy scenes.

### 4. Delete the old file

Delete the old class file (e.g. `src/elements/lights/DirectionalLight.ts`).
