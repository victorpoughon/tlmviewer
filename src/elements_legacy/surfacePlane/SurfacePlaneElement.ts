import * as THREE from "three";

import { getRequired } from "../../utility.ts";

import { LineGeometry } from "three/addons/lines/LineGeometry.js";

import {
    SurfaceBaseElement,
    SurfaceBaseData,
    parseSurfaceBaseData,
} from "../SurfaceBaseElement.ts";
import { samples2DToPoints } from "../../core/geometry.ts";

interface SurfacePlaneData extends SurfaceBaseData {
    radius: number;
}

export class SurfacePlaneElement extends SurfaceBaseElement {
    readonly data: SurfacePlaneData;

    static parse(raw: any): SurfacePlaneData {
        return {
            ...parseSurfaceBaseData(raw),
            radius: getRequired<number>(raw, "radius"),
        };
    }

    constructor(
        data: SurfacePlaneData,
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
        return type === "surface-plane";
    }

    public makeGeometry2D(): [LineGeometry, THREE.Matrix4] {
        const { radius } = this.data;
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
        string | null,
    ] {
        const userTransform = this.getTransform3D();

        // Make the composed transform
        const base = new THREE.Matrix4().makeRotationY(Math.PI / 2);

        const transform = new THREE.Matrix4();
        transform.multiplyMatrices(userTransform, base);

        const geometry = new THREE.RingGeometry(0, this.data.radius, 128, 8);

        return [geometry, transform, null];
    }
}
