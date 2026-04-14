import { test } from "node:test";
import { arrowsScenes } from "./testScenes.ts";
import { ArrowsElement } from "../ArrowsElement.ts";

test("ArrowsElement.parse", () => {
    for (const scene of arrowsScenes) {
        for (const raw of scene.data.data.filter((d: any) => ArrowsElement.match(d))) {
            ArrowsElement.parse(raw);
        }
    }
});
