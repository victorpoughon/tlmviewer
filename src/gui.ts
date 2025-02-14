import * as THREE from "three";
import GUI from "lil-gui";

import { TLMScene } from "./scene.ts";
import { TLMViewerApp } from "./main.ts";

export class TLMGui {
    private app: TLMViewerApp;
    private scene: TLMScene;
    private controller: any;

    constructor(app: TLMViewerApp, container: HTMLElement, scene: TLMScene) {
        this.scene = scene;
        this.app = app;

        this.controller = {
            colorDim: this.scene.colorDim,
            resetView() {
                app.resetView();
            },
            backgroundColor: { r: 0, g: 0, b: 0 },
            showValidRays: true,
            showBlockedRays: false,
            showOutputRays: true,
            showKinematicJoints: false,
        };
        const gui = new GUI({ container: container, autoPlace: false });

        gui.add(this.controller, "colorDim", this.scene.variables)
            .name("Rays Color")
            .onChange((value: string) => {
                this.scene.setupRays(value);
            });
        gui.add(this.controller, "resetView").name("Reset Camera");
        gui.addColor(this.controller, "backgroundColor")
            .name("Background color")
            .onChange((value: object) => {
                this.scene.scene.background = new THREE.Color( // @ts-ignore
                    value.r, // @ts-ignore
                    value.g, // @ts-ignore
                    value.b // @ts-ignore
                );
            });

        const folderShow = gui.addFolder("Visible");
        folderShow.add(this.scene.opticalAxis, "visible").name("Optical axis");
        folderShow.add(this.scene.otherAxes, "visible").name("Other axes");
        folderShow.add(this.controller, "showValidRays").name("Valid rays");
        folderShow.add(this.controller, "showBlockedRays").name("Blocked rays");
        folderShow.add(this.controller, "showOutputRays").name("Output rays");
        folderShow
            .add(this.controller, "showKinematicJoints")
            .name("Kinematic joints");

        folderShow.onChange((_: Object) => {
            this.updateCameraLayers();
        });
        gui.open(false);
    }

    public updateCameraLayers() {
        const self = this;
        const setCameraLayer = function (flag: boolean, id: number) {
            if (flag) {
                self.app.camera.layers.enable(id);
            } else {
                self.app.camera.layers.disable(id);
            }
        };

        this.app.camera.layers.enable(0);
        setCameraLayer(this.controller.showValidRays, 1);
        setCameraLayer(this.controller.showBlockedRays, 2);
        setCameraLayer(this.controller.showOutputRays, 3);
        setCameraLayer(this.controller.showKinematicJoints, 4);
    }
}
