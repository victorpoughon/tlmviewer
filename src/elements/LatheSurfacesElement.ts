import * as THREE from "three";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import { get_required } from "../utility.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";

function arrayToMatrix4(array: Array<Array<number>>): THREE.Matrix4 {
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
function homogeneousMatrix3to4(matrix: number[][]): number[][] {
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

function makeSurfaces2D(element: any): THREE.Group {
    const group = new THREE.Group();

    const data = get_required(element, "data");

    for (const surface of data) {
        const matrix4 = homogeneousMatrix3to4(get_required(surface, "matrix"));
        const samples = get_required(surface, "samples");

        const material = new LineMaterial({
            color: "cyan",
            linewidth: 2,
            worldUnits: false,
            side: THREE.DoubleSide,
        });

        const points: number[] = [];
        for (const p of samples) {
            points.push(p[0], p[1], 1.0);
        }

        //const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const geometry = new LineGeometry();
        geometry.setPositions(points);
        const line_mesh = new Line2(geometry, material);
        line_mesh.applyMatrix4(arrayToMatrix4(matrix4));
        group.add(line_mesh);
    }

    return group;
}

function makeSurfaces3D(element: any): THREE.Group {
    const data = get_required(element, "data");

    const group = new THREE.Group();

    for (const surface of data) {
        // TODO: check that points are all Y > 0
        const matrix = get_required(surface, "matrix");
        const samples = get_required(surface, "samples");
        const clip_planes = surface.clip_planes ?? [];

        const lathe = makeSurface(matrix, samples, clip_planes);
        group.add(lathe);
    }

    return group;
}

function makeSurface(
    matrix4: Array<Array<number>>,
    samples: Array<Array<number>>,
    clip_planes: number[][]
) {
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
    const userTransform = arrayToMatrix4(matrix4);
    const transform = new THREE.Matrix4();
    transform.multiplyMatrices(userTransform, flip);

    const tpoints = samples.map((p) => new THREE.Vector2(p[1], p[0]));

    const geometry = new THREE.LatheGeometry(tpoints, segments);

    // Clip planes are encoded as [x, y, z, c], where:
    //     [x, y, z] is the normal vector in surface local frame
    //     c is the constant in surface local frame
    const clipPlanes: THREE.Plane[] = [];
    for (const plane of clip_planes) {
        const v = new THREE.Vector3(plane[0], plane[1], plane[2]);

        const c = plane[3];
        const tplane = new THREE.Plane(v, c);
        tplane.applyMatrix4(userTransform);
        clipPlanes.push(tplane);
    }

    const material = new THREE.MeshNormalMaterial({
        side: THREE.DoubleSide,
        clippingPlanes: clipPlanes,
        clipIntersection: false,
    });
    material.transparent = true;
    material.opacity = 0.8;
    const lathe = new THREE.Mesh(geometry, material);
    lathe.applyMatrix4(transform);
    return lathe;
}

export class LatheSurfacesElement extends AbstractSceneElement {
    constructor() {
        super();
    }

    // True if the given scene element data object matches this class
    public static match(elementData: any): boolean {
        const type = get_required(elementData, "type");
        return type === "surfaces";
    }

    public loadJSON(elementData: any, dim: number): THREE.Group {
        if (dim == 2) {
            return makeSurfaces2D(elementData);
        } else {
            return makeSurfaces3D(elementData);
        }
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
