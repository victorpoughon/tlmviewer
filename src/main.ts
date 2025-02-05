import GUI from "lil-gui";

import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { TLMScene } from "./scene.ts";

import { get_default } from "./utility.ts";

import viewerTemplate from "./viewer.html?raw";
import "./viewer.css";

class ThreeJSApp {
    private scene: TLMScene;

    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    private controls: OrbitControls;
    private viewport: HTMLElement;
    private controller: any;

    constructor(
        container: HTMLElement,
        scene: TLMScene,
        camera: string
    ) {
        const viewport =
            container.getElementsByClassName("tlmviewer-viewport")[0];

        if (!(viewport instanceof HTMLElement))
            throw new Error(`Expected viewport to be an HTMLElement`);

        this.viewport = viewport;
        this.scene = scene;

        // Set up the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        const rect = container.getBoundingClientRect();
        console.log(rect);
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.localClippingEnabled = true;
        this.viewport.appendChild(this.renderer.domElement);

        // Setup the default camera
        if (camera === "orthographic") {
            [this.camera, this.controls] = this.setupOrthographicCamera();
        } else if (camera == "perspective") {
            [this.camera, this.controls] = this.setupPerspectiveCamera();
        } else if (camera === "XY") {
            [this.camera, this.controls] = this.setupXYCamera();
        } else {
            throw new Error(`Uknown camera type '${camera}'`);
        }

        this.guiDefaults();

        // LIL GUI
        const app = this;
        this.controller = {
            colorDim: app.scene.colorDim,
            resetView() {
                app.resetView();
            },
            backgroundColor: { r: 0, g: 0, b: 0 },
            showValidRays: true,
            showBlockedRays: false,
            showOutputRays: true,
            showKinematicJoints: false,
        };
        const gui = new GUI({ container: container, autoPlace: false });

        gui.add(this.controller, "colorDim", this.scene.variables)
            .name("Rays Color")
            .onChange((value: string) => {
                app.scene.setupRays(value);
            });
        gui.add(this.controller, "resetView").name("Reset Camera");
        gui.addColor(this.controller, "backgroundColor")
            .name("Background color")
            .onChange((value: object) => {
                
                app.scene.scene.background = new THREE.Color( // @ts-ignore
                    value.r, // @ts-ignore
                    value.g, // @ts-ignore
                    value.b  // @ts-ignore
                );
            });

        const folderShow = gui.addFolder("Visible");
        folderShow.add(this.scene.opticalAxis, "visible").name("Optical axis");
        folderShow.add(this.scene.otherAxes, "visible").name("Other axes");
        folderShow.add(this.controller, "showValidRays").name("Valid rays");
        folderShow.add(this.controller, "showBlockedRays").name("Blocked rays");
        folderShow.add(this.controller, "showOutputRays").name("Output rays");
        folderShow
            .add(this.controller, "showKinematicJoints")
            .name("Kinematic joints");

        folderShow.onChange((_: Object) => {
            app.updateCameraLayers();
        });
        gui.open(false);

        this.updateCameraLayers();
    }

    private updateCameraLayers() {
        const app = this;
        const setCameraLayer = function (flag: boolean, id: number) {
            if (flag) {
                app.camera.layers.enable(id);
            } else {
                app.camera.layers.disable(id);
            }
        };

        app.camera.layers.enable(0);
        setCameraLayer(this.controller.showValidRays, 1);
        setCameraLayer(this.controller.showBlockedRays, 2);
        setCameraLayer(this.controller.showOutputRays, 3);
        setCameraLayer(this.controller.showKinematicJoints, 4);
    }

    // Handle window resize events
    // @ts-ignore
    private onWindowResize(): void {
        const aspect = window.innerWidth / window.innerHeight;

        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.aspect = aspect;
        } else if (this.camera instanceof THREE.OrthographicCamera) {
            this.camera.left = -aspect * 10;
            this.camera.right = aspect * 10;
            this.camera.top = 10;
            this.camera.bottom = -10;
        }

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private resetView() {
        // Compute bounding box of scene (excluding axes and axes helpers)
        // note: precise=true seems broken for Line2, don't use precise
        const sceneBoundingBox = this.scene.getBB();

        const rect = this.viewport.getBoundingClientRect();
        const aspect = rect.width / rect.height;

        if (!(this.camera instanceof THREE.OrthographicCamera)) return;

        const center = new THREE.Vector3();
        sceneBoundingBox.getCenter(center);
        const size = new THREE.Vector3();
        sceneBoundingBox.getSize(size);
        const marginFactor = 1.15;

        this.camera.zoom = 1;
        // Update camera position
        this.camera.position.set(center.x, center.y, center.z + 100);
        // this.camera.lookAt(center);

        // Update camera edges
        if (size.x > aspect * size.y) {
            this.camera.left = (marginFactor * size.x) / -2;
            this.camera.right = (marginFactor * size.x) / 2;
            this.camera.top = (marginFactor * ((1 / aspect) * size.x)) / 2;
            this.camera.bottom = (marginFactor * ((1 / aspect) * size.x)) / -2;
        } else {
            this.camera.left = (marginFactor * (aspect * size.y)) / -2;
            this.camera.right = (marginFactor * (aspect * size.y)) / 2;
            this.camera.top = (marginFactor * size.y) / 2;
            this.camera.bottom = (marginFactor * size.y) / -2;
        }

        this.camera.updateProjectionMatrix();
        this.controls.update();

        this.controls.target = center;
    }

