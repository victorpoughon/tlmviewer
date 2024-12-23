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

  constructor(container: HTMLElement, scene: THREE.Scene) {
    this.container = container;

    // Set up the scene
    this.scene = scene;

    // Set up the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    // Setup the default perspective camera
    [this.camera, this.controls] = this.setupPerspectiveCamera();

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

function makeLine(start: Array<number>, end: Array<number>) {
  const material = new THREE.LineBasicMaterial({ color: 0xffa724 });

  const points = [];
  points.push(new THREE.Vector3().fromArray(start));
  points.push(new THREE.Vector3().fromArray(end));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
}

function makeSurface(points: Array<Array<number>>) {
  const segments = 50;
  // threejs lathe surface makes a revolution around the Y axis
  // but we want a revolution around the X axis
  // So the procedure is:
  // 1. Swap X/Y coordinates (mirror about the X=Y line)
  // 2. Ask threejs to create the 3D geometry by lathe around the Y axis
  // 3. Swap back by mirroring around the X=Y plane

  const flip = new THREE.Matrix4(0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

  const tpoints = points.map((p) => new THREE.Vector2(p[1], p[0]));

  const geometry = new THREE.LatheGeometry(tpoints, segments);
  const material = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
  const lathe = new THREE.Mesh(geometry, material);
  lathe.applyMatrix4(flip);
  lathe.position.x = 10;
  return lathe;
}

function makeScene(data: any) {
  const scene = new THREE.Scene();

  for (const ray of data["rays"]) {
    const start = ray[0];
    const end = ray[1];

    const line = makeLine(start, end);
    scene.add(line);
  }

  for (const points of data["surfaces"]) {
    const lathe = makeSurface(points);
    scene.add(lathe);
  }

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  return scene;
}

// tlmviewer entry point
export function tlmviewer(data: any) {
  const scene = makeScene(data);

  // Initialize the app
  const container = document.body;
  const app = new ThreeJSApp(container, scene);
  app.animate();
}
