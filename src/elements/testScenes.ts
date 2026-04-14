import { arrowsScenes } from "./arrows/testScenes.ts";
import { bcylScenes } from "./bcyl/testScenes.ts";
import { box3DScenes } from "./box3D/testScenes.ts";
import { pointsScenes } from "./points/testScenes.ts";
import { raysScenes } from "./rays/testScenes.ts";
import { surfaceLatheScenes } from "./surfaceLathe/testScenes.ts";
import { surfacePlaneScenes } from "./surfacePlane/testScenes.ts";
import { surfaceSphereRScenes } from "./surfaceSphereR/testScenes.ts";
import { surfaceSagScenes } from "./surfaceSag/testScenes.ts";

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
