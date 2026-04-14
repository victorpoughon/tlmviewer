import { TLMScene } from "./scene.ts";
import { TLMViewerApp } from "./app.ts";

import { get_default } from "./utility.ts";

import viewerTemplate from "./viewer.html?raw";
import "./viewer.css";

function setupApp(container: HTMLElement, data: any): TLMViewerApp {
    const mode = get_default(data, "mode", ["3D", "2D"]);
    const camera = get_default(data, "camera", [
        "orthographic",
        "perspective",
        "XY",
    ]);

    const scene = new TLMScene(data, mode === "3D" ? 3 : 2);

    const app = new TLMViewerApp(container, scene, camera);

    const controls = data["controls"] ?? {};
    app.gui.setControlsFromJson(controls);

    window.addEventListener("resize", () => app.onWindowResize());
    return app;
}

function tlmviewerRun(container: HTMLElement, data: any) {
    try {
        container.innerHTML = viewerTemplate;

        const app = setupApp(container, data);

        // Register event handlers
        app.registerEventHandlers(container);

        app.animate();
    } catch (error) {
        container.innerHTML =
            "<span style='color: red'>tlmviewer error: " + error + "</span>";
        throw error;
    }
}

function embed(container: HTMLElement, json_data: string) {
    try {
        const data = JSON.parse(json_data);
        tlmviewerRun(container, data);
    } catch (error) {
        container.innerHTML =
            "<span style='color: red'>tlmviewer error: " + error + "</span>";
        throw error;
    }
}

async function load(container: HTMLElement, url: string): Promise<void> {
    try {
        const response = await fetch(url);
        const data = await response.json();
        tlmviewerRun(container, data);
    } catch (error) {
        container.innerHTML =
            "<span style='color: red'>tlmviewer error: " + error + "</span>";
        throw error;
    }
}

// For each element with class "tlmviewer" in the document
// If it has a data-url attribute, use it to load tlmviewer
async function loadAll(): Promise<Promise<void>[]> {
    const elements = document.querySelectorAll(".tlmviewer");
    const promises: Promise<void>[] = [];

    // For each ".tlmviewer" element, load tlmviewer with the data-url attribute
    elements.forEach((element) => {
        const url = element.getAttribute("data-url");

        // Call the async load function and add the promise to the array
        if (url) {
            promises.push(load(element as HTMLElement, url));
        }
    });

    return promises;
}

export default {
    embed: embed,
    load: load,
    loadAll: loadAll,
};

// @ts-ignore
console.log(`tlmviewer-${import.meta.env.PACKAGE_VERSION} loaded`);
