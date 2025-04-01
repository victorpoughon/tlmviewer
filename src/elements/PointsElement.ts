import * as THREE from "three";

import { get_required } from "../utility.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";

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

export class PointsElement extends AbstractSceneElement {
    constructor() {
        super();
    }

    public static match(elementData: any): boolean {
        const type = get_required(elementData, "type");
        return type === "points";
    }

    public loadJSON(elementData: any, dim: number): THREE.Group {
        const vertices = get_required(elementData, "data");
        const color = elementData.color ?? "#ffffff";

        const group = new THREE.Group();
        for (const point of vertices) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: color });
            material.transparent = true;
            material.opacity = 0.8;
            const sphere = new THREE.Mesh(geometry, material);

            if (point.length != dim) {
                throw new Error(
                    `point array length is ${point.length} (expected ${dim})`
                );
            }
            if (dim == 2) {
                sphere.position.set(point[0], point[1], 2.0);
            } else {
                sphere.position.set(point[0], point[1], point[2]);
            }

            group.add(sphere);
        }

        // Add layers
        applyLayerGroup(group, elementData["layers"] ?? [0]);

        return group;
    }
}