    private guiDefaults() {
        // Color dim
        if (this.scene.variables.includes("object")) {
            this.scene.setupRays("object");
        }

        // Visibility
        this.scene.opticalAxis.visible = false;
        this.scene.otherAxes.visible = false;
    }

    // The 2D camera
    private setupXYCamera(): [THREE.OrthographicCamera, OrbitControls] {
        const rect = this.viewport.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        const newCamera = new THREE.OrthographicCamera(
            -aspect * 10,
            aspect * 10,
            10,
            -10,
            -10000,
            10000
        );

        if (this.camera) {
            this.controls.dispose();
        }

        const newControls = new OrbitControls(
            newCamera,
            this.renderer.domElement
        );

        newControls.enableRotate = false;

        this.camera = newCamera;
        this.controls = newControls;

        this.resetView();

        return [newCamera, newControls];
    }

    private setupOrthographicCamera(): [
        THREE.OrthographicCamera,
        OrbitControls
    ] {
        const rect = this.viewport.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        const newCamera = new THREE.OrthographicCamera(
            -aspect * 10,
            aspect * 10,
            10,
            -10,
            -10000,
            10000
        );

        newCamera.position.set(10, 10, 10);
        newCamera.lookAt(0, 0, 0);

        if (this.camera) {
            this.controls.dispose();
        }

        const newControls = new OrbitControls(
            newCamera,
            this.renderer.domElement
        );

        return [newCamera, newControls];
    }

    private setupPerspectiveCamera(): [THREE.PerspectiveCamera, OrbitControls] {
        const rect = this.viewport.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        const newCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

        newCamera.position.set(10, 10, 10);
        newCamera.lookAt(0, 0, 0);

        if (this.camera) {
            this.controls.dispose();
        }

        const newControls = new OrbitControls(
            newCamera,
            this.renderer.domElement
        );

        return [newCamera, newControls];
    }

    public registerEventHandlers(container: HTMLElement): void {
        const resetViewButton = container.querySelector("button.reset-view");
        resetViewButton?.addEventListener("click", () => {
            this.resetView();
        });
    }

    // Start the animation loop
    public animate(): void {
        const loop = () => {
            this.controls.update(); // Update the controls for damping
            this.renderer.render(this.scene.scene, this.camera); // Render the scene
            requestAnimationFrame(loop); // Call the next frame
        };

        loop(); // Start the loop
    }
}

function setupApp(
    container: HTMLElement,
    data: any,
): ThreeJSApp {
    const mode = get_default(data, "mode", ["3D", "2D"]);
    const camera = get_default(data, "camera", [
        "orthographic",
        "perspective",
        "XY",
    ]);

    const scene = new TLMScene(data, mode === "3D" ? 3 : 2);

    const app = new ThreeJSApp(container, scene, camera);

    return app;
}

function tlmviewerRun(container: HTMLElement, data: any) {
    
    try {
        container.innerHTML = viewerTemplate;

        const app = setupApp(container, data);

        // Register event handlers
        app.registerEventHandlers(container);

        app.animate();
    } catch (error) {
        container.innerHTML = "tlmviewer error: " + error;
    }
}

function embed(container: HTMLElement, json_data: string) {
    try {
        const data = JSON.parse(json_data);
        tlmviewerRun(container, data);
    } catch (error) {
        container.innerHTML = "tlmviewer error: " + error;
    }
}

async function load(container: HTMLElement, url: string): Promise<void> {
    return fetch(url)
        .then((response) => response.json())
        .then((data) => tlmviewerRun(container, data));
}

// For each element with class "tlmviewer" in the document
// If it has a data-url attribute, use it to load tlmviewer
async function loadAll(): Promise<Promise<void>[]> {
    const elements = document.querySelectorAll('.tlmviewer');
    const promises: Promise<void>[] = [];

    // For each ".tlmviewer" element, load tlmviewer with the data-url attribute
    elements.forEach((element) => {
        const url = element.getAttribute('data-url');
        
        // Call the async load function and add the promise to the array
        if (url) {
            promises.push(load(element as HTMLElement, url));
        }
    });

    return promises;
}

export const tlmviewer = {
    embed: embed,
    load: load,
    loadAll: loadAll,
};

console.log("tlmviewer loaded");
