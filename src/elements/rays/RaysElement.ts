import * as THREE from "three";

import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

import { CET_I2, colormap, wavelengthToRgb } from "../../color/index.ts";

import { getRequired } from "../../utility.ts";

import { AbstractSceneElement } from "../AbstractSceneElement.ts";

// Color option
// TODO move to viewerEvent.ts?
export type ColorOption = {
    show: boolean;
    colorDim: string | null;
    trueColor: boolean;
};

interface RaysData {
    points: number[][];
    color: string;
    variables: Record<string, number[]>;
    domain: Record<string, [number, number]>;
    layers: number[];
}

function makeRays(
    data: RaysData,
    dim: number,
    colorOption: ColorOption,
): THREE.Group {
    const { points, color: default_color, variables, domain } = data;
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
                `Invalid ray array length, got ${ray.length} for dim ${dim}`,
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
                        `${colorOption.colorDim} missing from ray domain object`,
                    );
                }
                const [min, max] = domain[colorOption.colorDim];
                const normalizedX = (() => {
                    if (max - min >= 0.001) {
                        return (
                            (variables[colorOption.colorDim][index] - min) /
                            (max - min)
                        );
                    }
                    return 0.5;
                })();
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
                THREE.SRGBColorSpace,
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
    readonly data: RaysData;

    static parse(raw: any): RaysData {
        return {
            points: getRequired<number[][]>(raw, "points"),
            color: raw.color ?? "#ffa724",
            variables: raw.variables ?? {},
            domain: raw.domain ?? {},
            layers: raw.layers ?? [0],
        };
    }

    constructor(
        data: RaysData,
        dim: number,
        container: HTMLElement,
        threeScene: THREE.Scene,
    ) {
        super(dim, container, threeScene);
        this.data = data;
        this.layer = data.layers[0];
        this.group = this.makeGroup();

        // Register event handlers
        this.addEventListener("setRaysOpacity", (e) =>
            this.setOpacity(e.value),
        );

        this.addEventListener("setRaysThickness", (e) =>
            this.setThickness(e.value),
        );

        this.addEventListener("setValidRaysColor", e => this.setupValidRays(e.value));
        this.addEventListener("setBlockedRaysColor", e => this.setupBlockedRays(e.value));
        this.addEventListener("setOutputRaysColor", e => this.setupOutputRays(e.value));
    }

    public setupValidRays(color: ColorOption) {
        this.setRaysColorOption(0, color);
        this.setRaysColorOption(1, color);
    }

    public setupBlockedRays(color: ColorOption) {
        this.setRaysColorOption(2, color);
    }

    public setupOutputRays(color: ColorOption) {
        this.setRaysColorOption(3, color);
    }

    public setRaysColorOption(layer: number, color: ColorOption) {
        if (this.layer === layer) {
                this.setColorOption(color);
            }
    }

    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "rays";
    }

    protected makeGroup(): THREE.Group {
        // Can't initially make the group from the element data
        // because we need the initial color options from the gui
        return new THREE.Group();
    }

    public setColorOption(color: ColorOption): void {
        this.group.clear();
        this.group.add(makeRays(this.data, this.dim, color));
    }

    public setOpacity(opacity: number): void {
        this.group.traverse((child: THREE.Object3D) => {
            if (
                child instanceof THREE.Mesh &&
                child.material instanceof LineMaterial
            ) {
                (child.material as LineMaterial).opacity = opacity;
            }
        });
    }

    public setThickness(thickness: number): void {
        this.group.traverse((child: THREE.Object3D) => {
            if (
                child instanceof THREE.Mesh &&
                child.material instanceof LineMaterial
            ) {
                (child.material as LineMaterial).linewidth = thickness;
            }
        });
    }
}
