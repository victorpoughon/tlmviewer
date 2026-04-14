import * as THREE from "three";

import { getRequired } from "../../utility.ts";

import { AbstractSceneElement } from "../AbstractSceneElement.ts";

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

interface PointsData {
    vertices: number[][];
    color: string;
    radius: number;
    layers: number[];
}

export class PointsElement extends AbstractSceneElement {
    readonly data: PointsData;

    static parse(raw: any): PointsData {
        return {
            vertices: getRequired<number[][]>(raw, "data"),
            color: raw.color ?? "#ffffff",
            radius: raw.radius ?? 0.1,
            layers: raw.layers ?? [0],
        };
    }

    constructor(
        data: PointsData,
        dim: number,
        container: HTMLElement,
        threeScene: THREE.Scene,
    ) {
        super(dim, container, threeScene);
        this.data = data;
        this.group = this.makeGroup();
    }

    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "points";
    }

    protected makeGroup(): THREE.Group {
        const { vertices, color, radius, layers } = this.data;

        const group = new THREE.Group();
        for (const point of vertices) {
            const geometry = new THREE.SphereGeometry(radius, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: color });
            material.transparent = true;
            material.opacity = 0.8;
            const sphere = new THREE.Mesh(geometry, material);

            if (point.length != this.dim) {
                throw new Error(
                    `point array length is ${point.length} (expected ${this.dim})`,
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
        applyLayerGroup(group, layers);

        return group;
    }
}
