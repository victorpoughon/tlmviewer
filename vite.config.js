import { resolve } from "path";
import { defineConfig } from "vite";
import path from "node:path";

// Vite plugins
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import version from "vite-plugin-package-version";
import testJsonManifestPlugin from "./plugins/generate-test-manifest.js";

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/main.ts"),
            name: "tlmviewer",
            fileName: (format) =>
                `tlmviewer-${process.env.npm_package_version}.js`,
            formats: ["es"],
        },
    },
    plugins: [
        cssInjectedByJsPlugin(),
        version(),
        testJsonManifestPlugin({
            root: __dirname,
            tests: "public/tests",
            manifest: "testscenes.json",
        }),
    ],
});
