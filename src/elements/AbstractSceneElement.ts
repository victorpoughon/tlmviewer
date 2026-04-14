import * as THREE from "three";

export abstract class AbstractSceneElement {
    readonly dim: number;
    readonly container: HTMLElement;
    readonly threeScene: THREE.Scene;

    constructor(dim: number, container: HTMLElement, threeScene: THREE.Scene) {
        this.dim = dim;
        this.container = container;
        this.threeScene = threeScene;
    }

    // True if the given scene element data object matches this class
    public static match(_elementData: any): boolean {
        return false;
    }

    public abstract makeGroup(): THREE.Group;
}
