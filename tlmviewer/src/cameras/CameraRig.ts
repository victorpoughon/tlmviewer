import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export interface CameraRig {
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    controls: OrbitControls;

    // Fit the camera to a bounding box
    fitToBox(bbox: THREE.Box3, viewportAspect: number): void;

    // Handle viewport resize
    onResize(width: number, height: number): void;

    // Cleanup
    dispose(): void;
}
