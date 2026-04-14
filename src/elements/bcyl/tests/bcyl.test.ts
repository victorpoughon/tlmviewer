import { test } from "node:test";
import { bcylScenes } from "./testScenes.ts";
import { BcylElement } from "../BcylElement.ts";

test("BcylElement.parse", () => {
    for (const scene of bcylScenes) {
        for (const raw of scene.data.data.filter((d: any) => BcylElement.match(d))) {
            BcylElement.parse(raw);
        }
    }
});
