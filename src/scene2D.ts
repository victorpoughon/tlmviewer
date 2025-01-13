import * as THREE from "three";

// @ts-ignore
export function makeScene2D(data: any) {
    const scene = new THREE.Scene();

    // Axes helper
    if (data.show_axes ?? true) {
        //const axesHelper = new THREE.AxesHelper(5);
        //scene.add(axesHelper);
    }

    // Optical Axis
    if (data.show_optical_axis ?? true) {
        //scene.add(makeOpticalAxis(-500, 500));
    }

    return scene;
}
