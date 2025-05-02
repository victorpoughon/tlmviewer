import * as THREE from "three";
import { GUI, Controller } from "lil-gui";

import { ColorOption } from "./elements/RaysElement.ts";
import { TLMScene } from "./scene.ts";
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
    private gui: GUI;

    private colorOptions: Record<string, ColorOption>;

    // Controllers
    private controllers: {
        colors: {
            validRays: Controller;
            blockedRays: Controller;
            outputRays: Controller;
            opacity: Controller;
            thickness: Controller;
            background: Controller;
            surfaces: Controller;
        };
        visible: {
            surfaces: Controller;
            opticalAxis: Controller;
            otherAxes: Controller;
            kinematicJoints: Controller;
            bcyl: Controller;
        };
    };

    // GUI folders
    private folders: {
        colors: GUI,
        show: GUI,
    };

    constructor(app: TLMViewerApp, container: HTMLElement, scene: TLMScene) {
        this.scene = scene;
        this.app = app;
        this.gui = new GUI({ container: container, autoPlace: false });

        // Build this.colorOptions from the data
        this.colorOptions = {
            default: { show: true, colorDim: null, trueColor: false },
            hide: { show: false, colorDim: null, trueColor: false },
        };

        for (const varName of this.scene.variables) {
            if (varName === "wavelength") {
                this.colorOptions["wavelength"] = {
                    show: true,
                    colorDim: "wavelength",
                    trueColor: false,
                };
                this.colorOptions["wavelength (true color)"] = {
                    show: true,
                    colorDim: "wavelength",
                    trueColor: true,
                };
            } else {
                this.colorOptions[varName] = {
                    show: true,
                    colorDim: varName,
                    trueColor: false,
                };
            }
        }

        this.controller = {
            validColor: this.colorOptions.default,
            blockedColor: this.colorOptions.hide,
            outputColor: this.colorOptions.default,
            raysOpacity: 1.0,
            raysThickness: 1.0,
            resetView() {
                app.resetView();
            },
            backgroundColor: { r: 0, g: 0, b: 0 },
            surfacesColor: { r: 0, g: 1, b: 1 },

            showSurfaces: true,
            showKinematicJoints: false,
            showBcyl: false,
        };

        // If 'object' variable is available, default to it for valid and output rays
        if (this.scene.variables.includes("object")) {
            this.controller.validColor = this.colorOptions["object"];
            this.controller.outputColor = this.colorOptions["object"];
        }

        this.gui.add(this.controller, "resetView").name("Reset Camera");

        const folderColors = this.gui.addFolder("Colors");

        const controllerColorsValidRays = folderColors
            .add(this.controller, "validColor", this.colorOptions)
            .name("Valid rays");

        const controllerColorsBlockedRays = folderColors
            .add(this.controller, "blockedColor", this.colorOptions)
            .name("Blocked rays");

        const controllerColorsOutputRays = folderColors
            .add(this.controller, "outputColor", this.colorOptions)
            .name("Output rays");

        const controllerColorsOpacity = folderColors
            .add(this.controller, "raysOpacity", 0, 1)
            .name("Opacity")
            .onFinishChange((value: number) => {
                this.scene.setRaysOpacity(value);
            });

        const controllerColorsThickness = folderColors
            .add(this.controller, "raysThickness", 0.1, 10)
            .name("Thickness")
            .onFinishChange((value: number) => {
                this.scene.setRaysThickness(value);
            });

        controllerColorsValidRays.onChange((value: ColorOption) => {
            this.scene.setupValidRays(value);
            this.scene.setRaysOpacity(controllerColorsOpacity.getValue());
            this.scene.setRaysThickness(controllerColorsThickness.getValue());
        });

        controllerColorsBlockedRays.onChange((value: ColorOption) => {
            this.scene.setupBlockedRays(value);
            this.scene.setRaysOpacity(controllerColorsOpacity.getValue());
            this.scene.setRaysThickness(controllerColorsThickness.getValue());
        });

        controllerColorsOutputRays.onChange((value: ColorOption) => {
            this.scene.setupOutputRays(value);
            this.scene.setRaysOpacity(controllerColorsOpacity.getValue());
            this.scene.setRaysThickness(controllerColorsThickness.getValue());
        });

        const controllerColorsBackground = folderColors
            .addColor(this.controller, "backgroundColor")
            .name("Background")
            .onChange((value: RGBColor) => {
                this.scene.scene.background = new THREE.Color().setRGB(
                    value.r,
                    value.g,
                    value.b,
                    THREE.SRGBColorSpace
                );
            });

        const controllerColorsSurfaces = folderColors
            .addColor(this.controller, "surfacesColor")
            .name("Surfaces")
            .onChange((value: RGBColor) => {
                const color = new THREE.Color(value.r, value.g, value.b);
                this.scene.setSurfacesColor(color);
            });

        const folderShow = this.gui.addFolder("Visible");
        const controllerVisibleSurfaces = folderShow
            .add(this.controller, "showSurfaces")
            .name("Surfaces")
            .onChange((value: boolean) => {
                this.scene.setSurfacesVisible(value);
            });
        const controllerVisibleOpticalAxis = folderShow
            .add(this.scene.opticalAxis, "visible")
            .name("Optical axis");
        const controllerVisibleOtherAxes = folderShow
            .add(this.scene.otherAxes, "visible")
            .name("Other axes");
        const controllerVisibleKinematicJoints = folderShow
            .add(this.controller, "showKinematicJoints")
            .name("Kinematic joints");
        const controllerVisibleBcyl = folderShow
            .add(this.controller, "showBcyl")
            .name("Bounding Cylinders")
            .onChange((value: boolean) => {
                this.scene.setBcylVisible(value);
            });
        folderShow.onChange((_: Object) => {
            this.updateCameraLayers();
        });

        // Initialize this.controllers
        this.controllers = {
            colors: {
                validRays: controllerColorsValidRays,
                blockedRays: controllerColorsBlockedRays,
                outputRays: controllerColorsOutputRays,
                opacity: controllerColorsOpacity,
                thickness: controllerColorsThickness,
                background: controllerColorsBackground,
                surfaces: controllerColorsSurfaces,
            },
            visible: {
                surfaces: controllerVisibleSurfaces,
                opticalAxis: controllerVisibleOpticalAxis,
                otherAxes: controllerVisibleOtherAxes,
                kinematicJoints: controllerVisibleKinematicJoints,
                bcyl: controllerVisibleBcyl,
            },
        };

        // Initialize this.folder
        this.folders = {
            colors: folderColors,
            show: folderShow,
        }

        this.setDefaultGUIState();
    }

    public setDefaultGUIState() {
        // Set default GUI state
        this.scene.setupValidRays(this.controller.validColor);
        this.scene.setupBlockedRays(this.controller.blockedColor);
        this.scene.setupOutputRays(this.controller.outputColor);

        this.updateCameraLayers();

        this.scene.setBcylVisible(false);

        this.gui.open(false);
        this.folders.colors.open(true);
        this.folders.show.open(true);
    }

    // Set controls state from a JSON object
    public setControlsFromJson(controls: any) {      
        const set = function (key: string, setter: any) {
            if (controls.hasOwnProperty(key)) {
                setter(controls[key]);
            }
        };
        const self = this;

        set("color_rays", (v: string) => {
            self.controllers.colors.validRays.load(self.colorOptions[v]);
            self.controllers.colors.outputRays.load(self.colorOptions[v]);
        });
        set("valid_rays", (v: string) => {
            self.controllers.colors.validRays.load(self.colorOptions[v]);
        });
        set("blocked_rays", (v: string) => {
            self.controllers.colors.blockedRays.load(self.colorOptions[v]);
        });
        set("output_rays", (v: string) => {
            self.controllers.colors.outputRays.load(self.colorOptions[v]);
        });
        set("opacity", (v: number) => {
            self.controllers.colors.opacity.load(v);
        });
        set("thickness", (v: number) => {
            self.controllers.colors.thickness.load(v);
        });
        set("show_surfaces", (v: boolean) => {
            self.controllers.visible.surfaces.load(v);
        });
        set("show_optical_axis", (v: boolean) => {
            self.controllers.visible.opticalAxis.load(v);
        });
        set("show_other_axes", (v: boolean) => {
            self.controllers.visible.otherAxes.load(v);
        });
        set("show_kinematic_joints", (v: boolean) => {
            self.controllers.visible.kinematicJoints.load(v);
        });
        set("show_bounding_cylinders", (v: boolean) => {
            self.controllers.visible.bcyl.load(v);
        });

        // Finish with visibility of the gui itself
        set("show_controls", (v: boolean) => {
            if (!v) {
                self.gui.hide();
            }
        });
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
