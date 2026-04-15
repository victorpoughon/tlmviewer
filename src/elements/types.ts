import * as THREE from "three";
import { SceneEventType, SceneEvent } from "./events.ts";

export type BaseElementData = {
    type: string;
};

// Handler for a specific event type
export type EventHandler<
    T extends BaseElementData,
    K extends SceneEventType,
> = (data: T, object: THREE.Object3D, event: SceneEvent<K>) => void;

// The record an element provides: a subset of event types it cares about
export type ElementEventRecord<T extends BaseElementData> = {
    [K in SceneEventType]?: EventHandler<T, K>;
};

export type ElementDescriptor<T extends BaseElementData> = {
    type: T["type"];
    parse: (raw: unknown, dim: number) => T;
    render: (data: T) => THREE.Object3D; // TODO add DOM element, physical "dim", other stuff needed at init
    events?: ElementEventRecord<T>;
    testData2D: T[];
    testData3D: T[];
};

export type SceneEntry = {
    object: THREE.Object3D;
    data: BaseElementData;
    // event handlers
};
