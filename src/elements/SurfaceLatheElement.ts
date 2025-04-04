import * as THREE from "three";

import { get_required } from "../utility.ts";

import { SurfaceBaseElement, arrayToMatrix4 } from "./SurfaceBaseElement.ts";


export class SurfaceLatheElement extends SurfaceBaseElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    public static match(elementData: any): boolean {
        const type = get_required(elementData, "type");
        return type === "surface-lathe";
    }

    public makeSamples2D() : Array<Array<number>> {
        return get_required(this.elementData, "samples");
    }

    public makeGeometry3D(): [THREE.BufferGeometry, THREE.Matrix4, string | null] {
        const matrix = get_required(this.elementData, "matrix");
        const userTransform = arrayToMatrix4(matrix);
        const samples: Array<Array<number>> = get_required(this.elementData, "samples");

        const segments = 50;
        // threejs lathe surface makes a revolution around the Y axis
        // but we want a revolution around the X axis
        // So the procedure is:
        // 1. Swap X/Y coordinates (mirror about the X=Y line)
        // 2. Ask threejs to create the 3D geometry by lathe around the Y axis
        // 3. Swap back by mirroring around the X=Y plane
        // 4. Compose with the matrix4 in the data

        // Make the composed transform
        const flip = new THREE.Matrix4().fromArray([
            0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
        ]);

        const transform = new THREE.Matrix4();
        transform.multiplyMatrices(userTransform, flip);

        const tpoints = samples.map((p) => new THREE.Vector2(p[1], p[0]));

        const geometry = new THREE.LatheGeometry(tpoints, segments);

        return [geometry, transform, null];
    }
}
