import { test } from "node:test";
import assert from "node:assert/strict";
import { testData2D, testData3D } from "./testData.ts";
import { SurfacePlaneElement } from "../SurfacePlaneElement.ts";

test("SurfacePlaneElement.parse", () => {
    for (const raw of [...testData2D, ...testData3D]) {
        assert.ok(SurfacePlaneElement.match(raw));
        SurfacePlaneElement.parse(raw);
    }
});
