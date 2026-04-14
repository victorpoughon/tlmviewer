import { test } from "node:test";
import { box3DScenes } from "./testScenes.ts";
import { Box3DElement } from "../Box3DElement.ts";

test("Box3DElement.parse", () => {
    for (const scene of box3DScenes) {
        for (const raw of scene.data.data.filter((d: any) => Box3DElement.match(d))) {
            Box3DElement.parse(raw);
        }
    }
});
