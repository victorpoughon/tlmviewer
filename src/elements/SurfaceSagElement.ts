import * as THREE from "three";

import { get_required } from "../utility.ts";

import { LineGeometry } from "three/addons/lines/LineGeometry.js";

import { SurfaceBaseElement } from "./SurfaceBaseElement.ts";

// Generate line geometry by sampling a sag function in 2D
function sagGeometry2D(
    sag: (r: number) => number,
    start: number,
    end: number,
    N: number,
    const_z: number
): LineGeometry {
    const geometry = new LineGeometry();

    const step = (end - start) / (N - 1);
    const points: number[] = [];

    for (let i = 0; i < N; i++) {
        const y = start + i * step;
        const x = sag(y);

        points.push(x, y, const_z);
    }

    geometry.setPositions(points);
    return geometry;
}

export class SurfaceSagElement extends SurfaceBaseElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    public static match(elementData: any): boolean {
        const type = get_required(elementData, "type");
        return type === "surface-sag";
    }

    public makeGeometry2D(): [LineGeometry, THREE.Matrix4] {
        // parabola only for now

        const A = get_required(this.elementData, "A");
        const diameter = get_required(this.elementData, "diameter");

        const sag = (r: number): number => {
            return A * Math.pow(r, 2.0);
        };

        const geometry = sagGeometry2D(
            sag,
            -diameter / 2,
            diameter / 2,
            100,
            1.0
        );

        return [geometry, this.getTransform2D()];
    }

    public makeGeometry3D(): [
        THREE.BufferGeometry,
        THREE.Matrix4,
        string | null
    ] {
        const userTransform = this.getTransform3D();

        // We use ring geometry as the base geometry
        // But could consider using a custom geometry
        // for better distribution of vertices over the disk
        const diameter = get_required(this.elementData, "diameter");
        const geometry = new THREE.RingGeometry(
            0,
            diameter / 2,
            256,
            256
        ).rotateY(Math.PI / 2);

        const A = get_required(this.elementData, "A");

        // parabola sag vertex shader
        const vertexShader = /* glsl */ `
              void main() {
                vec3 pos = position;
                float y = pos.y;
                float z = pos.z;
                float r2 = pow(pos.y, 2.0) + pow(pos.z, 2.0);
                float r = sqrt(r2);

                float A = ${A};

                // sag function
                pos.x = A * r2;

                csm_Position = pos;
                }
                `;

        return [geometry, userTransform, vertexShader];
    }
}
