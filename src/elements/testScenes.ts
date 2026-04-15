import {
    testData2D as arrowsData2D,
    testData3D as arrowsData3D,
} from "./arrows/tests/testData.ts";
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

export const builtinScenes: Array<{ sceneName: string; data: object }> = [
    buildScene("arrows/2D", "2D", arrowsData2D),
    buildScene("arrows/3D", "3D", arrowsData3D),
    buildScene("bcyl/2D", "2D", bcylData2D),
    buildScene("bcyl/3D", "3D", bcylData3D),
    buildScene("box3D/3D", "3D", box3DData3D),
    buildScene("points/2D", "2D", pointsData2D),
    buildScene("points/3D", "3D", pointsData3D),
    buildScene("rays/2D", "2D", raysData2D),
    buildScene("rays/3D", "3D", raysData3D),
    buildScene("surfaceLathe/2D", "2D", surfaceLatheData2D),
    buildScene("surfaceLathe/3D", "3D", surfaceLatheData3D),
    buildScene("surfacePlane/2D", "2D", surfacePlaneData2D),
    buildScene("surfacePlane/3D", "3D", surfacePlaneData3D),
    buildScene("surfaceSphereR/2D", "2D", surfaceSphereRData2D),
    buildScene("surfaceSphereR/3D", "3D", surfaceSphereRData3D),
    buildScene("surfaceSag/2D", "2D", surfaceSagData2D),
    buildScene("surfaceSag/3D", "3D", surfaceSagData3D),
];
