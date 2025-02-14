import * as THREE from "three";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import { get_required } from "./utility.ts";
import { colormap } from "./color.ts";
import { CET_I2 } from "./CET_I2.ts";

import { wavelengthToRgb, arrayToRgb } from "./true_color.ts";

export function makeLine(start: number[], end: number[], color: string) {
    console.assert(start.length == 3);
    console.assert(end.length == 3);

    const material = new THREE.LineBasicMaterial({ color: color });

    const points = [];
    points.push(new THREE.Vector3().fromArray(start));
    points.push(new THREE.Vector3().fromArray(end));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
}

export function makeLine2(start: number[], end: number[], color: string) {
    console.assert(start.length == 3);
    console.assert(end.length == 3);

    const material = new LineMaterial({
        color: color,
        linewidth: 1.1,
        worldUnits: false,
        side: THREE.DoubleSide,
        transparent: true
    });

    const points = [];
    points.push(new THREE.Vector3().fromArray(start));
    points.push(new THREE.Vector3().fromArray(end));

    const geometry = new LineGeometry().setFromPoints(points);
    const ret = new Line2(geometry, material);

    return ret;
}

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

function makeSurfaces(element: any, dim: number): THREE.Group {
    if (dim == 2) {
        return makeSurfaces2D(element);
    } else {
        return makeSurfaces3D(element);
    }
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

function applyLayerGroup(obj: THREE.Object3D, layers: Array<number>) {
    obj.traverse((child) => {
        child.layers.disableAll();
    });
    obj.traverse((child) => {
        for (const layer of layers) {
            child.layers.enable(layer);
        }
    });
}

function makePoints(element: any, dim: number): THREE.Group {
    const vertices = get_required(element, "data");
    const color = element.color ?? "#ffffff";

    const group = new THREE.Group();
    for (const point of vertices) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);

        if (point.length != dim) {
            throw new Error(
                `point array length is ${point.length} (expected ${dim})`
            );
        }
        if (dim == 2) {
            sphere.position.set(point[0], point[1], 2.0);
        } else {
            sphere.position.set(point[0], point[1], point[2]);
        }

        group.add(sphere);
    }

    // Add layers
    applyLayerGroup(group, element["layers"] ?? [0]);

    return group;
}

function makeArrows(element: any, dim: number): THREE.Group {
    const arrows = get_required(element, "data");

    const group = new THREE.Group();

    for (const arrow of arrows) {
        var start, end, length;
        if (dim == 2) {
            console.assert(arrow.length == 5);
            start = arrow.slice(0, 2);
            end = arrow.slice(2, 4);
            length = arrow[4];
        } else {
            console.assert(arrow.length == 7);
            start = arrow.slice(0, 3);
            end = arrow.slice(3, 6);
            length = arrow[6];
        }

        const dir = new THREE.Vector3(...start);
        dir.normalize();
        const origin = new THREE.Vector3(...end);
        const color = 0xffff00;

        const arrowHelper = new THREE.ArrowHelper(dir, origin, length, color);
        group.add(arrowHelper);
    }

    return group;
}

