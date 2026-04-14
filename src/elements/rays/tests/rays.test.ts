import { test } from "node:test";
import assert from "node:assert/strict";
import { testData2D, testData3D } from "./testData.ts";
import { RaysElement } from "../RaysElement.ts";

test("RaysElement.parse", () => {
    for (const raw of [...testData2D, ...testData3D]) {
        assert.ok(RaysElement.match(raw));
        RaysElement.parse(raw);
    }
});
