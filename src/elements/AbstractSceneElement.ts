import * as THREE from "three";
import { ViewerEvent } from "../viewerEvent";

export abstract class AbstractSceneElement {
    readonly dim: number;
    readonly container: HTMLElement;
    readonly threeScene: THREE.Scene;
    public group!: THREE.Group;
    private eventHandlers = new Map<string, (event: any) => void>();

    // If True, this element's group counts when computing the bounding box for
    // the default camera view
    public includeInDefaultCamera = true;

    constructor(dim: number, container: HTMLElement, threeScene: THREE.Scene) {
        this.dim = dim;
        this.container = container;
        this.threeScene = threeScene;
    }

    // True if the given scene element data object matches this class
    public static match(_elementData: any): boolean {
        return false;
    }

    public static parse(_raw: any): any {
        throw new Error("parse() not implemented");
    }

    protected addEventListener<K extends ViewerEvent["type"]>(
        type: K,
        handler: (event: Extract<ViewerEvent, { type: K }>) => void,
    ): void {
        this.eventHandlers.set(type, handler);
    }

    public onEvent(event: ViewerEvent): void {
        this.eventHandlers.get(event.type)?.(event);
    }
}
