import { TLMScene } from "./scene.ts";
import { TLMViewerApp } from "./app.ts";
import { get_default } from "./core/utility.ts";
import viewerTemplate from "./viewer.html?raw";

export function renderScene(container: HTMLElement, data: unknown): void {
    try {
        const d = data as any;
        container.innerHTML = viewerTemplate;

        const mode = get_default(d, "mode", ["3D", "2D"]);
        const camera = get_default(d, "camera", [
            "orthographic",
            "perspective",
            "2D",
        ]);

        const scene = new TLMScene(d, mode === "3D" ? 3 : 2, container);
        const app = new TLMViewerApp(container, scene, camera);

        const controls = d["controls"] ?? {};
        app.gui.setControlsFromJson(controls);

        window.addEventListener("resize", () => app.onWindowResize());
        app.registerEventHandlers(container);
        app.animate();
    } catch (error) {
        container.innerHTML =
            "<span style='color: red'>tlmviewer error: " + error + "</span>";
        throw error;
    }
}
