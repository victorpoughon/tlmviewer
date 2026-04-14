import { test } from "node:test";
import { surfaceLatheScenes } from "./testScenes.ts";
import { SurfaceLatheElement } from "../SurfaceLatheElement.ts";

test("SurfaceLatheElement.parse", () => {
    for (const scene of surfaceLatheScenes) {
        for (const raw of scene.data.data.filter((d: any) => SurfaceLatheElement.match(d))) {
            SurfaceLatheElement.parse(raw);
        }
    }
});
