import * as THREE from "three";

import { makeLine } from "./scene3D";

// @ts-ignore
export function makeScene2D(data: any) {
    const scene = new THREE.Scene();

    // Meridional axis
    if (data.show_axes ?? true) {
        scene.add(makeLine([0, -500, 0], [0, 500, 0], "white"));
    }

    // Optical Axis
    if (data.show_optical_axis ?? true) {
        scene.add(makeLine([-500, 0, 0], [500, 0, 0], "white"));
    }

    return scene;
}
