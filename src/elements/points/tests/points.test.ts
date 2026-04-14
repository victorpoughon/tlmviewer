import { test } from "node:test";
import assert from "node:assert/strict";
import { testData2D, testData3D } from "./testData.ts";
import { PointsElement } from "../PointsElement.ts";

test("PointsElement.parse", () => {
    for (const raw of [...testData2D, ...testData3D]) {
        assert.ok(PointsElement.match(raw));
        PointsElement.parse(raw);
    }
});
