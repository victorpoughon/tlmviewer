import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { allDescriptors } from "../registry.ts";

describe("registry elements parse()", () => {
    for (const descriptor of allDescriptors) {
        test(`[${descriptor.type}] parse(testData2D)`, () => {
            for (const data of descriptor.testData2D) {
                assert.ok(descriptor.parse(data, 2));
            }
        });

        test(`[${descriptor.type}] parse(testData3D)`, () => {
            for (const data of descriptor.testData3D) {
                assert.ok(descriptor.parse(data, 3));
            }
        });
    }
});
