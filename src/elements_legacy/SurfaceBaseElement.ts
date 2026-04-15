import * as THREE from "three";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import CustomShaderMaterial from "three-custom-shader-material/vanilla";

import { getRequired } from "../utility.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";
import { arrayToMatrix4, homogeneousMatrix3to4 } from "../core/geometry.ts";

export interface SurfaceBaseData {
    matrix: number[][];
    clipPlanes?: [number, number, number, number][];
}

export function parseSurfaceBaseData(raw: any): SurfaceBaseData {
    return {
        matrix: getRequired<number[][]>(raw, "matrix"),
        clipPlanes: raw.clip_planes,
    };
}

export abstract class SurfaceBaseElement extends AbstractSceneElement {
    private readonly baseData: SurfaceBaseData;

    constructor(
        baseData: SurfaceBaseData,
        dim: number,
        container: HTMLElement,
        threeScene: THREE.Scene,
    ) {
        super(dim, container, threeScene);
        this.baseData = baseData;
    }

    // Get the Matrix4 tranform from the element data
    // Expecting a 2D transform
    public getTransform2D(): THREE.Matrix4 {
        const matrix4 = homogeneousMatrix3to4(this.baseData.matrix);
        return arrayToMatrix4(matrix4);
    }

    // Get the Matrix4 tranform from the element data
    // Expecting a 3D transform
    public getTransform3D(): THREE.Matrix4 {
        return arrayToMatrix4(this.baseData.matrix);
    }

    public abstract makeGeometry2D(): [
        LineGeometry, // geometry
        THREE.Matrix4, // transform
    ];

    public abstract makeGeometry3D(): [
        THREE.BufferGeometry, // geometry
        THREE.Matrix4, // transform
        string | null, // optional vertex shader
    ];

    protected makeGroup(): THREE.Group {
        var group = this.dim == 2 ? this.makeSurface2D() : this.makeSurface3D();

        this.addEventListener("setSurfacesVisible", (e) => {
            this.group.visible = e.value;
        });

        this.addEventListener("setSurfacesColor", (e) => {
            this.setColor(e.value);
        });

        return group;
    }

    private makeSurface2D(): THREE.Group {
        const group = new THREE.Group();

        const [geometry, transform] = this.makeGeometry2D();

        const material = new LineMaterial({
            color: "cyan",
            linewidth: 2,
            worldUnits: false,
            side: THREE.DoubleSide,
        });

        const line_mesh = new Line2(geometry, material);
        line_mesh.applyMatrix4(transform);
        group.add(line_mesh);

        return group;
    }

    private makeSurface3D(): THREE.Group {
        const group = new THREE.Group();
        const userTransform = this.getTransform3D();

        const [geometry, transform, vertexShader] = this.makeGeometry3D();

        // Clip planes are encoded as [x, y, z, c], where:
        //     [x, y, z] is the normal vector in surface local frame
        //     c is the constant in surface local frame
        const clipPlanes: THREE.Plane[] = [];
        for (const plane of this.baseData.clipPlanes ?? []) {
            const v = new THREE.Vector3(plane[0], plane[1], plane[2]);
            const c = plane[3];
            const tplane = new THREE.Plane(v, c);
            tplane.applyMatrix4(userTransform);
            clipPlanes.push(tplane);
        }

        const material = new CustomShaderMaterial({
            baseMaterial: THREE.MeshNormalMaterial,
            // baseMaterial: THREE.MeshLambertMaterial,
            // baseMaterial: THREE.MeshPhongMaterial,
            vertexShader: vertexShader ?? undefined,

            // Base material properties
            // color: 0x049ef4,
            side: THREE.DoubleSide,
            clippingPlanes: clipPlanes,
            clipIntersection: false,
            transparent: false,
            opacity: 0.8,
            // shininess: 50,
            // specular: 0x5e5e5e,
            // wireframe: true,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.applyMatrix4(transform);
        group.add(mesh);

        return group;
    }

    public setColor(color: THREE.Color): void {
        this.group.traverse((child: THREE.Object3D) => {
            if (
                child instanceof THREE.Mesh &&
                child.material instanceof THREE.Material
            ) {
                if ("color" in child.material) {
                    (
                        child.material as THREE.Material & {
                            color: THREE.Color;
                        }
                    ).color = color;
                }
            }
        });
    }
}
