import {
    testData2D as bcylData2D,
    testData3D as bcylData3D,
} from "./bcyl/tests/testData.ts";
import { testData3D as box3DData3D } from "./box3D/tests/testData.ts";
import {
    testData2D as pointsData2D,
    testData3D as pointsData3D,
} from "./points/tests/testData.ts";
import {
    testData2D as raysData2D,
    testData3D as raysData3D,
} from "./rays/tests/testData.ts";
import {
    testData2D as surfaceLatheData2D,
    testData3D as surfaceLatheData3D,
} from "./surfaceLathe/tests/testData.ts";
import {
    testData2D as surfacePlaneData2D,
    testData3D as surfacePlaneData3D,
} from "./surfacePlane/tests/testData.ts";
import {
    testData2D as surfaceSphereRData2D,
    testData3D as surfaceSphereRData3D,
} from "./surfaceSphereR/tests/testData.ts";
import {
    testData2D as surfaceSagData2D,
    testData3D as surfaceSagData3D,
} from "./surfaceSag/tests/testData.ts";
import { allDescriptors } from "./registry.ts";

function buildScene(
    sceneName: string,
    mode: "2D" | "3D",
    elements: any[],
): { sceneName: string; data: object } {
    const camera = mode === "2D" ? "XY" : "orthographic";
    return {
        sceneName: sceneName,
        data: {
            title: sceneName,
            mode,
            camera,
            data: elements,
            controls: {
                show_optical_axis: "true",
                show_other_axes: "true",
                show_bounding_cylinders: "true",
            },
        },
    };
}

// Generate test scenes from the new registry
const registryScenes: Array<{ sceneName: string; data: object }> = [];
for (const descriptor of allDescriptors) {
    if (descriptor.testData2D.length > 0) {
        registryScenes.push(
            buildScene(`${descriptor.type}/2D`, "2D", descriptor.testData2D),
        );
    }
    if (descriptor.testData3D.length > 0) {
        registryScenes.push(
            buildScene(`${descriptor.type}/3D`, "3D", descriptor.testData3D),
        );
    }
}

// Old-style element test scenes (not yet migrated to the new registry)
const legacyScenes: Array<{ sceneName: string; data: object }> = [
    buildScene("(legacy) bcyl/2D", "2D", bcylData2D),
    buildScene("(legacy) bcyl/3D", "3D", bcylData3D),
    buildScene("(legacy) box3D/3D", "3D", box3DData3D),
    buildScene("(legacy) points/2D", "2D", pointsData2D),
    buildScene("(legacy) points/3D", "3D", pointsData3D),
    buildScene("(legacy) rays/2D", "2D", raysData2D),
    buildScene("(legacy) rays/3D", "3D", raysData3D),
    buildScene("(legacy) surfaceLathe/2D", "2D", surfaceLatheData2D),
    buildScene("(legacy) surfaceLathe/3D", "3D", surfaceLatheData3D),
    buildScene("(legacy) surfacePlane/2D", "2D", surfacePlaneData2D),
    buildScene("(legacy) surfacePlane/3D", "3D", surfacePlaneData3D),
    buildScene("(legacy) surfaceSphereR/2D", "2D", surfaceSphereRData2D),
    buildScene("(legacy) surfaceSphereR/3D", "3D", surfaceSphereRData3D),
    buildScene("(legacy) surfaceSag/2D", "2D", surfaceSagData2D),
    buildScene("(legacy) surfaceSag/3D", "3D", surfaceSagData3D),
];

export const builtinScenes: Array<{ sceneName: string; data: object }> = [
    ...registryScenes,
    ...legacyScenes,
];
