import { arrowsScenes } from "./arrows/tests/testScenes.ts";
import { bcylScenes } from "./bcyl/tests/testScenes.ts";
import { box3DScenes } from "./box3D/tests/testScenes.ts";
import { pointsScenes } from "./points/tests/testScenes.ts";
import { raysScenes } from "./rays/tests/testScenes.ts";
import { surfaceLatheScenes } from "./surfaceLathe/tests/testScenes.ts";
import { surfacePlaneScenes } from "./surfacePlane/tests/testScenes.ts";
import { surfaceSphereRScenes } from "./surfaceSphereR/tests/testScenes.ts";
import { surfaceSagScenes } from "./surfaceSag/tests/testScenes.ts";

export const builtinScenes: Array<{ name: string; data: object }> = [
    ...arrowsScenes,
    ...bcylScenes,
    ...box3DScenes,
    ...pointsScenes,
    ...raysScenes,
    ...surfaceLatheScenes,
    ...surfacePlaneScenes,
    ...surfaceSphereRScenes,
    ...surfaceSagScenes,
];
