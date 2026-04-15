import * as THREE from "three";

import { getRequired } from "../../utility.ts";

import { LineGeometry } from "three/addons/lines/LineGeometry.js";

import {
    SurfaceBaseElement,
    SurfaceBaseData,
    parseSurfaceBaseData,
} from "../SurfaceBaseElement.ts";
import { samples2DToPoints } from "../../core/geometry.ts";

interface SurfaceLatheData extends SurfaceBaseData {
    samples: number[][];
}

export class SurfaceLatheElement extends SurfaceBaseElement {
    readonly data: SurfaceLatheData;

    static parse(raw: any): SurfaceLatheData {
        return {
            ...parseSurfaceBaseData(raw),
            samples: getRequired<number[][]>(raw, "samples"),
        };
    }

    constructor(
        data: SurfaceLatheData,
        dim: number,
        container: HTMLElement,
        threeScene: THREE.Scene,
    ) {
        super(data, dim, container, threeScene);
        this.data = data;
        this.group = this.makeGroup();
    }

    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "surface-lathe";
    }

    public makeGeometry2D(): [
        LineGeometry, // geometry
        THREE.Matrix4, // transform
    ] {
        const points = samples2DToPoints(this.data.samples);

        const geometry = new LineGeometry();
        geometry.setPositions(points);

        return [geometry, this.getTransform2D()];
    }

    public makeGeometry3D(): [
        THREE.BufferGeometry,
        THREE.Matrix4,
        string | null,
    ] {
        const userTransform = this.getTransform3D();

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

        const tpoints = this.data.samples.map(
            (p) => new THREE.Vector2(p[1], p[0]),
        );

        const geometry = new THREE.LatheGeometry(tpoints, segments);

        return [geometry, transform, null];
    }
}
