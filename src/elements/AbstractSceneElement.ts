import * as THREE from "three";

export abstract class AbstractSceneElement {
    readonly elementData: any;
    readonly dim: number;

    constructor(elementData: any, dim: number) {
        this.elementData = elementData;
        this.dim = dim;
    }

    // True if the given scene element data object matches this class
    public static match(_elementData: any): boolean {
        return false;
    }

    public abstract makeGroup(): THREE.Group;
}
