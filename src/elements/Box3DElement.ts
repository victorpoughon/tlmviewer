import * as THREE from "three";

import { getRequired } from "../utility.ts";

import { arrayToMatrix4 } from "./SurfaceBaseElement.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";

// A 3D only box
export class Box3DElement extends AbstractSceneElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    // True if the given scene element data object matches this class
    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type == "box3D";
    }

    // Get the Matrix4 tranform from the element data
    // Expecting a 2D transform
    public getTransform2D(): THREE.Matrix4 {
        throw Error("Box3D element only works in 3D scenes");
    }

    // Get the Matrix4 tranform from the element data
    // Expecting a 3D transform
    public getTransform3D(): THREE.Matrix4 {
        const matrix4 = getRequired<number[][]>(this.elementData, "matrix");
        // TODO more error checking on matrix4 array shape here
        return arrayToMatrix4(matrix4);
    }

    public makeGroup(): THREE.Group {
        const size = getRequired<number[]>(this.elementData, "size");

        const group = new THREE.Group();

        const geometry = new THREE.BoxGeometry(size[0], size[1], size[2], 10, 10, 10);
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

        const userTransform = this.getTransform3D();
        group.applyMatrix4(userTransform);

        return group;
    }

    public setVisible(group: THREE.Group, visible: boolean): void {
        group.visible = visible;
    }
}
