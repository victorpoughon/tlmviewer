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

        const sag = this.sagType();
        const vertexShader = glslRender(sag.shaderG(), sag.shaderGgrad(), sag.name);

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
    } else if (type === "sum") {
        var terms: SagFunction[] = [];
        for (const t of getRequired<any[]>(obj, "terms")) {
            terms.push(parseSagFunction(t));
        }
        return new SagSum(terms);
    } else {
        throw Error(`Uknown surface sag type ${type}`);
    }
}

export function glslRender(Gs: string[], Ggrads: string[], entry: string) {
    const vertexShader = `
            ${Gs.join("\n")}

            ${Ggrads.join("\n")}

            void main() {
                vec3 pos = position;
                float y = pos.y;
                float z = pos.z;
                float r2 = pow(pos.y, 2.0) + pow(pos.z, 2.0);

                pos.x = ${entry}_G(y, z, r2);
                csm_Position = pos;

                vec3 Ggrad = ${entry}_Ggrad(y, z, r2);
                csm_Normal = -normalize(vec3(-1.0, Ggrad.y, Ggrad.z));
            }
            `;
            // Note the minus sign before the normal above
            // this is to match the RingGeometry which expects surface gradients
            // pointing towards +X, but by construction surface normals in TLM
            // point towards -X for sag surfaces.

    return vertexShader;
}

function glslFloat(name: string, val: number) {
    return `float ${name} = ${val.toFixed(8)};`;
}

abstract class SagFunction {
    public name: string;

    constructor() {
        // Name is a random string that can be used as a valid GLSL identifier
        const uuid = crypto.randomUUID();
        this.name =
            `${this.type()}_` +
            uuid.slice(0, 8);
    }

    public abstract type(): string;

    public glslFunctionG(chunk: string) {
        return `
            float ${this.name}_G(float y, float z, float r2) {
                // ${JSON.stringify(this)}
                float x = 0.0;
                ${chunk}
                return x;
            }`;
    }

    public glslFunctionGgrad(chunk: string) {
        return `
            vec3 ${this.name}_Ggrad(float y, float z, float r2) {
                // ${JSON.stringify(this)}
                float Gy = 0.0;
                float Gz = 0.0;
                ${chunk}
                return vec3(-1.0, Gy, Gz);
            }`;
    }

    public abstract shaderG(): string[];
    public abstract shaderGgrad() : string[];
    public abstract sagFunction2D(): (r: number) => number;
}

class ParabolicSag extends SagFunction {
    private A: number;

    constructor(A: number) {
        super();
        this.A = A;
    }

    public type(): string {
        return "parabolic";
    }

    public shaderG(): string[] {
        return [
            this.glslFunctionG(
                `
                float A = ${this.A};
                x = A * r2;
                `
            ),
        ];
    }

    public shaderGgrad() : string[] {
        return [
            this.glslFunctionGgrad(
                `
                float A = ${this.A};
                Gy = 2.0 * A * y;
                Gz = 2.0 * A * z;
                `
            ),
        ];
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

    public type(): string {
        return "spherical";
    }

    public shaderG(): string[] {
        return [
            this.glslFunctionG(
                `
                ${glslFloat("C", this.C)}
                float C2 = pow(C, 2.0);

                float num = C * r2;
                float denom = 1.0 + sqrt(1.0 - r2 * C2);
                x = num / denom;
                `
            ),
        ];
    }

    public shaderGgrad() : string[] {
        return [
            this.glslFunctionGgrad(
                `
                ${glslFloat("C", this.C)}
                float C2 = pow(C, 2.0);

                float denom = sqrt(1.0 - r2 * C2);
                Gy = (y * C) / denom;
                Gz = (z * C) / denom;
                `
            ),
        ];
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

    public type(): string {
        return "conical";
    }

    public shaderG(): string[] {
        return [
            this.glslFunctionG(
                `
                ${glslFloat("C", this.C)}
                ${glslFloat("K", this.K)}
                float C2 = pow(C, 2.0);
                
                x = (C * r2) / (1.0 + sqrt(1.0 - (1.0+K) * r2 * C2));
                `
            ),
        ];
    }

    public shaderGgrad() : string[] {
        return [
            this.glslFunctionGgrad(
                `
                ${glslFloat("C", this.C)}
                ${glslFloat("K", this.K)}
                float C2 = pow(C, 2.0);

                float denom = sqrt(1.0 - (1.0 + K) * r2 * C2);
                Gy = (y * C) / denom;
                Gz = (z * C) / denom;
                `
            ),
        ];
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

    public type(): string {
        return "aspheric";
    }

    public shaderG(): string[] {
        const M = this.coefficients.length;
        const str = this.coefficients.map((c) => c.toFixed(8)).join(", ");

        if (M === 0) {
            return [this.glslFunctionG("")];
        }

        return [
            this.glslFunctionG(
                `
                float coefficients[${M}] = float[](${str});
                for (int i = 0; i < ${M}; i++) {
                    x += coefficients[i] * pow(r2, 2.0 + float(i));
                }
                `
            ),
        ];
    }

    public shaderGgrad() : string[] {
        const M = this.coefficients.length;
        const str = this.coefficients.map((c) => c.toFixed(8)).join(", ");

        if (M === 0) {
            return [this.glslFunctionGgrad("")];
        }

        return [
            this.glslFunctionGgrad(
                `
                float sumterm = 0.0;
                float coefficients[${M}] = float[](${str});

                for (int i = 0 ; i < ${M} ; i++) {
                    sumterm += coefficients[i] * (4.0 + 2.0*float(i)) * pow(r2, 1.0+float(i));
                }

                Gy = y * sumterm;
                Gz = z * sumterm;
                `
            ),
        ];
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

class SagSum extends SagFunction {
    private terms: SagFunction[];

    constructor(terms: SagFunction[]) {
        super();
        this.terms = terms;
    }

    public type(): string {
        return "sum";
    }

    public shaderG(): string[] {
        var funcs: string[] = [];
        var names: string[] = [];

        // Append all terms shader functions
        for (const t of this.terms) {
            funcs.push(...t.shaderG());
            names.push(t.name);
        }

        // Make the sum function and add it the the list of functions
        const sumFunction = this.glslFunctionG(
            "x = " + names.map((n) => `${n}_G(y, z, r2)`).join(" + ") + ";"
        );
        funcs.push(sumFunction);
        return funcs;
    }

    public shaderGgrad() : string[] {
        var funcs: string[] = [];
        var names: string[] = [];

        // Append all terms shader functions
        for (const t of this.terms) {
            funcs.push(...t.shaderGgrad());
            names.push(t.name);
        }

        // Make the sum function and add it the the list of functions
        const sumStr = names.map((n) => `${n}_Ggrad(y, z, r2)`).join(" + ");
        const sumFunction = this.glslFunctionGgrad(`
                vec3 Ggrad = ${sumStr};
                Gy = Ggrad.y;
                Gz = Ggrad.z;
            `
        );
        funcs.push(sumFunction);
        return funcs;
    }

    public sagFunction2D() {
        const f = (r: number): number => {
            var x = 0.0;

            for (const t of this.terms) {
                x += t.sagFunction2D()(r);
            }
            return x;
        };

        return f;
    }
}
