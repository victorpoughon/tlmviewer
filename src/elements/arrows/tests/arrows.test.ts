import { test } from "node:test";
import assert from "node:assert/strict";
import { testData2D, testData3D } from "./testData.ts";
import { ArrowsElement } from "../ArrowsElement.ts";

test("ArrowsElement.parse", () => {
    for (const raw of [...testData2D, ...testData3D]) {
        assert.ok(ArrowsElement.match(raw));
        ArrowsElement.parse(raw);
    }
});
