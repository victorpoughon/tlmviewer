import * as THREE from "three";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

import { CET_I2 } from "../CET_I2.ts";
import { colormap } from "../color.ts";
import { wavelengthToRgb } from "../true_color.ts";

import { getRequired } from "../utility.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";

// Color option
export type ColorOption = {
    show: boolean;
    colorDim: string | null;
    trueColor: boolean;
};

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
        transparent: true,
    });

    const points = [];
    points.push(new THREE.Vector3().fromArray(start));
    points.push(new THREE.Vector3().fromArray(end));

    const geometry = new LineGeometry().setFromPoints(points);
    const ret = new Line2(geometry, material);

    return ret;
}

function makeRays(
    element: any,
    dim: number,
    colorOption: ColorOption
): THREE.Group {
    const points = getRequired<number[][]>(element, "points");
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

    // POSITION DATA
    const positions = [];
    for (const [_, ray] of points.entries()) {
        if (ray.length != expectedLength) {
            throw new Error(
                `Invalid ray array length, got ${ray.length} for dim ${dim}`
            );
        }

        if (dim == 2) {
            positions.push(ray[0], ray[1], 0, ray[2], ray[3], 0);
        } else {
            positions.push(ray[0], ray[1], ray[2], ray[3], ray[4], ray[5]);
        }
    }

    // COLOR DATA
    const colors = [];
    var use_default_color: boolean = true;

    // Default color
    if (colorOption.colorDim == null) {
        // || !variables.hasOwnProperty(colorOption.colorDim
        use_default_color = true;
    }
    // Color from variable data
    else {
        use_default_color = false;
        for (const [index, _] of points.entries()) {
            var color: Array<number>;

            if (colorOption.trueColor == false) {
                if (!domain.hasOwnProperty(colorOption.colorDim)) {
                    throw new Error(
                        `${colorOption.colorDim} missing from ray domain object`
                    );
                }
                const [min, max] = domain[colorOption.colorDim];
                const normalizedX =
                    (variables[colorOption.colorDim][index] - min) /
                    (max - min);
                color = colormap(normalizedX, CET_I2);
            } else {
                // true color
                const wavelength = variables[colorOption.colorDim][index];
                color = wavelengthToRgb([wavelength])[0];
            }

            const linear_color = new THREE.Color().setRGB(
                color[0],
                color[1],
                color[2],
                THREE.SRGBColorSpace
            );

            colors.push(...linear_color.toArray(), ...linear_color.toArray());
        }
    }

    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);

    if (!use_default_color) {
        geometry.setColors(colors);
    }

    const material = new LineMaterial({
        ...(use_default_color ? { color: default_color } : {}),
        linewidth: 1,
        vertexColors: !use_default_color,
        dashed: false,
        transparent: true,
    });

    const lines = new LineSegments2(geometry, material);
    group.add(lines);

    // Dont apply layers because visiblity is handled by not setting up the rays at all

    return group;
}

export class RaysElement extends AbstractSceneElement {
    readonly layer: number;
    constructor(elementData: any, dim: number) {
        super(elementData, dim);

        // TODO replace layer system by categories declared in the data
        this.layer = (elementData["layers"] ?? [0])[0];
    }

    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "rays";
    }

    public makeGroup(): THREE.Group {
        // Can't initially make the group from the element data
        // because we need the initial color options from the gui
        return new THREE.Group();
    }

    public setColorOption(group: THREE.Group, color: ColorOption): void {
        group.clear();
        group.add(makeRays(this.elementData, this.dim, color));
    }

    public setOpacity(group: THREE.Group, opacity: number): void {
        group.traverse((child: THREE.Object3D) => {
            if (
                child instanceof THREE.Mesh &&
                child.material instanceof LineMaterial
            ) {
                (child.material as LineMaterial).opacity = opacity;
            }
        });
    }

    public setThickness(group: THREE.Group, thickness: number): void {
        group.traverse((child: THREE.Object3D) => {
            if (
                child instanceof THREE.Mesh &&
                child.material instanceof LineMaterial
            ) {
                (child.material as LineMaterial).linewidth = thickness;
            }
        });
    }
}
