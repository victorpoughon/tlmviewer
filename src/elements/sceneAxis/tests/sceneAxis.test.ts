import { test } from "node:test";
import assert from "node:assert/strict";
import { testData2D, testData3D } from "./testData.ts";
import { SceneAxisElement } from "../SceneAxisElement.ts";

test("SceneAxisElement.parse", () => {
    for (const raw of [...testData2D, ...testData3D]) {
        assert.ok(SceneAxisElement.match(raw));
        SceneAxisElement.parse(raw);
    }
});
