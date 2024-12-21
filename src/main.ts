import "./style.css";
import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import Stats from "three/addons/libs/stats.module.js";

import { GUI } from "dat.gui";

class ThreeJSApp {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private controls: OrbitControls;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // Set up the scene
    this.scene = new THREE.Scene();

    // Set up the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    // Setup the default perspective camera
    [this.camera, this.controls] = this.setupPerspectiveCamera();

    // Add a default object
    this.addDefaultGeometry();

    // Handle window resizing
    window.addEventListener("resize", this.onWindowResize.bind(this));

    const setCamera = {
      orthographic: () => {
        [this.camera, this.controls] = this.setupOrthographicCamera();
      },
      perspective: () => {
        [this.camera, this.controls] = this.setupPerspectiveCamera();
      },
    };

    const gui = new GUI();
    const cameraFolder = gui.addFolder("Camera");
    cameraFolder.add(setCamera, "orthographic").name("Orthographic");
    cameraFolder.add(setCamera, "perspective").name("Perspective");
  }

  // Add a default geometry (a rotating cube)
  private addDefaultGeometry(): void {
    const points = [];
    for (let i = 0; i < 10; i++) {
      points.push(new THREE.Vector2(Math.sin(i * 0.2) * 10 + 5, (i - 5) * 2));
    }
    const geometry = new THREE.LatheGeometry(points);
    const material = new THREE.MeshNormalMaterial({ wireframe: true });
    const lathe = new THREE.Mesh(geometry, material);
    this.scene.add(lathe);

    const axesHelper = new THREE.AxesHelper( 5 );
    this.scene.add( axesHelper );
  }

  // Handle window resize events
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

  private setupOrthographicCamera(): [
    THREE.PerspectiveCamera | THREE.OrthographicCamera,
    OrbitControls
  ] {
    const aspect = window.innerWidth / window.innerHeight;
    const newCamera = new THREE.OrthographicCamera(
      -aspect * 10,
      aspect * 10,
      10,
      -10,
      0.1,
      1000
    );

    newCamera.position.set(10, 10, 10);
    newCamera.lookAt(0, 0, 0);

    if (this.camera) {
      this.controls.dispose();
    }

    const newControls = new OrbitControls(newCamera, this.renderer.domElement);
    return [newCamera, newControls];
  }

  private setupPerspectiveCamera(): [
    THREE.PerspectiveCamera | THREE.OrthographicCamera,
    OrbitControls
  ] {
    const aspect = window.innerWidth / window.innerHeight;
    const newCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

    newCamera.position.set(10, 10, 10);
    newCamera.lookAt(0, 0, 0);

    if (this.camera) {
      this.controls.dispose();
    }

    const newControls = new OrbitControls(newCamera, this.renderer.domElement);
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

// Initialize the app
const container = document.body; // Or a specific DOM element
const app = new ThreeJSApp(container);
app.animate(); // Start the animation loop
