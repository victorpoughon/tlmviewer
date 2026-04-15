import * as THREE from "three";
import { ColorOption } from "../elements_legacy/index.ts";

export type SceneEventMap = {
    setValidRaysColor: { value: ColorOption };
    setBlockedRaysColor: { value: ColorOption };
    setOutputRaysColor: { value: ColorOption };
    setRaysOpacity: { value: number };
    setRaysThickness: { value: number };
    setSurfacesVisible: { value: boolean };
    setSurfacesColor: { value: THREE.Color };
    setAxisVisible: { axis: "x" | "y" | "z"; visible: boolean };
    setBcylVisible: { value: boolean };
    setBackground: { value: THREE.Color }; // TODO
    resetView: {}; // TODO
};

export type SceneEventType = keyof SceneEventMap;

export type SceneEvent<K extends SceneEventType = SceneEventType> = {
    type: K;
} & SceneEventMap[K];
