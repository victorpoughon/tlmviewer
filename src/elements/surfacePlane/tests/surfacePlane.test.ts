import { test } from "node:test";
import { surfacePlaneScenes } from "./testScenes.ts";
import { SurfacePlaneElement } from "../SurfacePlaneElement.ts";

test("SurfacePlaneElement.parse", () => {
    for (const scene of surfacePlaneScenes) {
        for (const raw of scene.data.data.filter((d: any) => SurfacePlaneElement.match(d))) {
            SurfacePlaneElement.parse(raw);
        }
    }
});