function makeRays(
    element: any,
    dim: number,
    colorOption: ColorOption
): THREE.Group {
    const points = get_required(element, "points");
    const default_color = element.color ?? "#ffa724";
    const variables = element.variables ?? {};
    const domain = element.domain ?? {};
    const expectedLength = 2 * dim;

    const group = new THREE.Group();

    if (colorOption.show == false) {
        return group;
    }

    if (!(Symbol.iterator in Object(points))) {
        throw new Error("points field of ray is not iterable");
    }

    for (const [index, ray] of points.entries()) {
        if (ray.length != expectedLength) {
            throw new Error(
                `Invalid ray array length, got ${ray.length} for dim ${dim}`
            );
        }

        var start, end;
        if (dim == 2) {
            start = ray.slice(0, 2).concat([0]);
            end = ray.slice(2, 4).concat([0]);
        } else {
            start = ray.slice(0, 3);
            end = ray.slice(3, 6);
        }

        var color;

        if (
            colorOption.colorDim == null ||
            !variables.hasOwnProperty(colorOption.colorDim)
        ) {
            color = default_color;
        } else if (colorOption.trueColor == false) {
            if (!domain.hasOwnProperty(colorOption.colorDim)) {
                throw new Error(
                    `${colorOption.colorDim} missing from ray domain object`
                );
            }
            const [min, max] = domain[colorOption.colorDim];
            const normalizedX =
                (variables[colorOption.colorDim][index] - min) / (max - min);
            color = colormap(normalizedX, CET_I2);
        } else {
            // true color
            const wavelength = variables[colorOption.colorDim][index];
            color = arrayToRgb(wavelengthToRgb([wavelength])[0]);
        }

        const line = makeLine2(start, end, color);
        group.add(line);
    }

    // Dont apply layers because visiblity is handled by not setting up the rays at all

    return group;
}

export function makeElement(element: any, dim: number): THREE.Group {
    const type: string = get_required(element, "type");

    type MakerFunction = (element: any, _dim: number) => THREE.Group;
    const makers: { [key: string]: MakerFunction } = {
        surfaces: makeSurfaces,
        points: makePoints,
        arrows: makeArrows,
    };

    if (!makers.hasOwnProperty(type)) {
        throw new Error("tlmviewer: unknown type: " + type);
    }

    // Call matching maker function
    const maker = makers[type];

    return maker(element, dim);
}

// Extract available variables from the scene
function extractVariables(root: any): string[] {
    const variables: Set<string> = new Set([]);

    const data = get_required(root, "data");
    for (const element of data) {
        if (get_required(element, "type") == "rays") {
            const thisVars = element.variables ?? {};
            Object.keys(thisVars).forEach((v: string) => variables.add(v));
        }
    }

    return Array.from(variables);
}

// Color option
export type ColorOption = {
    show: boolean;
    colorDim: string | null;
    trueColor: boolean;
};

export class TLMScene {
    private root: any;
    private dim: number;

    // Model
    public surfaces: THREE.Group;
    public validRays: THREE.Group;
    public blockedRays: THREE.Group;
    public outputRays: THREE.Group;
    public points: THREE.Group;
    public arrows: THREE.Group;
    
    public opticalAxis: THREE.Group;
    public otherAxes: THREE.Group;

    public scene: THREE.Scene;

    public variables: string[];
    public title: string;

    constructor(root: any, dim: number) {
        this.root = root;
        this.dim = dim;
        this.scene = new THREE.Scene();
        // const data = get_required(root, "data");

        this.variables = extractVariables(root);

        // Setup surfaces
        this.surfaces = new THREE.Group();
        this.setupSurfaces(dim);

        // Setup rays
        this.validRays = new THREE.Group();
        this.blockedRays = new THREE.Group();
        this.outputRays = new THREE.Group();

        // Setup points
        this.points = new THREE.Group();
        this.setupPoints(dim);

        // Setup arrows
        this.arrows = new THREE.Group();
        this.setupArrows(dim);

        // Setup axes helper
        this.otherAxes = new THREE.Group();
        if (dim == 2) {
            this.otherAxes.add(
                makeLine2([0, -500, 0], [0, 500, 0], "#e3e3e3")
            );
        } else if (dim == 3) {
            const axesHelper = new THREE.AxesHelper(5);
            this.otherAxes.add(axesHelper);
        }
        

        // Setup optical axis
        this.opticalAxis = new THREE.Group();
        this.opticalAxis.add(
            makeLine2([-500, 0, 0], [500, 0, 0], "#e3e3e3")
        );

        // Title
        this.title = root.title ?? "";

        // Setup the actual THREE scene
        this.scene.add(this.surfaces);
        this.scene.add(this.otherAxes);
        this.scene.add(this.opticalAxis);

        // Default for gui
        this.opticalAxis.visible = false;
        this.otherAxes.visible = false;
    }

