import * as THREE from "three";

import { getRequired } from "../../utility.ts";
import { AbstractSceneElement } from "../AbstractSceneElement.ts";

interface DirectionalLightData {
    color: string;
    intensity: number;
    position: [number, number, number];
}

export class DirectionalLight extends AbstractSceneElement {
    readonly data: DirectionalLightData;

    static parse(raw: any): DirectionalLightData {
        const position = getRequired<number[]>(raw, "position");
        return {
            color: getRequired<string>(raw, "color"),
            intensity: getRequired<number>(raw, "intensity"),
            position: position as [number, number, number],
        };
    }

    // TODO replace with const string of type?
    static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type == "directional-light";
    }

    constructor(
        data: DirectionalLightData,
        dim: number,
        container: HTMLElement,
        threeScene: THREE.Scene,
    ) {
        super(dim, container, threeScene);
        this.data = data;
        this.group = this.makeGroup();

        this.includeInDefaultCamera = false;
    }

    protected makeGroup(): THREE.Group {
        const group = new THREE.Group();
        const light = new THREE.DirectionalLight(
            this.data.color,
            this.data.intensity,
        );
        light.position.set(
            this.data.position[0],
            this.data.position[1],
            this.data.position[2],
        );
        group.add(light);
        return group;
    }
}
