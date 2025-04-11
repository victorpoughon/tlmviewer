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
        const tau = diameter / 2;
        const sag = this.sagType(tau).sagFunction2D(tau);

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

        const tau = diameter / 2;
        const sag = this.sagType(tau);
        const vertexShader = glslRender(
            sag.shaderG(tau),
            sag.shaderGgrad(tau),
            sag.name
        );

        return [geometry, userTransform, vertexShader];
    }

    public sagType(tau: number): SagFunction {
        const sagFunction = getRequired<string>(
            this.elementData,
            "sag-function"
        );
        return parseSagFunction(sagFunction, tau);
    }
}

export function parseSagFunction(obj: any, tau: number): SagFunction {
    const type = getRequired<string>(obj, "sag-type");

    if (type === "parabolic") {
        return ParabolicSag.fromObj(obj, tau);
    } else if (type === "spherical") {
        return SphericalSag.fromObj(obj, tau);
    } else if (type === "aspheric") {
        return AsphericSag.fromObj(obj, tau);
    } else if (type === "conical") {
        return ConicalSag.fromObj(obj, tau);
    } else if (type === "sum") {
        return SagSum.fromObj(obj, tau);
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
        this.name = `${this.type()}_` + uuid.slice(0, 8);
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

    // tau is the normalization factor. If the sag function doesn't support
    // normalized parameterization, or if it's disabled, then tau can be
    // ignored. Else if enabled, use it to unnormalize the stored coefficients.
    public abstract shaderG(tau: number): string[];
    public abstract shaderGgrad(tau: number): string[];
    public abstract sagFunction2D(tau: number): (r: number) => number;
}

class ParabolicSag extends SagFunction {
    private A: number;
    private normalize: boolean;

    constructor(A: number, normalize: boolean) {
        super();
        this.A = A;
        this.normalize = normalize;
    }

    public static fromObj(obj: any, _tau: number): ParabolicSag {
        const A = getRequired<number>(obj, "A");
        const normalize = obj.normalize ?? false;
        return new ParabolicSag(A, normalize);
    }

    public type(): string {
        return "parabolic";
    }

    public unnorm(tau: number): number {
        if (this.normalize) {
            return this.A / tau;
        } else {
            return this.A;
        }
    }

    public shaderG(tau: number): string[] {
        const A = this.unnorm(tau);
        return [
            this.glslFunctionG(
                `
                ${glslFloat("A", A)}
                x = A * r2;
                `
            ),
        ];
    }

    public shaderGgrad(tau: number): string[] {
        const A = this.unnorm(tau);
        return [
            this.glslFunctionGgrad(
                `
                ${glslFloat("A", A)}
                Gy = 2.0 * A * y;
                Gz = 2.0 * A * z;
                `
            ),
        ];
    }

    public sagFunction2D(tau: number) {
        const A = this.unnorm(tau);
        return (r: number): number => {
            return A * Math.pow(r, 2.0);
        };
    }
}

class SphericalSag extends SagFunction {
    private C: number;

    constructor(C: number) {
        super();
        this.C = C;
    }

    public static fromObj(obj: any, tau: number): SphericalSag {
        const C = getRequired<number>(obj, "C");

        if (C !== 0.0 && Math.abs(1 / C) <= tau) {
            throw Error("SphericalSag: out of domain error");
        }
        return new SphericalSag(C);
    }

    public type(): string {
        return "spherical";
    }

    public shaderG(_tau: number): string[] {
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

    public shaderGgrad(_tau: number): string[] {
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

    public sagFunction2D(_tau: number) {
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
    private normalize: boolean;

    constructor(C: number, K: number, normalize: boolean) {
        super();
        this.C = C;
        this.K = K;
        this.normalize = normalize;
    }

    public static fromObj(obj: any, tau: number): ConicalSag {
        const C = getRequired<number>(obj, "C");
        const K = getRequired<number>(obj, "K");
        const normalize = obj.normalize ?? false;

        // Check for out of domain error
        if (tau >= Math.sqrt(1.0 / (Math.pow(C, 2.0) * (1.0 + K)))) {
            throw Error("ConicalSag: out of domain error");
        }

        // TODO verify K domain and raise error
        return new ConicalSag(C, K, normalize);
    }

    public type(): string {
        return "conical";
    }

    // Unnormalize coefficients
    public unnorm(tau: number): [number, number] {
        if (this.normalize) {
            return [this.C / tau, this.K];
        } else {
            return [this.C, this.K];
        }
    }

    public shaderG(tau: number): string[] {
        const [C, K] = this.unnorm(tau);
        return [
            this.glslFunctionG(
                `
                ${glslFloat("C", C)}
                ${glslFloat("K", K)}
                float C2 = pow(C, 2.0);
                
                x = (C * r2) / (1.0 + sqrt(1.0 - (1.0+K) * r2 * C2));
                `
            ),
        ];
    }

    public shaderGgrad(tau: number): string[] {
        const [C, K] = this.unnorm(tau);
        return [
            this.glslFunctionGgrad(
                `
                ${glslFloat("C", C)}
                ${glslFloat("K", K)}
                float C2 = pow(C, 2.0);

                float denom = sqrt(1.0 - (1.0 + K) * r2 * C2);
                Gy = (y * C) / denom;
                Gz = (z * C) / denom;
                `
            ),
        ];
    }

    public sagFunction2D(tau: number) {
        const [C, K] = this.unnorm(tau);
        return (r: number): number => {
            const C2 = Math.pow(C, 2.0);
            const r2 = Math.pow(r, 2.0);

            return (C * r2) / (1 + Math.sqrt(1 - (1 + K) * r2 * C2));
            // return torch.div(C * r2, 1 + torch.sqrt(1 - (1 + K) * r2 * C2))
        };
    }
}

class AsphericSag extends SagFunction {
    private coefficients: Array<number>;
    private normalize: boolean;

    constructor(coefficients: Array<number>, normalize: boolean) {
        super();
        this.coefficients = coefficients;
        this.normalize = normalize;
    }

    public static fromObj(obj: any, _tau: number): AsphericSag {
        const coefficients = getRequired<Array<number>>(obj, "coefficients");
        const normalize = obj.normalize ?? false;
        return new AsphericSag(coefficients, normalize);
    }

    public type(): string {
        return "aspheric";
    }

    // Unnormalize coefficients
    public unnorm(tau: number): Array<number> {
        if (this.normalize) {
            return this.coefficients.map(
                (c: number, i: number) => c / Math.pow(tau, 3 + 2 * i)
            );
        } else {
            return this.coefficients;
        }
    }

    public shaderG(tau: number): string[] {
        const alphas = this.unnorm(tau);
        const M = alphas.length;
        const str = alphas.map((c) => c.toFixed(8)).join(", ");

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

    public shaderGgrad(tau: number): string[] {
        const alphas = this.unnorm(tau);
        const M = alphas.length;
        const str = alphas.map((c) => c.toFixed(8)).join(", ");

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

    public sagFunction2D(tau: number) {
        const alphas = this.unnorm(tau);
        return (r: number): number => {
            var acc = 0.0;

            for (const [i, c] of alphas.entries()) {
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

    public static fromObj(obj: any, tau: number): SagSum {
        var terms: SagFunction[] = [];
        for (const t of getRequired<any[]>(obj, "terms")) {
            terms.push(parseSagFunction(t, tau));
        }
        return new SagSum(terms);
    }

    public type(): string {
        return "sum";
    }

    public shaderG(tau: number): string[] {
        var funcs: string[] = [];
        var names: string[] = [];

        // Append all terms shader functions
        for (const t of this.terms) {
            funcs.push(...t.shaderG(tau));
            names.push(t.name);
        }

        // Make the sum function and add it the the list of functions
        const sumFunction = this.glslFunctionG(
            "x = " + names.map((n) => `${n}_G(y, z, r2)`).join(" + ") + ";"
        );
        funcs.push(sumFunction);
        return funcs;
    }

    public shaderGgrad(tau: number): string[] {
        var funcs: string[] = [];
        var names: string[] = [];

        // Append all terms shader functions
        for (const t of this.terms) {
            funcs.push(...t.shaderGgrad(tau));
            names.push(t.name);
        }

        // Make the sum function and add it the the list of functions
        const sumStr = names.map((n) => `${n}_Ggrad(y, z, r2)`).join(" + ");
        const sumFunction = this.glslFunctionGgrad(`
                vec3 Ggrad = ${sumStr};
                Gy = Ggrad.y;
                Gz = Ggrad.z;
            `);
        funcs.push(sumFunction);
        return funcs;
    }

    public sagFunction2D(tau: number) {
        const f = (r: number): number => {
            var x = 0.0;

            for (const t of this.terms) {
                x += t.sagFunction2D(tau)(r);
            }
            return x;
        };

        return f;
    }
}
