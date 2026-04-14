import * as THREE from "three";
import { ColorOption } from "./elements/index.ts";

export type ViewerEvent =
    // | { type: "setValidRaysColor"; value: ColorOption }
    // | { type: "setBlockedRaysColor"; value: ColorOption }
    // | { type: "setOutputRaysColor"; value: ColorOption }
    { type: "setRaysOpacity"; value: number }
    | { type: "setRaysThickness"; value: number };
    // | { type: "setSurfacesVisible"; value: boolean }
    // | { type: "setSurfacesColor"; value: THREE.Color }
    // | {
    //       type: "setAxisVisible";
    //       value: { axis: "x" | "coordinate"; visible: boolean };
    //   }
    // | { type: "setBcylVisible"; value: boolean }
    // | { type: "setBackground"; value: THREE.Color }
    // | { type: "resetView" }
