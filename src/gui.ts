import * as THREE from "three";
import GUI from "lil-gui";

import { TLMScene, ColorOption } from "./scene.ts";
import { TLMViewerApp } from "./main.ts";

type RGBColor = {
    r: number;
    g: number;
    b: number;
};

export class TLMGui {
    private app: TLMViewerApp;
    private scene: TLMScene;
    private controller: any;

    constructor(app: TLMViewerApp, container: HTMLElement, scene: TLMScene) {
        this.scene = scene;
        this.app = app;

        const gui = new GUI({ container: container, autoPlace: false });

        const colors: Record<string, ColorOption> = {
            default: { show: true, colorDim: null, trueColor: false },
            hide: { show: false, colorDim: null, trueColor: false },
        };

        for (const varName of this.scene.variables) {
            if (varName === "wavelength") {
                colors["wavelength"] = {
                    show: true,
                    colorDim: "wavelength",
                    trueColor: false,
                };
                colors["wavelength (true color)"] = {
                    show: true,
                    colorDim: "wavelength",
                    trueColor: true,
                };
            } else {
                colors[varName] = {
                    show: true,
                    colorDim: varName,
                    trueColor: false,
                };
            }
        }

        this.controller = {
            validColor: colors.default,
            blockedColor: colors.hide,
            outputColor: colors.default,
            raysOpacity: 1.0,
            raysThickness: 1.0,
            resetView() {
                app.resetView();
            },
            backgroundColor: { r: 0, g: 0, b: 0 },
            surfacesColor: { r: 0, g: 1, b: 1 },

            showKinematicJoints: false,
        };

        gui.add(this.controller, "resetView").name("Reset Camera");

        const folderColors = gui.addFolder("Colors");
        
        const controllerValidColor = folderColors
            .add(this.controller, "validColor", colors)
            .name("Valid rays");

        const controllerBlockedColor = folderColors
            .add(this.controller, "blockedColor", colors)
            .name("Blocked rays");

        const controllerOutputColor = folderColors
            .add(this.controller, "outputColor", colors)
            .name("Output rays");

        const controllerOpacity = folderColors.add(this.controller, "raysOpacity", 0, 1).name("Opacity").onFinishChange((value: number) => {
            this.scene.setRaysOpacity(value);
        });

        const controllerThickness = folderColors.add(this.controller, "raysThickness", 0.1, 10).name("Thickness").onFinishChange((value: number) => {
            this.scene.setRaysThickness(value);
        });

        controllerValidColor.onChange((value: ColorOption) => {
            this.scene.setupValidRays(value);
            this.scene.setRaysOpacity(controllerOpacity.getValue());
            this.scene.setRaysThickness(controllerThickness.getValue());
        });

        controllerBlockedColor.onChange((value: ColorOption) => {
            this.scene.setupBlockedRays(value);
            this.scene.setRaysOpacity(controllerOpacity.getValue());
            this.scene.setRaysThickness(controllerThickness.getValue());
        });

        controllerOutputColor.onChange((value: ColorOption) => {
            this.scene.setupOutputRays(value);
            this.scene.setRaysOpacity(controllerOpacity.getValue());
            this.scene.setRaysThickness(controllerThickness.getValue());
        });

        folderColors
            .addColor(this.controller, "backgroundColor")
            .name("Background")
            .onChange((value: RGBColor) => {
                this.scene.scene.background = new THREE.Color(
                    value.r,
                    value.g,
                    value.b
                );
            });

        folderColors
            .addColor(this.controller, "surfacesColor")
            .name("Surfaces")
            .onChange((value: RGBColor) => {
                const color = new THREE.Color(value.r, value.g, value.b);
                this.scene.setSurfacesColor(color);
            });

        const folderShow = gui.addFolder("Visible");
        folderShow.add(this.scene.opticalAxis, "visible").name("Optical axis");
        folderShow.add(this.scene.otherAxes, "visible").name("Other axes");
        folderShow
            .add(this.controller, "showKinematicJoints")
            .name("Kinematic joints");

        this.scene.setupValidRays(this.controller.validColor);
        this.scene.setupBlockedRays(this.controller.blockedColor);
        this.scene.setupOutputRays(this.controller.outputColor);

        folderShow.onChange((_: Object) => {
            this.updateCameraLayers();
        });
        this.updateCameraLayers();

        gui.open(true);
        folderShow.open(false);
        folderColors.open(false);
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
        setCameraLayer(this.controller.showKinematicJoints, 4);
    }
}
