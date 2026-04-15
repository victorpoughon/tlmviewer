import * as THREE from "three";

import { LineGeometry } from "three/addons/lines/LineGeometry.js";

import { ElementDescriptor } from "../core/types.ts";
import { samples2DToPoints } from "../core/geometry.ts";
import { getRequired } from "../utility.ts";

import {
    SurfaceBaseData,
    parseSurfaceBaseData,
    makeSurfaceRender,
    defaultSurfaceEvents,
} from "./surface_utils.ts";

export type SurfacePlaneData = SurfaceBaseData & {
    type: "surface-plane";
    radius: number;
};

function parse(raw: any, _dim: number): SurfacePlaneData {
    return {
        ...parseSurfaceBaseData(raw),
        type: "surface-plane",
        radius: getRequired<number>(raw, "radius"),
    };
}

function makeGeometry2D(
    data: SurfacePlaneData,
    tf: THREE.Matrix4,
): [LineGeometry, THREE.Matrix4] {
    const { radius } = data;
    const geometry = new LineGeometry();
    geometry.setPositions(
        samples2DToPoints([
            [0, -radius],
            [0, radius],
        ]),
    );
    return [geometry, tf];
}

function makeGeometry3D(
    data: SurfacePlaneData,
    tf: THREE.Matrix4,
): [THREE.BufferGeometry, THREE.Matrix4, string | null] {
    const base = new THREE.Matrix4().makeRotationY(Math.PI / 2);
    const transform = new THREE.Matrix4().multiplyMatrices(tf, base);
    return [new THREE.RingGeometry(0, data.radius, 128, 8), transform, null];
}

const testData2D = [
    {
        type: "surface-plane",
        radius: 5,
        matrix: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ],
    },
    {
        type: "surface-plane",
        radius: 5,
        matrix: [
            [0.866, -0.5, 15],
            [0.5, 0.866, 0],
            [0, 0, 1],
        ],
    },
];

const testData3D = [
    {
        type: "surface-plane",
        radius: 5,
        matrix: [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
    {
        type: "surface-plane",
        radius: 5,
        clip_planes: [
            [0, -1, 0, 4],
            [0, 1, 0, 4],
            [0, 0, -1, 4],
            [0, 0, 1, 4],
        ],
        matrix: [
            [1, 0, 0, 15],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    },
];

export const surfacePlaneDescriptor: ElementDescriptor<SurfacePlaneData> = {
    type: "surface-plane",
    includeInDefaultCamera: true,
    parse,
    render: makeSurfaceRender(makeGeometry2D, makeGeometry3D),
    events: defaultSurfaceEvents(),
    testData2D,
    testData3D,
};
