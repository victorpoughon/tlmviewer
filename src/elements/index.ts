import { AbstractSceneElement } from "./AbstractSceneElement.ts";
import { SurfaceBaseElement } from "./SurfaceBaseElement.ts";
import { ArrowsElement } from "./arrows/ArrowsElement.ts";
import { BcylElement } from "./bcyl/BcylElement.ts";
import { Box3DElement } from "./box3D/Box3DElement.ts";
import { PointsElement } from "./points/PointsElement.ts";
import { RaysElement } from "./rays/RaysElement.ts";
import type { ColorOption } from "./rays/RaysElement.ts";
import { SurfaceLatheElement } from "./surfaceLathe/SurfaceLatheElement.ts";
import { SurfacePlaneElement } from "./surfacePlane/SurfacePlaneElement.ts";
import { SurfaceSphereRElement } from "./surfaceSphereR/SurfaceSphereRElement.ts";
import { SurfaceSagElement } from "./surfaceSag/SurfaceSagElement.ts";

export {
    AbstractSceneElement,
    ArrowsElement,
    BcylElement,
    Box3DElement,
    ColorOption,
    PointsElement,
    RaysElement,
    SurfaceBaseElement,
    SurfaceLatheElement,
    SurfacePlaneElement,
    SurfaceSagElement,
    SurfaceSphereRElement,
};

const _allSceneElementTypes = [
    ArrowsElement,
    BcylElement,
    Box3DElement,
    PointsElement,
    RaysElement,
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
