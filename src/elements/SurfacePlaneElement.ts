import * as THREE from "three";

import { getRequired } from "../utility.ts";

import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import {
    SurfaceBaseElement,
    samples2DToPoints,
} from "./SurfaceBaseElement.ts";

export class SurfacePlaneElement extends SurfaceBaseElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "surface-plane";
    }

    public makeGeometry2D(): [LineGeometry, THREE.Matrix4] {

        const radius = getRequired<number>(this.elementData, "radius");
        const samples = [
            [0, -radius],
            [0, radius],
        ];

        const points = samples2DToPoints(samples);

        const geometry = new LineGeometry();
        geometry.setPositions(points);

        return [geometry, this.getTransform2D()];
    }

    public makeGeometry3D(): [
        THREE.BufferGeometry,
        THREE.Matrix4,
        string | null
    ] {
        const userTransform = this.getTransform3D();

        // Make the composed transform
        const base = new THREE.Matrix4().makeRotationY(Math.PI / 2);

        const transform = new THREE.Matrix4();
        transform.multiplyMatrices(userTransform, base);

        const radius = getRequired<number>(this.elementData, "radius");
        const geometry = new THREE.RingGeometry(0, radius, 128, 8);

        return [geometry, transform, null];
    }
}
