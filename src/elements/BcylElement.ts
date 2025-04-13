import * as THREE from "three";

import { getRequired } from "../utility.ts";

import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

import { arrayToMatrix4, homogeneousMatrix3to4 } from "./SurfaceBaseElement.ts";

import { AbstractSceneElement } from "./AbstractSceneElement.ts";

// Create a circle centered at (x, 0, 0) in the YZ plane with a LineSegmentsGeometry
function circleGeometry(x: number, radius: number): LineSegmentsGeometry {
    const geometry = new LineSegmentsGeometry();
    const positions: number[] = [];
    const segments = 64; // Number of segments to approximate the circle

    for (let i = 0; i < segments; i++) {
        const theta1 = (i / segments) * Math.PI * 2;
        const theta2 = ((i + 1) / segments) * Math.PI * 2;

        const y1 = radius * Math.cos(theta1);
        const z1 = radius * Math.sin(theta1);
        const y2 = radius * Math.cos(theta2);
        const z2 = radius * Math.sin(theta2);

        positions.push(0, y1, z1, 0, y2, z2);
    }

    geometry.setPositions(positions);
    geometry.translate(x, 0, 0);
    return geometry;
}

// Bounding Cylinder
export class BcylElement extends AbstractSceneElement {
    constructor(elementData: any, dim: number) {
        super(elementData, dim);
    }

    // True if the given scene element data object matches this class
    public static match(elementData: any): boolean {
        const type = getRequired<string>(elementData, "type");
        return type.startsWith("surface") && "bcyl" in elementData;
    }

    // Get the Matrix4 tranform from the element data
    // Expecting a 2D transform
    public getTransform2D(): THREE.Matrix4 {
        const matrix3 = getRequired<number[][]>(this.elementData, "matrix");
        // TODO more error checking on matrix3 array shape here
        const matrix4 = homogeneousMatrix3to4(matrix3);
        return arrayToMatrix4(matrix4);
    }

    // Get the Matrix4 tranform from the element data
    // Expecting a 3D transform
    public getTransform3D(): THREE.Matrix4 {
        const matrix4 = getRequired<number[][]>(this.elementData, "matrix");
        // TODO more error checking on matrix4 array shape here
        return arrayToMatrix4(matrix4);
    }

    public makeGroup(): THREE.Group {
        const [xmin, xmax, radius] = getRequired<number[]>(
            this.elementData,
            "bcyl"
        );

        const group = new THREE.Group();

        const lineMaterial = new LineMaterial({
            linewidth: 2,
            color: "lightgreen",
            dashed: false,
            transparent: false,
        });

        const surfaceMaterial = new THREE.MeshBasicMaterial({
            color: "lightgreen",
            transparent: true,
            opacity: 0.2,
            depthTest: false,
            depthWrite: false,
        });

        if (this.dim === 2) {
            const positions: number[] = [];

            // fill positions
            const z = 0.0;
            positions.push(xmin, -radius, z, xmin, radius, z);
            positions.push(xmin, radius, z, xmax, radius, z);
            positions.push(xmax, radius, z, xmax, -radius, z);
            positions.push(xmax, -radius, z, xmin, -radius, z);

            const geometry = new LineSegmentsGeometry();
            geometry.setPositions(positions);

            const lines = new LineSegments2(geometry, lineMaterial);
            group.add(lines);

            const userTransform = this.getTransform2D();
            group.applyMatrix4(userTransform);
        } else {
            const height = xmax - xmin;
            const center = xmin + height / 2;

            const circlemin = circleGeometry(xmin, radius);
            const circlemax = circleGeometry(xmax, radius);

            const cylinder = new THREE.CylinderGeometry(
                radius,
                radius,
                height,
                64
            );
            cylinder.rotateZ(Math.PI / 2);
            cylinder.translate(center, 0.0, 0.0);

            group.add(new LineSegments2(circlemin, lineMaterial));
            group.add(new LineSegments2(circlemax, lineMaterial));
            group.add(new THREE.Mesh(cylinder, surfaceMaterial));
            
            const userTransform = this.getTransform3D();
            group.applyMatrix4(userTransform);
        }
        
        return group;
    }

    public setVisible(group: THREE.Group, visible: boolean) : void {
        group.visible = visible;
    }
}
