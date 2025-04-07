import * as THREE from "three";

import { getRequired } from "./utility.ts";

// Scene elements
import { AbstractSceneElement } from "./elements/AbstractSceneElement.ts";
import { ArrowsElement } from "./elements/ArrowsElement.ts";
import { PointsElement } from "./elements/PointsElement.ts";
import { SurfaceBaseElement } from "./elements/SurfaceBaseElement.ts";
import { SurfaceLatheElement } from "./elements/SurfaceLatheElement.ts";
import { SurfacePlaneElement } from "./elements/SurfacePlaneElement.ts";
import { SurfaceSphereRElement } from "./elements/SurfaceSphereRElement.ts";
import { SurfaceSagElement } from "./elements/SurfaceSagElement.ts";
import { RaysElement, makeLine2, ColorOption } from "./elements/RaysElement.ts";

// Extract available variables from the scene
function extractVariables(root: any): string[] {
    const variables: Set<string> = new Set([]);

    const data = getRequired<any[]>(root, "data");
    for (const element of data) {
        if (getRequired<string>(element, "type") == "rays") {
            const thisVars = element.variables ?? {};
            Object.keys(thisVars).forEach((v: string) => variables.add(v));
        }
    }

    return Array.from(variables);
}

export class TLMScene {
    private root: any;

    // Model
    public sceneGraph: THREE.Group;

    // public ambientLight: THREE.Light;
    // public directionalLight: THREE.Light;

    public opticalAxis: THREE.Group;
    public otherAxes: THREE.Group;

    public scene: THREE.Scene;

    public variables: string[];
    public title: string;

    constructor(root: any, dim: number) {
        this.root = root;
        this.scene = new THREE.Scene();

        this.variables = extractVariables(root);

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

        // this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        // this.scene.add(this.ambientLight);

        // this.directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
        // this.scene.add(this.directionalLight);

        // Default for gui
        this.opticalAxis.visible = false;
        this.otherAxes.visible = false;
    }

    public initSceneGraph(dim: number) {
        const sceneElementTypes = [
            PointsElement,
            ArrowsElement,
            SurfaceLatheElement,
            SurfacePlaneElement,
            SurfaceSphereRElement,
            SurfaceSagElement,
            RaysElement,
        ];

        const matchElementType = (elementData: any) => {
            for (const type of sceneElementTypes) {
                if (type.match(elementData)) {
                    return type;
                }
            }
            return null;
        };

        const data = getRequired<any[]>(this.root, "data");
        for (const elementData of data) {
            // Find element type
            const type = matchElementType(elementData);

            if (type === null) {
                // Emit a warning for unknown element types
                console.warn(
                    `tlmviewer: Unknown scene element type ${getRequired<string>(
                        elementData,
                        "type"
                    )}`
                );
            } else {
                // Create the threeJS group that represents the element
                // and store the Element object in its userData
                const instance = new type(elementData, dim);
                const obj = instance.makeGroup();
                obj.userData = instance;
                this.sceneGraph.add(obj);
            }
        }
    }

    // Call a function on all elements of the scene graph matching a given
    // subtype of AbstractSceneElement
    public updateElements<T extends AbstractSceneElement>(
        type: Function & { prototype: T },
        f: (group: THREE.Group, element: T) => void
    ): void {
        this.sceneGraph.traverse((child: THREE.Object3D) => {
            if (child.userData instanceof type) {
                const element = child.userData as T;
                f(child as THREE.Group, element);
            }
        });
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
        this.updateElements(
            RaysElement,
            (group: THREE.Group, element: RaysElement) => {
                if (element.layer === layer) {
                    element.setColorOption(group, color);
                }
            }
        );
    }

    public setRaysOpacity(opacity: number): void {
        this.updateElements(
            RaysElement,
            (group: THREE.Group, element: RaysElement) => {
                element.setOpacity(group, opacity);
            }
        );
    }

    public setRaysThickness(thickness: number): void {
        this.updateElements(
            RaysElement,
            (group: THREE.Group, element: RaysElement) => {
                element.setThickness(group, thickness);
            }
        );
    }

    public setSurfacesColor(color: THREE.Color): void {
        this.updateElements(
            SurfaceBaseElement,
            (group: THREE.Group, element: SurfaceBaseElement) => {
                element.setColor(group, color);
            }
        );
    }

    public getBB(): THREE.Box3 {
        const bbox = new THREE.Box3();
        bbox.union(new THREE.Box3().setFromObject(this.sceneGraph));

        if (bbox.isEmpty()) {
            // make sure axes are visible in default empty view
            bbox.min = new THREE.Vector3(-10, -10, -10);
            bbox.max = new THREE.Vector3(10, 10, 10);
        }

        return bbox;
    }
}
