import { test } from "node:test";
import { raysScenes } from "./testScenes.ts";
import { RaysElement } from "../RaysElement.ts";

test("RaysElement.parse", () => {
    for (const scene of raysScenes) {
        for (const raw of scene.data.data.filter((d: any) => RaysElement.match(d))) {
            RaysElement.parse(raw);
        }
    }
});
