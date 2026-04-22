import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
    resolve: {
        alias: {
            tlmviewer: path.resolve(__dirname, "../tlmviewer/src/main.ts"),
        },
    },
});
