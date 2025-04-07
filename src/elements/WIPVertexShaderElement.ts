import * as THREE from "three";

import { getRequired } from "../utility.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";

import CustomShaderMaterial from "three-custom-shader-material/vanilla";

export class WIPVertexShaderElement extends AbstractSceneElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type === "surface-vertex-shader";
    }

    public makeGroup(): THREE.Group {
        const group = new THREE.Group();

        const geometry = new THREE.RingGeometry(0, 5, 256, 256).rotateY(Math.PI /2);


        const vertexShader: string = /* glsl */ `
            varying vec3 vPosition;
              uniform float uTime;
              
              void main() {
                vPosition = position;
                vec3 pos = position;
                float y = pos.y;
                float z = pos.z;
                
                // sag function
                pos.x = (y*y - z*z)/10.;
                
                csm_Position = pos;
                }
                `;
            
            const material = new CustomShaderMaterial({
                baseMaterial: THREE.MeshNormalMaterial,
                vertexShader: vertexShader,
                
                // Base material properties
                flatShading: true,
                //color: 0x00FFFF,
                side: THREE.DoubleSide,
          });


        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        return group;
    }
}
