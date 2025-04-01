import * as THREE from "three";

export abstract class AbstractSceneElement {
    public static match(_elementData: any): boolean {
        return false;
    }

    public abstract loadJSON(elementData: any, dim: number): THREE.Group;
}
