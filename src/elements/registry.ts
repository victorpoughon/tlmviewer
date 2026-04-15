import { ElementDescriptor } from "./types.ts";

import {
    ambientLightDescriptor,
    AmbientLightData,
} from "../elements/AmbientLight.ts";
import {
    directionalLightDescriptor,
    DirectionalLightData,
} from "../elements/DirectionalLight.ts";
import {
    sceneAxisDescriptor,
    SceneAxisData,
} from "../elements/SceneAxis.ts";

// Union of all scene elements data types
export type SceneElementData =
    | AmbientLightData
    | DirectionalLightData
    | SceneAxisData;

// List of all scene elements descriptors
export const allDescriptors = [
    ambientLightDescriptor,
    directionalLightDescriptor,
    sceneAxisDescriptor,
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
