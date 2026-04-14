import { test } from "node:test";
import { pointsScenes } from "./testScenes.ts";
import { PointsElement } from "../PointsElement.ts";

test("PointsElement.parse", () => {
    for (const scene of pointsScenes) {
        for (const raw of scene.data.data.filter((d: any) => PointsElement.match(d))) {
            PointsElement.parse(raw);
        }
    }
});
