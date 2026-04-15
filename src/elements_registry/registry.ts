import { ElementDescriptor } from "../core/types.ts";

import {
    ambientLightDescriptor,
    AmbientLightData,
} from "../elements_basic/AmbientLight.ts";
import {
    directionalLightDescriptor,
    DirectionalLightData,
} from "../elements_basic/DirectionalLight.ts";
import {
    sceneAxisDescriptor,
    SceneAxisData,
} from "../elements_basic/SceneAxis.ts";
import {
    arrowsDescriptor,
    ArrowsData,
} from "../elements_basic/ArrowsElement.ts";
import { box3DDescriptor, Box3DData } from "../elements_basic/Box3D.ts";
import {
    pointsDescriptor,
    PointsData,
} from "../elements_basic/PointsElement.ts";
import {
    cylinderDescriptor,
    CylinderData,
} from "../elements_basic/Cylinder.ts";

// Union of all scene elements data types
export type SceneElementData =
    | AmbientLightData
    | DirectionalLightData
    | SceneAxisData
    | ArrowsData
    | Box3DData
    | PointsData
    | CylinderData;

// List of all scene elements descriptors
export const allDescriptors = [
    ambientLightDescriptor,
    directionalLightDescriptor,
    sceneAxisDescriptor,
    arrowsDescriptor,
    box3DDescriptor,
    pointsDescriptor,
    cylinderDescriptor,
] as const;

const descriptorMap = new Map<string, ElementDescriptor<any>>(
    allDescriptors.map((d) => [d.type, d]),
);

export function getDescriptor(type: string): ElementDescriptor<any> {
    const desc = descriptorMap.get(type);
    if (!desc) throw new Error(`Unknown element type: "${type}"`);
    return desc;
}

export function getMaybeDescriptor(
    type: string,
): ElementDescriptor<any> | undefined {
    const desc = descriptorMap.get(type);
    return desc;
}
