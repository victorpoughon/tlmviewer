# Element Migration Guide

Migrate old class-based elements (extending `AbstractSceneElement`) to the new functional descriptor pattern.

## Reference files

- New element example: `src/elements/AmbientLight.ts`, `src/elements/DirectionalLight.ts`
- Descriptor type: `src/elements/types.ts` (`ElementDescriptor<T>`)
- New registry: `src/elements/registry.ts`
- Old registry: `src/elements/index.ts`

## Steps

### 1. Create `src/elements/<ElementName>.ts`

The file exports a data type and a descriptor. Structure:

```ts
import * as THREE from "three";
import { ElementDescriptor } from "./types.ts";
import { getRequired } from "../utility.ts";

export type FooData = {
    type: "foo";          // must be a string literal matching the element type
    // ... fields from the old interface
};

function parse(raw: any, _dim: number): FooData {
    return {
        type: "foo",
        // use getRequired() for each field, same as the old static parse()
    };
}

function render(data: FooData): THREE.Object3D {
    // move logic from the old makeGroup() method
    const group = new THREE.Group();
    // ... build three.js objects from data ...
    return group;
}

const testData: FooData[] = [
    {
        type: "foo",
        // representative test values
    },
];

export const fooDescriptor: ElementDescriptor<FooData> = {
    type: "foo",
    parse,
    render,
    testData2D: testData,
    testData3D: testData,  // use separate arrays if 2D/3D data differs
};
```

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

### 4. Delete the old file

Delete the old class file (e.g. `src/elements/lights/DirectionalLight.ts`).

### 5. Run tests

```
npm run test
```

The generic test in `src/elements/tests/testElements.test.ts` automatically picks up all descriptors from the registry, so no test changes are needed. Verify the new element appears in the test output.

## Event handlers

If the old element has interactive behavior (responds to mouse events, animations, etc.), add an `events` record to the descriptor. See `ElementEventRecord<T>` in `src/elements/types.ts`.

## Checklist

- [ ] New file `src/elements/<ElementName>.ts` with data type, parse, render, testData, and descriptor
- [ ] Added to `src/elements/registry.ts` (import, union type, allDescriptors)
- [ ] Removed from `src/elements/index.ts` (import, export, _allSceneElementTypes)
- [ ] Old class file deleted
- [ ] `npm run test && npm run build` passes
