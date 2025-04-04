import * as THREE from "three";

import { get_required } from "../utility.ts";

import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import {
    SurfaceBaseElement,
    arrayToMatrix4,
    homogeneousMatrix3to4,
    samples2DToPoints,
} from "./SurfaceBaseElement.ts";

export class SurfacePlaneElement extends SurfaceBaseElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    public static match(elementData: any): boolean {
        const type = get_required(elementData, "type");
        return type === "surface-plane";
    }

    public makeGeometry2D(): [
            LineGeometry,
            THREE.Matrix4,
            string | null
        ] {
        const matrix4 = homogeneousMatrix3to4(
                    get_required(this.elementData, "matrix")
                );
                const transform = arrayToMatrix4(matrix4);

        const radius = get_required(this.elementData, "radius");
        const samples = [
            [0, -radius],
            [0, radius],
        ];

        const points = samples2DToPoints(samples);
        
        const geometry = new LineGeometry();
        geometry.setPositions(points);

        return [geometry, transform, null]
    }

    public makeGeometry3D(): [THREE.BufferGeometry, THREE.Matrix4, string | null] {
        const matrix = get_required(this.elementData, "matrix");
        const userTransform = arrayToMatrix4(matrix);

        // Make the composed transform
        const base = new THREE.Matrix4().makeRotationY(Math.PI / 2);

        const transform = new THREE.Matrix4();
        transform.multiplyMatrices(userTransform, base);

        const radius = get_required(this.elementData, "radius");
        const geometry = new THREE.RingGeometry(0, radius, 128, 8);

        return [geometry, transform, null];
    }
}
