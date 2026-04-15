import * as THREE from "three";
import { ElementDescriptor } from "./types.ts";
import { getOption, getRequired } from "../utility.ts";
import { makeLine2 } from "../lineUtils.ts";

export type SceneAxisData = {
    type: "scene-axis";
    axis: "x" | "y" | "z";
    length: number;
    color: string;
};

function parse(raw: any, _dim: number): SceneAxisData {
    return {
        type: "scene-axis",
        axis: getOption(raw, "axis", ["x", "y", "z"]),
        length: getRequired<number>(raw, "length"),
        color: raw["color"] ?? "#e3e3e3",
    };
}

function render(data: SceneAxisData): THREE.Object3D {
    const group = new THREE.Group();

    const { axis, length, color } = data;

    if (axis == "x") {
        group.add(makeLine2([-length, 0, 0], [length, 0, 0], color));
    } else if (axis == "y") {
        group.add(makeLine2([0, -length, 0], [0, length, 0], color));
    } else if (axis == "z") {
        group.add(makeLine2([0, 0, -length], [0, 0, length], color));
    }

    group.visible = false;

    return group;
}

const testData: SceneAxisData[] = [
    {
        type: "scene-axis",
        axis: "x",
        length: 10,
        color: "#e3e3e3",
    },
];

export const sceneAxisDescriptor: ElementDescriptor<SceneAxisData> = {
    type: "scene-axis",
    parse,
    render,
    events: {
        setAxisVisible: (data, object, event) => {
            if (event.axis == data.axis) {
                object.visible = event.visible;
            }
        },
    },
    testData2D: testData,
    testData3D: testData,
};
