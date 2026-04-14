export function defaultSceneElementsData(dim: number): any[] {
    if (dim === 2) {
        return [
            { type: "scene-axis", axis: "x", length: 500, color: "#e3e3e3" },
            { type: "scene-axis", axis: "y", length: 500, color: "#e3e3e3" },
        ];
    } else {
        return [
            { type: "scene-axis", axis: "x", length: 500, color: "#e3e3e3" },
            { type: "scene-axis", axis: "y", length: 10, color: "#C80000" },
            { type: "scene-axis", axis: "z", length: 10, color: "#00C800" },
        ];
    }
}
