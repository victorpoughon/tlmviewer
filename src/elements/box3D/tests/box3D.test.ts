import { test } from "node:test";
import assert from "node:assert/strict";
import { testData3D } from "./testData.ts";
import { Box3DElement } from "../Box3DElement.ts";

test("Box3DElement.parse", () => {
    for (const raw of testData3D) {
        assert.ok(Box3DElement.match(raw));
        Box3DElement.parse(raw);
    }
});
