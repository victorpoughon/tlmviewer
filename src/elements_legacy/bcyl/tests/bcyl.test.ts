import { test } from "node:test";
import assert from "node:assert/strict";
import { testData2D, testData3D } from "./testData.ts";
import { BcylElement } from "../BcylElement.ts";

test("BcylElement.parse", () => {
    for (const raw of [...testData2D, ...testData3D]) {
        assert.ok(BcylElement.match(raw));
        BcylElement.parse(raw);
    }
});
