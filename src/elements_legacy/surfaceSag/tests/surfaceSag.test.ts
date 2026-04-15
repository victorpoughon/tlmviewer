import { test } from "node:test";
import assert from "node:assert/strict";
import { testData2D, testData3D } from "./testData.ts";
import { SurfaceSagElement } from "../SurfaceSagElement.ts";

test("SurfaceSagElement.parse", () => {
    for (const raw of [...testData2D, ...testData3D]) {
        assert.ok(SurfaceSagElement.match(raw));
        SurfaceSagElement.parse(raw);
    }
});
