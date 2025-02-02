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
        camera: string,
        width: number,
        height: number
    ) {
        const viewport =
            container.getElementsByClassName("tlmviewer-viewport")[0];

        if (!(viewport instanceof HTMLElement))
            throw new Error(`Expected viewport to be an HTMLElement`);

        this.viewport = viewport;
        this.scene = scene;

        // Set up the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
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

        // LIL GUI
        const app = this;
        this.controller = {
            resetView() {
                app.resetView();
            },
            backgroundColor: { r: 0, g: 0, b: 0 },
        };
        const gui = new GUI({ container: container, autoPlace: false});
        gui.add(this.scene.opticalAxis, "visible").name("Show optical axis");
        gui.add(this.scene.otherAxes, "visible").name("Show other axes");
        gui.add(this.controller, "resetView").name("Reset View");
        gui.addColor(this.controller, 'backgroundColor' ).name('Background color').onChange( (value: object) => {
            // @ts-ignore
            app.scene.scene.background = new THREE.Color(value.r, value.g, value.b);
        } );
        // gui.open(false);

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
        // note: precise=true seems broken for Line2
        const sceneBoundingBox = new THREE.Box3().setFromObject(
            this.scene.model
        );

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
    width: number,
    height: number
) {
    const mode = get_default(data, "mode", ["3D", "2D"]);
    const camera = get_default(data, "camera", [
        "orthographic",
        "perspective",
        "XY",
    ]);

    const scene = new TLMScene(data, mode === "3D" ? 3 : 2);

    const app = new ThreeJSApp(
        container,
        scene,
        camera,
        width,
        height
    );

    return app;
}

// tlmviewer entry point
export function tlmviewer(container: HTMLElement, json_data: string) {
    // TODO get this from json
    const jsonWidth = 900;
    const jsonHeight = 600;

    try {
        const viewerElement = document.createElement("div");
        viewerElement.classList.add("tlmviewer");
        viewerElement.style.width = `{jsonWidth}px`;
        viewerElement.style.height = `{jsonHeight}px`;
        container.appendChild(viewerElement);

        viewerElement.innerHTML = viewerTemplate;

        const data = JSON.parse(json_data);
        const app = setupApp(viewerElement, data, jsonWidth, jsonHeight);

        // Register event handlers
        app.registerEventHandlers(container);

        app.animate();
    } catch (error) {
        container.innerHTML = "tlmviewer error: " + error;
    }
}

console.log("tlmviewer loaded");
