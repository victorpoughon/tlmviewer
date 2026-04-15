import { AbstractSceneElement } from "./AbstractSceneElement.ts";
import { SurfaceBaseElement } from "./SurfaceBaseElement.ts";
import type { ColorOption } from "../core/events.ts";
import { SurfaceLatheElement } from "./surfaceLathe/SurfaceLatheElement.ts";
import { SurfacePlaneElement } from "./surfacePlane/SurfacePlaneElement.ts";
import { SurfaceSphereRElement } from "./surfaceSphereR/SurfaceSphereRElement.ts";
import { SurfaceSagElement } from "./surfaceSag/SurfaceSagElement.ts";

export {
    AbstractSceneElement,
    ColorOption,
    SurfaceBaseElement,
    SurfaceLatheElement,
    SurfacePlaneElement,
    SurfaceSagElement,
    SurfaceSphereRElement,
};

const _allSceneElementTypes = [
    SurfaceLatheElement,
    SurfacePlaneElement,
    SurfaceSagElement,
    SurfaceSphereRElement,
];

// Return the list of matching element types for a given json object
export function matchingElementTypes(elementData: any) {
    const matches = [];
    for (const type of _allSceneElementTypes) {
        if (type.match(elementData)) {
            matches.push(type);
        }
    }
    return matches;
}
