import * as THREE from "three";

import { getRequired } from "../utility.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";

export class ArrowsElement extends AbstractSceneElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    // True if the given scene element data object matches this class
    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "arrows";
    }

    public makeGroup(): THREE.Group {
        const arrows = getRequired<any[]>(this.elementData, "data");

        const group = new THREE.Group();

        for (const arrow of arrows) {
            var start, end, length;
            if (this.dim == 2) {
                console.assert(arrow.length == 5);
                start = arrow.slice(0, 2);
                end = arrow.slice(2, 4);
                length = arrow[4];
            } else {
                console.assert(arrow.length == 7);
                start = arrow.slice(0, 3);
                end = arrow.slice(3, 6);
                length = arrow[6];
            }

            const dir = new THREE.Vector3(...start);
            dir.normalize();
            const origin = new THREE.Vector3(...end);
            const color = 0xffff00;

            const arrowHelper = new THREE.ArrowHelper(
                dir,
                origin,
                length,
                color
            );
            group.add(arrowHelper);
        }

        return group;
    }
}
