import * as THREE from "three";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import CustomShaderMaterial from "three-custom-shader-material/vanilla";

import { getRequired } from "../utility.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";

export function arrayToMatrix4(array: Array<Array<number>>): THREE.Matrix4 {
    if (array.length !== 4 || array.some((row) => row.length !== 4)) {
        throw new Error("Input must be a 4x4 array");
    }

    const matrix = new THREE.Matrix4();

    // Transpose the array (convert from row-major to column-major)
    const transposedArray = array[0].map((_, colIndex) =>
        array.map((row) => row[colIndex])
    );

    // Flatten the transposed array and create the Matrix4
    matrix.fromArray(transposedArray.flat());

    return matrix;
}

// Convert a 3x3 homogeneous matrix to a 4x4 homogeneous matrix,
// by inserting identity transform to the new axis
export function homogeneousMatrix3to4(matrix: number[][]): number[][] {
    // Check if the input matrix is 3x3
    if (matrix.length !== 3 || matrix.some((row) => row.length !== 3)) {
        throw new Error("Input matrix must be 3x3");
    }

    return [
        [matrix[0][0], matrix[0][1], 0, matrix[0][2]],
        [matrix[1][0], matrix[1][1], 0, matrix[1][2]],
        [0, 0, 1, 0],
        [matrix[2][0], matrix[2][1], 0, matrix[2][2]],
    ];
}

export function samples2DToPoints(samples: Array<Array<number>>) {
    const points: number[] = [];
    for (const p of samples) {
        points.push(p[0], p[1], 1.0);
    }
    return points;
}

export abstract class SurfaceBaseElement extends AbstractSceneElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    // Get the Matrix4 tranform from the element data
    // Expecting a 2D transform
    public getTransform2D(): THREE.Matrix4 {
        const matrix3 = getRequired<number[][]>(this.elementData, "matrix");
        // TODO more error checking on matrix3 array shape here
        const matrix4 = homogeneousMatrix3to4(matrix3);
        return arrayToMatrix4(matrix4);
    }

    // Get the Matrix4 tranform from the element data
    // Expecting a 3D transform
    public getTransform3D(): THREE.Matrix4 {
        const matrix4 = getRequired<number[][]>(this.elementData, "matrix");
        // TODO more error checking on matrix4 array shape here
        return arrayToMatrix4(matrix4);
    }

    public abstract makeGeometry2D(): [
        LineGeometry, // geometry
        THREE.Matrix4 // transform
    ];

    public abstract makeGeometry3D(): [
        THREE.BufferGeometry, // geometry
        THREE.Matrix4, // transform
        string | null // optional vertex shader
    ];

    public makeGroup(): THREE.Group {
        if (this.dim == 2) {
            return this.makeSurface2D();
        } else {
            return this.makeSurface3D();
        }
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
        const userTransform: THREE.Matrix4 = arrayToMatrix4(
            getRequired<number[][]>(this.elementData, "matrix")
        );

        const [geometry, transform, vertexShader] = this.makeGeometry3D();

        // Clip planes are encoded as [x, y, z, c], where:
        //     [x, y, z] is the normal vector in surface local frame
        //     c is the constant in surface local frame
        const clip_planes = this.elementData.clip_planes ?? [];
        const clipPlanes: THREE.Plane[] = [];
        for (const plane of clip_planes) {
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

    public setColor(group: THREE.Group, color: THREE.Color): void {
        group.traverse((child: THREE.Object3D) => {
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
