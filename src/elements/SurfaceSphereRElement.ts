import * as THREE from "three";

import { get_required } from "../utility.ts";

import { LineGeometry } from "three/addons/lines/LineGeometry.js";

import {
    SurfaceBaseElement,
    arrayToMatrix4,
    homogeneousMatrix3to4,
    samples2DToPoints,
} from "./SurfaceBaseElement.ts";

// Angular sampling of an arc of circle parameterized by its radius
function sphereSamplesAngular(
    diameter: number,
    R: number,
    epsilon: number,
    N: number
): number[][] {
    const thetaMax = Math.asin(diameter / 2 / Math.abs(R));

    const start = -thetaMax * (1 - epsilon);
    const end = thetaMax * (1 - epsilon);

    const theta: number[] = [];
    const step = (end - start) / (N - 1);

    for (let i = 0; i < N; i++) {
        theta.push(start + i * step);
    }

    const X: number[] = theta.map((t) => Math.abs(R) * Math.cos(t) + R);
    const Y: number[] = theta.map((t) => Math.abs(R) * Math.sin(t));

    return X.map((x, index) => [x, Y[index]]);
}

export class SurfaceSphereRElement extends SurfaceBaseElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    public static match(elementData: any): boolean {
        const type = get_required(elementData, "type");
        return type === "surface-sphere-r";
    }

    public makeSamples2D(): Array<Array<number>> {
        const arc_radius = get_required(this.elementData, "R");
        const diameter = get_required(this.elementData, "diameter");

        // Make sure N is odd so that we get a point at exactly 0
        return sphereSamplesAngular(diameter, arc_radius, 0.0, 101);
    }

    public makeGeometry2D(): [
        LineGeometry, // geometry
        THREE.Matrix4, // transform
        string | null // optional vertex shader
    ] {
        const matrix4 = homogeneousMatrix3to4(
            get_required(this.elementData, "matrix")
        );
        const transform = arrayToMatrix4(matrix4);
        
        const samples = this.makeSamples2D();

        const points = samples2DToPoints(samples);

        const geometry = new LineGeometry();
        geometry.setPositions(points);

        return [geometry, transform, null];
    }

    public makeGeometry3D(): [
        THREE.BufferGeometry,
        THREE.Matrix4,
        string | null
    ] {
        const matrix = get_required(this.elementData, "matrix");
        const userTransform = arrayToMatrix4(matrix);
        const fullSamples: Array<Array<number>> = this.makeSamples2D();

        // Keep strictly positive sample because lathe rotates by 2π
        const samples = fullSamples.filter(([_, y]) => y >= 0);

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
