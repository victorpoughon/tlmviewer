import * as THREE from "three";

import { get_required } from "./utility.ts";

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

// The four normal vectors for the four clipping planes
// used to make squared outlines around the X axis
const squareClipVectors = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
];

function makeSurfaces(element: any, _dim: number): THREE.Group {
    const data = get_required(element, "data");

    const group = new THREE.Group();

    for (const surface of data) {
        // TODO: check that points are all Y > 0
        const matrix = surface.matrix;
        const samples = surface.samples;
        const side_length = surface.side_length ?? undefined;
        const lathe = makeSurface(matrix, samples, side_length);
        group.add(lathe);
    }

    return group;
}

function makeSurface(
    matrix4: Array<Array<number>>,
    samples: Array<Array<number>>,
    side_length: number | undefined
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

    // If 'square' is in the data
    // form a square of the given side length
    // Side length of the clipping square
    const clipPlanes: THREE.Plane[] =
        side_length === undefined
            ? []
            : squareClipVectors.map(
                  (v) =>
                      new THREE.Plane(
                          v,
                          v
                              .clone()
                              .multiplyScalar(side_length / 2)
                              .length()
                      )
              );

    const material = new THREE.MeshNormalMaterial({
        side: THREE.DoubleSide,
        clippingPlanes: clipPlanes,
    });
    material.transparent = true;
    material.opacity = 0.8;
    const lathe = new THREE.Mesh(geometry, material);
    lathe.applyMatrix4(transform);
    return lathe;
}

function makePoints(element: any, _dim: number): THREE.Group {
    const vertices = get_required(element, "data");
    const color = element.color ?? "#ffffff";

    const group = new THREE.Group();
    for (const point of vertices) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);

        console.assert(point.length == 3);
        sphere.position.set(point[0], point[1], point[2]);

        group.add(sphere);
    }

    return group;
}

function makeArrows(element: any, _dim: number): THREE.Group {
    const arrows = get_required(element, "data");

    const group = new THREE.Group();

    for (const arrow of arrows) {
        const dir = new THREE.Vector3(...arrow.slice(0, 3));
        dir.normalize();
        const origin = new THREE.Vector3(...arrow.slice(3, 6));
        const length = arrow[6];
        const color = 0xffff00;

        const arrowHelper = new THREE.ArrowHelper(dir, origin, length, color);
        group.add(arrowHelper);
    }

    return group;
}

function makeRays(element: any, dim: number): THREE.Group {
    const data = get_required(element, "data");
    const color = element.color ?? "#ffa724";

    const group = new THREE.Group();

    for (const ray of data) {
        console.assert(ray.length == 6);
        var start, end;

        if (dim == 2) {
            start = ray.slice(0, 2);
            end = ray.slice(2, 4);
        } else {
            start = ray.slice(0, 3);
            end = ray.slice(3, 6);
        }
        const line = makeLine(start, end, color);
        group.add(line);
    }

    return group;
}

function makeElement(element: any, dim: number): THREE.Group {
    const type: string = get_required(element, "type");

    type MakerFunction = (element: any, _dim: number) => THREE.Group;
    const makers: { [key: string]: MakerFunction } = {
        rays: makeRays,
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

export function makeScene(root: any, dim: number) {
    const scene = new THREE.Scene();

    const data = get_required(root, "data");

    for (const element of data) {
        scene.add(makeElement(element, dim));
    }

    // Axes helper
    if (data.show_axes ?? true) {
        if (dim == 2) {
            scene.add(makeLine([0, -500, 0], [0, 500, 0], "white"));
        } else if (dim == 3) {
            const axesHelper = new THREE.AxesHelper(5);
            scene.add(axesHelper);
        }
    }

    // Optical Axis
    if (data.show_optical_axis ?? true) {
        scene.add(makeLine([-500, 0, 0], [500, 0, 0], "white"));
    }

    return scene;
}
