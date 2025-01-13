import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { makeScene3D } from "./scene3D.ts";
import { makeScene2D } from "./scene2D.ts";

import { get_default } from "./utility.ts";

class ThreeJSApp {
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    private controls: OrbitControls;
    private container: HTMLElement;

    constructor(container: HTMLElement, scene: THREE.Scene, camera: string) {
        this.container = container;

        // Set up the scene
        this.scene = scene;

        // Set up the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        const rect = container.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.localClippingEnabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Setup the default perspective camera
        if (camera === "orthographic") {
            [this.camera, this.controls] = this.setupOrthographicCamera();
        } else if (camera == "perspective") {
            [this.camera, this.controls] = this.setupPerspectiveCamera();
        } else if (camera === "XY") {
            [this.camera, this.controls] = this.setupXYCamera();
        } else {
            throw new Error(`Uknown camera type '${camera}'`);
        }

        // Handle window resizing
        //window.addEventListener("resize", this.onWindowResize.bind(this));
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

    // The 2D camera
    private setupXYCamera(): [THREE.OrthographicCamera, OrbitControls] {
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        const newCamera = new THREE.OrthographicCamera(
            -aspect * 10,
            aspect * 10,
            10,
            -10,
            -10000,
            10000
        );

        newCamera.position.set(0, 0, 10);
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

    private setupOrthographicCamera(): [
        THREE.OrthographicCamera,
        OrbitControls
    ] {
        const rect = this.container.getBoundingClientRect();
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
        const rect = this.container.getBoundingClientRect();
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

    // Start the animation loop
    public animate(): void {
        const loop = () => {
            this.controls.update(); // Update the controls for damping
            this.renderer.render(this.scene, this.camera); // Render the scene
            requestAnimationFrame(loop); // Call the next frame
        };

        loop(); // Start the loop
    }
}

function setupApp(container: HTMLElement, data: any) {
    const mode = get_default(data, "mode", ["3D", "2D"]);
    const camera = get_default(data, "camera", [
        "orthographic",
        "perspective",
        "XY",
    ]);

    var scene: THREE.Scene;
    if (mode === "3D") {
        scene = makeScene3D(data);
    } else if (mode === "2D") {
        scene = makeScene2D(data);
    } else {
        throw new Error("Uknown scene mode " + mode);
    }

    const app = new ThreeJSApp(container, scene, camera);

    return app;
}

// tlmviewer entry point
export function tlmviewer(container: HTMLElement, json_data: string) {
    try {
        const data = JSON.parse(json_data);
        const app = setupApp(container, data);
        app.animate();
    } catch (error) {
        container.innerHTML = "tlmviewer error: " + error;
    }
}

console.log("tlmviewer loaded");
