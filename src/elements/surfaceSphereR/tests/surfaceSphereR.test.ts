import { test } from "node:test";
import { surfaceSphereRScenes } from "./testScenes.ts";
import { SurfaceSphereRElement } from "../SurfaceSphereRElement.ts";

test("SurfaceSphereRElement.parse", () => {
    for (const scene of surfaceSphereRScenes) {
        for (const raw of scene.data.data.filter((d: any) => SurfaceSphereRElement.match(d))) {
            SurfaceSphereRElement.parse(raw);
        }
    }
});
