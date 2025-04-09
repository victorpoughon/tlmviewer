import * as THREE from "three";

import { getRequired } from "../utility.ts";

import { LineGeometry } from "three/addons/lines/LineGeometry.js";

import {
    SurfaceBaseElement,
    samples2DToPoints,
} from "./SurfaceBaseElement.ts";

/**
 * Angular sampling of a circular arc defined by radius.
 * Returns an array of [x, y] coordinates.
 */
function sphereSamplesAngular2(
    radius: number,
    start: number,
    end: number,
    N: number
  ): Array<[number, number]> {
  
    // Generate theta values based on the radius sign
    const theta = radius > 0
      ? Array.from({ length: N }, (_, i) => Math.PI - end + (i * (end - start)) / (N - 1))
      : Array.from({ length: N }, (_, i) => start + (i * (end - start)) / (N - 1));
  
    // Compute X and Y coordinates
    const X = theta.map(t => Math.abs(radius) * Math.cos(t) + radius);
    const Y = theta.map(t => Math.abs(radius) * Math.sin(t));
  
    // Combine X and Y into pairs
    return X.map((x, i) => [x, Y[i]]);
  }

export class SurfaceSphereRElement extends SurfaceBaseElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "surface-sphere-r";
    }

    public makeSamples2D(): Array<Array<number>> {
        const arc_radius = getRequired<number>(this.elementData, "R");
        const diameter = getRequired<number>(this.elementData, "diameter");

        const thetaMax = Math.asin(diameter / 2 / Math.abs(arc_radius));
        return sphereSamplesAngular2(arc_radius, -thetaMax, thetaMax, 101);
    }

    public makeHalfSamples2D(): Array<Array<number>> {
        const arc_radius = getRequired<number>(this.elementData, "R");
        const diameter = getRequired<number>(this.elementData, "diameter");

        const thetaMax = Math.asin(diameter / 2 / Math.abs(arc_radius));
        return sphereSamplesAngular2(arc_radius, 0.0, thetaMax, 101);
    }

    public makeGeometry2D(): [
        LineGeometry, // geometry
        THREE.Matrix4, // transform
    ] {        
        const samples = this.makeSamples2D();

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
        const samples: Array<Array<number>> = this.makeHalfSamples2D();

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
