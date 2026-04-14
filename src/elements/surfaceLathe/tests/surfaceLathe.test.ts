import { test } from "node:test";
import assert from "node:assert/strict";
import { testData2D, testData3D } from "./testData.ts";
import { SurfaceLatheElement } from "../SurfaceLatheElement.ts";

test("SurfaceLatheElement.parse", () => {
    for (const raw of [...testData2D, ...testData3D]) {
        assert.ok(SurfaceLatheElement.match(raw));
        SurfaceLatheElement.parse(raw);
    }
});
