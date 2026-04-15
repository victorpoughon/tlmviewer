import { test } from "node:test";
import assert from "node:assert/strict";
import { testData2D, testData3D } from "./testData.ts";
import { SurfaceSphereRElement } from "../SurfaceSphereRElement.ts";

test("SurfaceSphereRElement.parse", () => {
    for (const raw of [...testData2D, ...testData3D]) {
        assert.ok(SurfaceSphereRElement.match(raw));
        SurfaceSphereRElement.parse(raw);
    }
});
