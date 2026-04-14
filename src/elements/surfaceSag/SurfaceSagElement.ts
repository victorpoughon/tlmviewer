import * as THREE from "three";

import { getRequired } from "../../utility.ts";

import { LineGeometry } from "three/addons/lines/LineGeometry.js";

import {
    SurfaceBaseElement,
    SurfaceBaseData,
    parseSurfaceBaseData,
} from "../SurfaceBaseElement.ts";
import { glslRender, parseSagFunction, SagFunction } from "./sagFunctions.ts";

// Generate line geometry by sampling a sag function in 2D
function sagGeometry2D(
    sag: (r: number) => number,
    start: number,
    end: number,
    N: number,
    const_z: number,
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

interface SurfaceSagData extends SurfaceBaseData {
    diameter: number;
    sagFunctionData: any;
    bcyl?: [number, number, number];
}

export class SurfaceSagElement extends SurfaceBaseElement {
    readonly data: SurfaceSagData;

    static parse(raw: any): SurfaceSagData {
        return {
            ...parseSurfaceBaseData(raw),
            diameter: getRequired<number>(raw, "diameter"),
            sagFunctionData: getRequired<any>(raw, "sag-function"),
            bcyl: raw.bcyl,
        };
    }

    constructor(
        data: SurfaceSagData,
        dim: number,
        container: HTMLElement,
        threeScene: THREE.Scene,
    ) {
        super(data, dim, container, threeScene);
        this.data = data;
    }

    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "surface-sag";
    }

    public makeGeometry2D(): [LineGeometry, THREE.Matrix4] {
        const { diameter } = this.data;
        const tau = diameter / 2;
        const sag = this.sagType(tau).sagFunction2D(tau);

        const geometry = sagGeometry2D(
            sag,
            -diameter / 2,
            diameter / 2,
            100,
            1.0,
        );

        return [geometry, this.getTransform2D()];
    }

    public makeGeometry3D(): [
        THREE.BufferGeometry,
        THREE.Matrix4,
        string | null,
    ] {
        const userTransform = this.getTransform3D();

        // We use ring geometry as the base geometry
        // But could consider using a custom geometry
        // for better distribution of vertices over the disk
        const { diameter } = this.data;
        const geometry = new THREE.RingGeometry(
            0,
            diameter / 2,
            256,
            256,
        ).rotateY(Math.PI / 2);

        const tau = diameter / 2;
        const sag = this.sagType(tau);
        const vertexShader = glslRender(
            sag.shaderG(tau),
            sag.shaderGgrad(tau),
            sag.name,
        );

        return [geometry, userTransform, vertexShader];
    }

    public sagType(tau: number): SagFunction {
        return parseSagFunction(this.data.sagFunctionData, tau);
    }
}
