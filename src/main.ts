import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";


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
    const rect = container.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height);
    this.container.appendChild(this.renderer.domElement);

    // Setup the default perspective camera
    [this.camera, this.controls] = this.setupPerspectiveCamera();

    //[this.camera, this.controls] = this.setupOrthographicCamera();

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

  // @ts-ignore
  private setupOrthographicCamera(): [
    THREE.PerspectiveCamera | THREE.OrthographicCamera,
    OrbitControls
  ] {
    const rect = this.container.getBoundingClientRect();
    const aspect = rect.width / rect.height;
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

  // @ts-ignore
  private setupPerspectiveCamera(): [
    THREE.PerspectiveCamera | THREE.OrthographicCamera,
    OrbitControls
  ] {
    const rect = this.container.getBoundingClientRect();
    const aspect = rect.width / rect.height;
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

function makeSurface(position: [number, number, number], samples: Array<Array<number>>) {
  const segments = 50;
  // threejs lathe surface makes a revolution around the Y axis
  // but we want a revolution around the X axis
  // So the procedure is:
  // 1. Swap X/Y coordinates (mirror about the X=Y line)
  // 2. Ask threejs to create the 3D geometry by lathe around the Y axis
  // 3. Swap back by mirroring around the X=Y plane



  const flip = new THREE.Matrix4(0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

  const tpoints = samples.map((p) => new THREE.Vector2(p[1], p[0]));

  const geometry = new THREE.LatheGeometry(tpoints, segments);
  const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  const lathe = new THREE.Mesh(geometry, material);
  lathe.applyMatrix4(flip);
  lathe.position.set(...position);
  return lathe;
}

function makePoints(vertices: Array<number>) {
  console.log(vertices);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff });
  const points = new THREE.Points(geometry, material);
  return points;
}

function makeScene(data: any) {
  const scene = new THREE.Scene();

  if ('rays' in data) {
    for (const ray of data["rays"]) {
      const start = ray[0];
      const end = ray[1];

      const line = makeLine(start, end);
      scene.add(line);
    }
  }

  if ('surfaces' in data) {
    for (const surface of data["surfaces"]) {
      // TODO: check that points are all Y > 0
      const position = surface["position"];
      const samples = surface["samples"];
      const lathe = makeSurface(position, samples);
      scene.add(lathe);
    }
  }

  // Points
  if ('points' in data) {
    console.log("adding points");
    const vertices = data["points"];
    scene.add(makePoints(vertices));

  }
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  return scene;
}

// tlmviewer entry point
export function tlmviewer(container: HTMLElement, data: any) {

  try {

    const scene = makeScene(data);
    
    const app = new ThreeJSApp(container, scene);
    app.animate();
  } catch(error) {
    container.innerHTML = "tlmviewer error: " + error;
  }
}

console.log("tlmviewer loaded");