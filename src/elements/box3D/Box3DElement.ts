import * as THREE from "three";

import { getRequired } from "../../utility.ts";

import { arrayToMatrix4 } from "../SurfaceBaseElement.ts";

import { AbstractSceneElement } from "../AbstractSceneElement.ts";

interface Box3DData {
    size: [number, number, number];
    matrix: number[][];
}

// A 3D only box
export class Box3DElement extends AbstractSceneElement {
    readonly data: Box3DData;

    static parse(raw: any): Box3DData {
        return {
            size: getRequired<[number, number, number]>(raw, "size"),
            matrix: getRequired<number[][]>(raw, "matrix"),
        };
    }

    constructor(
        data: Box3DData,
        dim: number,
        container: HTMLElement,
        threeScene: THREE.Scene,
    ) {
        super(dim, container, threeScene);
        this.data = data;
    }

    // True if the given scene element data object matches this class
    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type == "box3D";
    }

    public makeGroup(): THREE.Group {
        const { size } = this.data;

        const group = new THREE.Group();

        const geometry = new THREE.BoxGeometry(
            size[0],
            size[1],
            size[2],
            10,
            10,
            10,
        );
        const material = new THREE.MeshBasicMaterial({
            color: "lightgreen",
            transparent: true,
            opacity: 0.2,
            depthTest: false,
            depthWrite: false,
            wireframe: true,
        });
        const cube = new THREE.Mesh(geometry, material);
        group.add(cube);

        const userTransform = arrayToMatrix4(this.data.matrix);
        group.applyMatrix4(userTransform);

        return group;
    }

    public setVisible(group: THREE.Group, visible: boolean): void {
        group.visible = visible;
    }
}
