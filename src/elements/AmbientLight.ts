import * as THREE from "three";
import { ElementDescriptor } from "./types.ts";
import { getRequired } from "../utility.ts";

export type AmbientLightData = {
    type: "ambient-light";
    color: string;
    intensity: number;
};

function parse(raw: any): AmbientLightData {
    return {
        type: "ambient-light",
        color: getRequired<string>(raw, "color"),
        intensity: getRequired<number>(raw, "intensity"),
    };
}

function render(data: AmbientLightData): THREE.Object3D {
    const group = new THREE.Group();
    group.add(new THREE.AmbientLight(data.color, data.intensity));
    return group;
}

export const ambientLightDescriptor: ElementDescriptor<AmbientLightData> = {
    type: "ambient-light",
    parse,
    render,
};
