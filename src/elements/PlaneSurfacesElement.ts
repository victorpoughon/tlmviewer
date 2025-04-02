import * as THREE from "three";

import { get_required } from "../utility.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";

export class PlaneSurfacesElement extends AbstractSceneElement {
    constructor(elementData: any, dim: number) {
            super(elementData, dim);
        }
    
        public static match(elementData: any): boolean {
            const type = get_required(elementData, "type");
            return type === "surface-polynomial";
        }
    
        public makeGroup(): THREE.Group {
            const group = new THREE.Group();

            const geometry = new THREE.RingGeometry( 1, 5, 32 ); 
            const material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
            const mesh = new THREE.Mesh( geometry, material );
            group.add( mesh );

            return group;
        }
}
