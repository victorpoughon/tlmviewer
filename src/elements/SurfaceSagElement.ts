import * as THREE from "three";

import { get_required, getRequired } from "../utility.ts";

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
        const diameter = get_required(this.elementData, "diameter");

        const sag = this.sagType().sagFunction2D();

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

        const vertexShader = this.sagType().sagShader3D();

        return [geometry, userTransform, vertexShader];
    }

    public sagType(): AbstractSagBase {
        const type = getRequired<string>(this.elementData, "sag-type");

        if (type == "parabola") {
            const A = getRequired<number>(this.elementData, "A");
            return new ParabolaSag(A);
        } else if (type == "sphere") {
            const C = getRequired<number>(this.elementData, "C");
            return new SphereSag(C);
        } else {
            throw Error(`Uknown surface sag type ${type}`);
        }
    }
}

abstract class AbstractSagBase {
    public abstract shader3D(): string;
    public abstract sagFunction2D(): (r: number) => number;

    public sagShader3D(): string {
        const vertexShader = `
              void main() {
                vec3 pos = position;
                float y = pos.y;
                float z = pos.z;
                float r2 = pow(pos.y, 2.0) + pow(pos.z, 2.0);
                float x = 0.0;

                ${this.shader3D()}

                pos.x = x;
                csm_Position = pos;
                }
                `;

        return vertexShader;
    }
}

class ParabolaSag extends AbstractSagBase {
    private A: number;

    constructor(A: number) {
        super();
        this.A = A;
    }

    public shader3D() {
        return `
            float A = ${this.A};
            x += A * r2;
        `;
    }

    public sagFunction2D() {
        return (r: number): number => {
            return this.A * Math.pow(r, 2.0);
        };
    }
}

class SphereSag extends AbstractSagBase {
    private C: number;

    constructor(C: number) {
        super();
        this.C = C;
    }

    public shader3D() {
        return `
            float C = ${this.C};
            float C2 = pow(C, 2.0);

            float num = C * r2;
            float denom = 1.0 + sqrt(1.0 - r2 * C2);
            x += num / denom;
        `;
    }

    public sagFunction2D() {
        return (r: number): number => {
            const r2 = Math.pow(r, 2.0);
            const C2 = Math.pow(this.C, 2.0);

            const num = this.C * r2;
            const denom = 1 + Math.sqrt(1 - r2 * C2);

            return num / denom;
        };
    }
}