    public setupValidRays(color: ColorOption) {
        this.validRays?.removeFromParent();
        this.validRays = new THREE.Group();
        this.validRays.add(this.setupRaysLayer(0, color));
        this.validRays.add(this.setupRaysLayer(1, color));
        this.scene.add(this.validRays);
    }

    public setupBlockedRays(color: ColorOption) {
        this.blockedRays?.removeFromParent();
        this.blockedRays = this.setupRaysLayer(2, color);
        this.scene.add(this.blockedRays);
    }

    public setupOutputRays(color: ColorOption) {
        this.outputRays?.removeFromParent();
        this.outputRays = this.setupRaysLayer(3, color);
        this.scene.add(this.outputRays);
    }

    public setupPoints(dim: number) {
        this.points?.removeFromParent();
        this.points = new THREE.Group();

        const data = get_required(this.root, "data");

        for (const element of data) {
            if (get_required(element, "type") == "points") {
                this.points.add(makePoints(element, dim));
            }
        }
        this.scene.add(this.points);
    }

    public setupArrows(dim: number) {
        this.arrows?.removeFromParent();
        this.arrows = new THREE.Group();

        const data = get_required(this.root, "data");

        for (const element of data) {
            if (get_required(element, "type") == "arrows") {
                this.points.add(makeArrows(element, dim));
            }
        }
        this.scene.add(this.arrows);
    }

    public setupRaysLayer(layer: number, color: ColorOption) {
        const group = new THREE.Group();

        const data = get_required(this.root, "data");

        for (const element of data) {
            if (get_required(element, "type") == "rays") {
                // TODO support only one layer per node
                const dataLayer = (element["layers"] ?? [0])[0];
                if (dataLayer === layer) {
                    group.add(makeRays(element, this.dim, color));
                }
            }
        }

        return group;
    }

    public setupSurfaces(dim: number) {
        // Setup all nodes except for rays
        this.surfaces?.removeFromParent();
        this.surfaces = new THREE.Group();

        const data = get_required(this.root, "data");

        for (const element of data) {
            if (get_required(element, "type") == "surfaces") {
                const elem = makeSurfaces(element, dim);
                this.surfaces.add(elem);
            }
        }
    }

    public setSurfacesColor(color: THREE.Color): void {
        this.surfaces.traverse((child: THREE.Object3D) => {
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

    public setRaysOpacity(opacity: number): void {
        const update = (child: THREE.Object3D) => {
            if (
                child instanceof THREE.Mesh &&
                child.material instanceof LineMaterial
            ) {
                (child.material as LineMaterial).opacity = opacity;
            }
        };

        this.validRays.traverse(update);
        this.blockedRays.traverse(update);
        this.outputRays.traverse(update);
    }

    public setRaysThickness(thickness: number): void {
        const update = (child: THREE.Object3D) => {
            if (
                child instanceof THREE.Mesh &&
                child.material instanceof LineMaterial
            ) {
                (child.material as LineMaterial).linewidth = thickness;
            }
        };

        this.validRays.traverse(update);
        this.blockedRays.traverse(update);
        this.outputRays.traverse(update);
    }

    public getBB(): THREE.Box3 {
        const bbox = new THREE.Box3();
        bbox.union(new THREE.Box3().setFromObject(this.surfaces));
        bbox.union(new THREE.Box3().setFromObject(this.validRays));
        bbox.union(new THREE.Box3().setFromObject(this.blockedRays));
        bbox.union(new THREE.Box3().setFromObject(this.outputRays));

        if (bbox.isEmpty()) {
            // make sure axes are visible in default empty view
            bbox.min = new THREE.Vector3(-10, -10, -10);
            bbox.max = new THREE.Vector3(10, 10, 10);
        }

        return bbox;
    }
}
