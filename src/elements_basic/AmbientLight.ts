import * as THREE from "three";
import { BaseElementData, ElementDescriptor } from "../core/types.ts";
import { getRequired } from "../core/utility.ts";

export type AmbientLightData = BaseElementData & {
    type: "ambient-light";
    color: string;
    intensity: number;
};

function parse(raw: any, _dim: number): AmbientLightData {
    return {
        type: "ambient-light",
        color: getRequired<string>(raw, "color"),
        intensity: getRequired<number>(raw, "intensity"),
    };
}

function render(data: AmbientLightData, _dim: number): THREE.Object3D {
    const group = new THREE.Group();
    group.add(new THREE.AmbientLight(data.color, data.intensity));
    return group;
}

const testData: any[] = [
    {
        type: "ambient-light",
        color: "#ffffff",
        intensity: 0.5,
    },
];

export const ambientLightDescriptor: ElementDescriptor<AmbientLightData> = {
    type: "ambient-light",
    includeInDefaultCamera: false,
    parse,
    render,
    testData2D: testData,
    testData3D: testData,
};
