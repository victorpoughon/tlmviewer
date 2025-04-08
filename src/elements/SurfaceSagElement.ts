import * as THREE from "three";

import { getRequired } from "../utility.ts";

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
        const type = getRequired<string>(elementData, "type");
        return type === "surface-sag";
    }

    public makeGeometry2D(): [LineGeometry, THREE.Matrix4] {
        const diameter = getRequired<number>(this.elementData, "diameter");

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
        const diameter = getRequired<number>(this.elementData, "diameter");
        const geometry = new THREE.RingGeometry(
            0,
            diameter / 2,
            256,
            256
        ).rotateY(Math.PI / 2);

        const vertexShader = this.sagType().sagShader3D();

        return [geometry, userTransform, vertexShader];
    }

    public sagType(): SagFunction {
        const sagFunction = getRequired<string>(
            this.elementData,
            "sag-function"
        );
        return parseSagFunction(sagFunction);
    }
}

export function parseSagFunction(obj: any): SagFunction {
    const type = getRequired<string>(obj, "sag-type");

    if (type === "parabolic") {
        const A = getRequired<number>(obj, "A");
        return new ParabolicSag(A);
    } else if (type === "spherical") {
        const C = getRequired<number>(obj, "C");
        return new SphericalSag(C);
    } else if (type === "aspheric") {
        const coefficients = getRequired<Array<number>>(obj, "coefficients");
        return new AsphericSag(coefficients);
    } else if (type === "conical") {
        const C = getRequired<number>(obj, "C");
        const K = getRequired<number>(obj, "K");
        return new ConicalSag(C, K);
    } else {
        throw Error(`Uknown surface sag type ${type}`);
    }
}

abstract class SagFunction {
    public name: string;

    constructor() {
        // Name is a random string that can be used as a valid GLSL identifier
        const uuid = crypto.randomUUID();
        this.name = "sag_" + uuid.replace(/[^a-zA-Z0-9_]/g, "_");
    }

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

class ParabolicSag extends SagFunction {
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

class SphericalSag extends SagFunction {
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

class ConicalSag extends SagFunction {
    private C: number;
    private K: number;

    constructor(C: number, K: number) {
        super();
        this.C = C;
        this.K = K;
    }

    public shader3D() {
        return `
            float C = ${this.C};
            float K = ${this.K};
            float C2 = pow(C, 2.0);
            
            x += (C * r2) / (1.0 + sqrt(1.0 - (1.0+K) * r2 * C2));
        `;
    }

    public sagFunction2D() {
        return (r: number): number => {
            const C = this.C;
            const K = this.K;
            const C2 = Math.pow(C, 2.0);
            const r2 = Math.pow(r, 2.0);

            return (C * r2) / (1 + Math.sqrt(1 - (1 + K) * r2 * C2));
        };
    }
}

class AsphericSag extends SagFunction {
    private coefficients: Array<number>;

    constructor(coefficients: Array<number>) {
        super();
        this.coefficients = coefficients;
    }

    public shader3D() {
        const M = this.coefficients.length;
        const str = this.coefficients.map((c) => c.toFixed(8)).join(", ");
        return `
        float coefficients[${M}] = float[](${str});
        float acc = 0.0;
        for (int i = 0; i < ${M}; i++) {
            acc += coefficients[i] * pow(r2, 2.0 + float(i));
        }
        x += acc;
        `;
    }

    public sagFunction2D() {
        return (r: number): number => {
            var acc = 0.0;

            for (const [i, c] of this.coefficients.entries()) {
                acc += c * Math.pow(r, 4 + 2 * i);
            }

            return acc;
        };
    }
}
