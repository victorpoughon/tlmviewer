import * as THREE from "three";

import { getRequired } from "../../utility.ts";
import { AbstractSceneElement } from "../AbstractSceneElement.ts";

interface AmbientLightData {
    color: string;
    intensity: number;
}

export class AmbientLight extends AbstractSceneElement {
    readonly data: AmbientLightData;

    static parse(raw: any): AmbientLightData {
        return {
            color: getRequired<string>(raw, "color"),
            intensity: getRequired<number>(raw, "intensity"),
        };
    }

    // TODO replace with const string of type?
    static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type == "ambient-light";
    }

    constructor(
        data: AmbientLightData,
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
        group.add(new THREE.AmbientLight(this.data.color, this.data.intensity));
        return group;
    }
}
