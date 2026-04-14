import * as THREE from "three";

import { getOption, getRequired } from "../../utility.ts";
import { AbstractSceneElement } from "../AbstractSceneElement.ts";
import { makeLine2 } from "../../lineUtils.ts";

interface SceneAxisData {
    axis: "x" | "y" | "z";
    length: number;
    color: string;
}

export class SceneAxisElement extends AbstractSceneElement {
    readonly data: SceneAxisData;

    static parse(raw: any): SceneAxisData {
        return {
            axis: getOption(raw, "axis", ["x", "y", "z"]),
            length: getRequired<number>(raw, "length"),
            color: raw["color"] ?? "#e3e3e3",
        };
    }

    constructor(
        data: SceneAxisData,
        dim: number,
        container: HTMLElement,
        threeScene: THREE.Scene,
    ) {
        super(dim, container, threeScene);
        this.data = data;
        this.group = this.makeGroup();

        this.includeInDefaultCamera = false;


        this.addEventListener("setAxisVisible", (e) => {
            console.log("HANDLER SET AXIS VISIBLE", this.data.axis, e);
            if (e.axis == this.data.axis) {
                this.group.visible = e.visible;
            }
        });
    }

    // True if the given scene element data object matches this class
    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type == "scene-axis";
    }

    protected makeGroup(): THREE.Group {
        const group = new THREE.Group();

        const { axis, length, color } = this.data;

        if (axis == "x") {
            group.add(makeLine2([-length, 0, 0], [length, 0, 0], color));
        } else if (axis == "y") {
            group.add(makeLine2([0, -length, 0], [0, length, 0], color));
        } else if (axis == "z") {
            group.add(makeLine2([0, 0, -length], [0, 0, length], color));
        }

        group.visible = false;

        return group;
    }
}
