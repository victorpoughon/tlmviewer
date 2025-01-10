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
    this.renderer.localClippingEnabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Setup the default perspective camera
    //[this.camera, this.controls] = this.setupPerspectiveCamera();

    [this.camera, this.controls] = this.setupOrthographicCamera();

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
      -10000,
      10000
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


function makeLine(ray: number[], color: string) {
  console.assert(ray.length == 6);

  const material = new THREE.LineBasicMaterial({ color: color });

  const points = [];
  points.push(new THREE.Vector3().fromArray(ray.slice(0, 3)));
  points.push(new THREE.Vector3().fromArray(ray.slice(3, 6)));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
}


function arrayToMatrix4(array: Array<Array<number>>): THREE.Matrix4 {
  if (array.length !== 4 || array.some(row => row.length !== 4)) {
    throw new Error('Input must be a 4x4 array');
  }

  const matrix = new THREE.Matrix4();
  
  // Transpose the array (convert from row-major to column-major)
  const transposedArray = array[0].map((_, colIndex) => array.map(row => row[colIndex]));
  
  // Flatten the transposed array and create the Matrix4
  matrix.fromArray(transposedArray.flat());

  return matrix;
}

// The four normal vectors for the four clipping planes
// used to make squared outlines around the X axis
const squareClipVectors = [
  new THREE.Vector3( 0, 1, 0 ),
  new THREE.Vector3( 0, -1, 0 ),
  new THREE.Vector3( 0, 0, 1 ),
  new THREE.Vector3( 0, 0, -1 )
];

function makeSurface(matrix4: Array<Array<number>>, samples: Array<Array<number>>, side_length: number | undefined) {
  const segments = 50;
  // threejs lathe surface makes a revolution around the Y axis
  // but we want a revolution around the X axis
  // So the procedure is:
  // 1. Swap X/Y coordinates (mirror about the X=Y line)
  // 2. Ask threejs to create the 3D geometry by lathe around the Y axis
  // 3. Swap back by mirroring around the X=Y plane
  // 4. Compose with the matrix4 in the data


  // Make the composed transform
  const flip = new THREE.Matrix4(0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  const userTransform = arrayToMatrix4(matrix4);
  const transform = new THREE.Matrix4();
  transform.multiplyMatrices(userTransform, flip);

  const tpoints = samples.map((p) => new THREE.Vector2(p[1], p[0]));

  const geometry = new THREE.LatheGeometry(tpoints, segments);

  // If 'square' is in the data
  // form a square of the given side length
  // Side length of the clipping square
  const clipPlanes: THREE.Plane[] =
    side_length === undefined
      ? []
      : squareClipVectors.map(
          (v) =>
            new THREE.Plane(
              v,
              v
                .clone()
                .multiplyScalar(side_length / 2)
                .length()
            )
        );

  const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, clippingPlanes: clipPlanes });
  material.transparent = true;
  material.opacity = 0.8;
  const lathe = new THREE.Mesh(geometry, material);
  lathe.applyMatrix4(transform);
  return lathe;
}

// @ts-ignore
function makePoints(vertices: Array<number>) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1});
  const points = new THREE.Points(geometry, material);
  return points;
}

function makePointsSpheres(vertices: Array<[number, number, number]>, color: string) {
  const group = new THREE.Group();
  for (const point of vertices) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: color});
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(...point);

    group.add(sphere);
  }

  return group;
}

function makeArrows(
  arrows: Array<[number, number, number, number, number, number, number]>
) {
  const group = new THREE.Group();

  for (const arrow of arrows) {
    const dir = new THREE.Vector3(...arrow.slice(0, 3));
    dir.normalize();
    const origin = new THREE.Vector3(...arrow.slice(3, 6));
    const length = arrow[6];
    const color = 0xffff00;

    const arrowHelper = new THREE.ArrowHelper(dir, origin, length, color);
    group.add(arrowHelper);
  }

  return group;
}

function makeOpticalAxis(start: number, end: number) {
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });

  const points = [];
  points.push(new THREE.Vector3(start, 0, 0));
  points.push(new THREE.Vector3(end, 0, 0));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
}

function makeGroup(data_group: any) {
  const type = data_group["type"];
  const data = data_group["data"];

  const group = new THREE.Group();

  if (type == "rays") {
    for (const ray of data) {
      console.assert(ray.length == 6);
      const color = data_group.color ?? "#ffa724";
      const line = makeLine(ray, color);
      group.add(line);
    }
  }

  else if (type == 'surfaces') {
    for (const surface of data) {
      // TODO: check that points are all Y > 0
      const matrix = surface.matrix;
      const samples = surface.samples;
      const side_length = surface.side_length ?? undefined;
      const lathe = makeSurface(matrix, samples, side_length);
      group.add(lathe);
    }
  }

  // Points
  else if (type == 'points') {
    const color = data_group.color ?? "#ffffff";
    group.add(makePointsSpheres(data, color));

  }

  // Arrows
  else if (type == 'arrows') {
    group.add(makeArrows(data));
  }

  else {
    console.error("tlmviewer: unknown type: " + type);
  }

  return group;
}

function makeScene(data: any) {
  const scene = new THREE.Scene();

  for (const data_group of data) {
    scene.add(makeGroup(data_group));
  }

  // Axes helper
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // Optical Axis
  scene.add(makeOpticalAxis(-500, 500));

  return scene;
}

// tlmviewer entry point
export function tlmviewer(container: HTMLElement, json_data: string) {

  try {
    const data = JSON.parse(json_data);
    const scene = makeScene(data);
    
    const app = new ThreeJSApp(container, scene);
    app.animate();
  } catch(error) {
    container.innerHTML = "tlmviewer error: " + error;
  }
}

console.log("tlmviewer loaded");
