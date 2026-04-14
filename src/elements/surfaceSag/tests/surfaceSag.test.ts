import { test } from "node:test";
import { surfaceSagScenes } from "./testScenes.ts";
import { SurfaceSagElement } from "../SurfaceSagElement.ts";

test("SurfaceSagElement.parse", () => {
    for (const scene of surfaceSagScenes) {
        for (const raw of scene.data.data.filter((d: any) => SurfaceSagElement.match(d))) {
            SurfaceSagElement.parse(raw);
        }
    }
});
