import * as THREE from "three";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

import { get_required } from "./utility.ts";
import { CET_I2 } from "./CET_I2.ts";

import { colormap } from "./color.ts";
import { wavelengthToRgb } from "./true_color.ts";

// Scene elements
import { AbstractSceneElement } from "./elements/AbstractSceneElement.ts";
import { ArrowsElement } from "./elements/ArrowsElement.ts";
import { PointsElement } from "./elements/PointsElement.ts";
import { LatheSurfacesElement } from "./elements/LatheSurfacesElement.ts";

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
    public validRays: THREE.Group;
    public blockedRays: THREE.Group;
    public outputRays: THREE.Group;
    public sceneGraph: THREE.Group;

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

        // Setup rays
        this.validRays = new THREE.Group();
        this.blockedRays = new THREE.Group();
        this.outputRays = new THREE.Group();

        // Setup scene graph
        this.sceneGraph = new THREE.Group();
        this.initSceneGraph(dim);

        // Setup axes helper
        this.otherAxes = new THREE.Group();
        if (dim == 2) {
            this.otherAxes.add(makeLine2([0, -500, 0], [0, 500, 0], "#e3e3e3"));
        } else if (dim == 3) {
            const axesHelper = new THREE.AxesHelper(5);
            this.otherAxes.add(axesHelper);
        }

        // Setup optical axis
        this.opticalAxis = new THREE.Group();
        this.opticalAxis.add(makeLine2([-500, 0, 0], [500, 0, 0], "#e3e3e3"));

        // Title
        this.title = root.title ?? "";

        // Setup the actual THREE scene
        this.scene.add(this.otherAxes);
        this.scene.add(this.opticalAxis);

        this.scene.add(this.sceneGraph);

        // Default for gui
        this.opticalAxis.visible = false;
        this.otherAxes.visible = false;
    }

    public initSceneGraph(dim: number) {
        const sceneElementTypes = [
            PointsElement,
            ArrowsElement,
            LatheSurfacesElement,
        ];

        const matchElementType = (elementData: any) => {
            for (const type of sceneElementTypes) {
                if (type.match(elementData)) {
                    return type;
                }
            }
            // for now we skip unknown elements
            // when migration is complete, this should be an error
            return null;
        };

        const data = get_required(this.root, "data");
        for (const elementData of data) {
            // Find element type
            const type = matchElementType(elementData);

            // TODO raise error instead
            if (type === null) {
                continue;
            }

            // Create the threeJS group that represents the element
            // and store the Element object in its userData
            const instance = new type(elementData, dim);
            const obj = instance.makeGroup();
            obj.userData = instance;
            this.sceneGraph.add(obj);
        }
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

    public setSurfacesColor(color: THREE.Color): void {
        this.sceneGraph.traverse((child: THREE.Object3D) => {
            if (child.userData instanceof LatheSurfacesElement) {
                const element = child.userData as LatheSurfacesElement;
                element.setColor(child as THREE.Group, color);
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
        bbox.union(new THREE.Box3().setFromObject(this.sceneGraph));
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
