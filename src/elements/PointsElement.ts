import * as THREE from "three";

import { getRequired } from "../utility.ts";

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
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "points";
    }

    public makeGroup(): THREE.Group {
        const vertices = getRequired<number[][]>(this.elementData, "data");
        const color = this.elementData.color ?? "#ffffff";
        const radius = this.elementData.radius ?? 0.1;

        const group = new THREE.Group();
        for (const point of vertices) {
            const geometry = new THREE.SphereGeometry(radius, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: color });
            material.transparent = true;
            material.opacity = 0.8;
            const sphere = new THREE.Mesh(geometry, material);

            if (point.length != this.dim) {
                throw new Error(
                    `point array length is ${point.length} (expected ${this.dim})`
                );
            }
            if (this.dim == 2) {
                sphere.position.set(point[0], point[1], 2.0);
            } else {
                sphere.position.set(point[0], point[1], point[2]);
            }

            group.add(sphere);
        }

        // Add layers
        applyLayerGroup(group, this.elementData["layers"] ?? [0]);

        return group;
    }
}
