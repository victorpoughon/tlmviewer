import * as THREE from "three";
import { BaseElementData, ElementDescriptor } from "../core/types.ts";
import { getRequired } from "../utility.ts";

export type PointsData = BaseElementData & {
    type: "points";
    vertices: number[][];
    color: string;
    radius: number;
    layers: number[];
};

function applyLayerGroup(obj: THREE.Object3D, layers: Array<number>) {
    obj.traverse((child) => {
        child.layers.disableAll();
    });
    obj.traverse((child) => {
        for (const layer of layers) {
            child.layers.enable(layer);
        }
    });
}

function parse(raw: any, _dim: number): PointsData {
    return {
        type: "points",
        vertices: getRequired<number[][]>(raw, "data"),
        color: raw.color ?? "#ffffff",
        radius: raw.radius ?? 0.1,
        layers: raw.layers ?? [0],
    };
}

function render(data: PointsData, _dim: number): THREE.Object3D {
    const { vertices, color, radius, layers } = data;

    const group = new THREE.Group();
    for (const point of vertices) {
        const geometry = new THREE.SphereGeometry(radius, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        material.transparent = true;
        material.opacity = 0.8;
        const sphere = new THREE.Mesh(geometry, material);

        const dim = point.length;
        if (dim == 2) {
            sphere.position.set(point[0], point[1], 2.0);
        } else {
            sphere.position.set(point[0], point[1], point[2]);
        }

        group.add(sphere);
    }

    applyLayerGroup(group, layers);

    return group;
}

const testData2D = [
    {
        type: "points",
        data: [
            [0, 0],
            [5, 2],
            [10, -1],
            [15, 3],
        ],
    },
];

const testData3D = [
    {
        type: "points",
        data: [
            [0, 0, 0],
            [5, 2, 1],
            [10, -1, 2],
            [15, 3, -1],
        ],
    },
];

export const pointsDescriptor: ElementDescriptor<PointsData> = {
    type: "points",
    includeInDefaultCamera: true,
    parse,
    render,
    testData2D,
    testData3D,
};
