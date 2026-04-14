import * as THREE from "three";

import { getRequired } from "./utility.ts";

// Scene elements
import {
    AbstractSceneElement,
    ArrowsElement,
    BcylElement,
    Box3DElement,
    ColorOption,
    PointsElement,
    RaysElement,
    SurfaceBaseElement,
    SurfaceLatheElement,
    SurfacePlaneElement,
    SurfaceSagElement,
    SurfaceSphereRElement,
} from "./elements/index.ts";
import { makeLine2 } from "./lineUtils.ts";
import { ViewerEvent } from "./viewerEvent.ts";

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

// Return the list of matching elemnt types for a given json object
function matchingElementTypes(elementData: any) {
    const sceneElementTypes = [
        PointsElement,
        ArrowsElement,
        SurfaceLatheElement,
        SurfacePlaneElement,
        SurfaceSphereRElement,
        SurfaceSagElement,
        RaysElement,
        BcylElement,
        Box3DElement,
    ];

    const matches = [];
    for (const type of sceneElementTypes) {
        if (type.match(elementData)) {
            matches.push(type);
        }
    }
    return matches;
}

export class TLMScene {
    private root: any;
    private container: HTMLElement;

    // Model
    public sceneGraph: THREE.Group;

    public ambientLight: THREE.Light;
    public directionalLight: THREE.Light;

    public opticalAxis: THREE.Group;
    public otherAxes: THREE.Group;

    public scene: THREE.Scene;

    public variables: string[];
    public title: string;

    constructor(root: any, dim: number, container: HTMLElement) {
        this.root = root;
        this.container = container;
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

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.directionalLight.position.set(100, 100, 100);
        this.scene.add(this.directionalLight);

        // Default for gui
        this.opticalAxis.visible = false;
        this.otherAxes.visible = false;
    }

    public initSceneGraph(dim: number) {
        // For any element type that matches with the element data
        // Use it to make a threejs group add add it to the scene

        const elements = getRequired<any[]>(this.root, "data");
        for (const elementData of elements) {
            const matches = matchingElementTypes(elementData);

            // Emit a warning for unknown element types
            if (matches.length === 0) {
                console.warn(
                    `tlmviewer: Unknown scene element ${JSON.stringify(elementData)}`,
                );
            }

            for (const type of matches) {
                // Create the threeJS group that represents the element
                // and store the Element object in its userData
                const data = (type as any).parse(elementData);
                const instance = new type(
                    data,
                    dim,
                    this.container,
                    this.scene,
                );
                if (instance.group) {
                    instance.group.userData = instance;
                    this.sceneGraph.add(instance.group);
                } else {
                    console.warn(
                        `tlmviewer: Element did not create a scene group: ${JSON.stringify(elementData)}`,
                    );
                }
            }
        }
    }

    // Call a function on all elements of the scene graph matching a given
    // subtype of AbstractSceneElement
    public updateElements<T extends AbstractSceneElement>(
        type: Function & { prototype: T },
        f: (element: T) => void,
    ): void {
        this.sceneGraph.traverse((child: THREE.Object3D) => {
            if (child.userData instanceof type) {
                const element = child.userData as T;
                f(element);
            }
        });
    }

    public dispatch(event: ViewerEvent): void {
        this.sceneGraph.traverse((child: THREE.Object3D) => {
            if (child.userData instanceof AbstractSceneElement) {
                child.userData.onEvent(event);
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
        this.updateElements(RaysElement, (element: RaysElement) => {
            if (element.layer === layer) {
                element.setColorOption(color);
            }
        });
    }

    public setSurfacesColor(color: THREE.Color): void {
        this.updateElements(
            SurfaceBaseElement,
            (element: SurfaceBaseElement) => {
                element.setColor(color);
            },
        );
    }

    public setSurfacesVisible(visible: boolean): void {
        this.updateElements(
            SurfaceBaseElement,
            (element: SurfaceBaseElement) => {
                element.setVisible(visible);
            },
        );
    }

    public setBcylVisible(visible: boolean): void {
        this.updateElements(BcylElement, (element: BcylElement) => {
            element.setVisible(visible);
        });
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
