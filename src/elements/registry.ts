import { ElementDescriptor } from "./types.ts";

import {
    ambientLightDescriptor,
    AmbientLightData,
} from "./basics/AmbientLight.ts";
import {
    directionalLightDescriptor,
    DirectionalLightData,
} from "./basics/DirectionalLight.ts";
import { sceneAxisDescriptor, SceneAxisData } from "./basics/SceneAxis.ts";
import { arrowsDescriptor, ArrowsData } from "./basics/ArrowsElement.ts";

// Union of all scene elements data types
export type SceneElementData =
    | AmbientLightData
    | DirectionalLightData
    | SceneAxisData
    | ArrowsData;

// List of all scene elements descriptors
export const allDescriptors = [
    ambientLightDescriptor,
    directionalLightDescriptor,
    sceneAxisDescriptor,
    arrowsDescriptor,
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
