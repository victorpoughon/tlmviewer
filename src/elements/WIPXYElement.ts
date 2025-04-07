import * as THREE from "three";

import { getRequired } from "../utility.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";

export class WIPXYElement extends AbstractSceneElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "surface-polynomial";
    }

    public makeGroup(): THREE.Group {
        const group = new THREE.Group();

        const geometry = new THREE.RingGeometry(0, 5, 256, 256);
        const material = new THREE.MeshNormalMaterial({
            side: THREE.DoubleSide,
            //wireframe: true,
        });
        // const material = new THREE.MeshLambertMaterial({
        //     vertexColors: true,
        //     side: THREE.DoubleSide
        //   });
        const mesh = new THREE.Mesh(geometry, material);

        const positions = geometry.attributes.position as THREE.BufferAttribute;

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = x * x - y * y;
            positions.setZ(i, z / 10);
        }

        geometry.computeVertexNormals();

        group.add(mesh);

        return group;
    }
}
