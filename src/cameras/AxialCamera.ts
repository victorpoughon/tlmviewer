import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { CameraRig } from "./CameraRig.ts";

export function createAxialCamera(domElement: HTMLElement): CameraRig {
    const camera = new THREE.OrthographicCamera(
        -10,
        10,
        10,
        -10,
        -10000,
        10000,
    );
    camera.position.set(0, 50, 50);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, domElement);
    controls.enablePan = false; // Replaced by custom X-axis pan below

    // Enforce target on X axis after any orbit change
    controls.addEventListener("change", () => {
        controls.target.y = 0;
        controls.target.z = 0;
    });

    // Custom right-click pan: move camera and target along world X only.
    // We project the 2D screen-space drag vector onto the world X axis using the
    // camera's screen-right and screen-up directions, so panning always feels
    // natural regardless of orbit angle (including near-end-on views where X
    // appears vertical on screen).
    let panStart = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
        if (e.button === 2) panStart.set(e.clientX, e.clientY);
    };

    const onPointerMove = (e: PointerEvent) => {
        if (!(e.buttons & 2)) return; // right button not held

        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y; // positive = downward in screen space
        panStart.set(e.clientX, e.clientY);

        const scale =
            (camera.right - camera.left) /
            (camera.zoom * domElement.clientWidth);

        // Camera basis vectors in world space.
        // cameraRight  = screen-right direction in world
        // cameraScreenUp = screen-up direction in world (NOT camera.up = world Y)
        const worldY = new THREE.Vector3(0, 1, 0);
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const cameraRight = new THREE.Vector3()
            .crossVectors(forward, worldY)
            .normalize();

        const cameraScreenUp = new THREE.Vector3()
            .crossVectors(cameraRight, forward)
            .normalize();

        // Least-squares inverse mapping from screen drag (dx, dy) to world X shift.
        //
        // Moving the camera by Δx along world X shifts a fixed world point on screen by:
        //   Δscreen = (-cameraRight.x · Δx, +cameraScreenUp.x · Δx) / scale
        //
        // Solving for Δx given the observed drag (dx, dy):
        //   Δx = (-cameraRight.x·dx + cameraScreenUp.x·dy) / (cameraRight.x² + cameraScreenUp.x²) · scale
        //
        // The denominator is cos²(angle between view direction and world X). It amplifies
        // the shift at shallow angles so the drag always feels like grabbing the scene content.
        // It also goes to zero when X is pure depth (end-on view), in which case we skip.
        const num = -cameraRight.x * dx + cameraScreenUp.x * dy;
        const denom = cameraRight.x ** 2 + cameraScreenUp.x ** 2;
        if (denom < 1e-6) return;
        const xShift = (num / denom) * scale;

        controls.target.x += xShift;
        camera.position.x += xShift;
        controls.update();
    };

    domElement.addEventListener("pointerdown", onPointerDown);
    domElement.addEventListener("pointermove", onPointerMove);

    return {
        camera,
        controls,

        fitToBox(bbox: THREE.Box3, aspect: number): void {
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const marginFactor = 1.15;

            camera.zoom = 1;
            controls.target.set(center.x, 0, 0);
            camera.position.set(center.x, 0, 100);

            if (size.x > aspect * size.y) {
                camera.left = (marginFactor * size.x) / -2;
                camera.right = (marginFactor * size.x) / 2;
                camera.top = (marginFactor * ((1 / aspect) * size.x)) / 2;
                camera.bottom = (marginFactor * ((1 / aspect) * size.x)) / -2;
            } else {
                camera.left = (marginFactor * (aspect * size.y)) / -2;
                camera.right = (marginFactor * (aspect * size.y)) / 2;
                camera.top = (marginFactor * size.y) / 2;
                camera.bottom = (marginFactor * size.y) / -2;
            }

            camera.updateProjectionMatrix();
            controls.update();
        },

        onResize(width: number, height: number): void {
            const aspect = width / height;
            camera.left = -aspect * 10;
            camera.right = aspect * 10;
            camera.top = 10;
            camera.bottom = -10;
            camera.updateProjectionMatrix();
        },

        dispose(): void {
            domElement.removeEventListener("pointerdown", onPointerDown);
            domElement.removeEventListener("pointermove", onPointerMove);
            controls.dispose();
        },
    };
}
