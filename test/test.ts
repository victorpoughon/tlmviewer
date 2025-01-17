import { tlmviewer } from "../src/main.ts";

const all_tests = [
    "/tests2D/test1.json",
    "/tests2D/test2.json",
    "/tests2D/test3.json",

    "/tests3D/clip_planes.json",
    "/tests3D/test1.json",
    "/tests3D/test2.json",
    "/tests3D/test3.json",
    "/tests3D/test4.json",
    "/tests3D/test5.json",
    "/tests3D/test6.json",
    "/tests3D/dispersion.json",
    "/tests3D/collision_detection_3D.json",
    "/tests3D/collision_detection_3D_perspective.json",
];

function runTest(json, test_file, container) {
    const source = document.createElement("h2");
    container.appendChild(source);
    source.innerHTML = test_file;

    const viewer = document.createElement("div");
    viewer.classList.add("tlmviewer");
    container.appendChild(viewer);

    tlmviewer(viewer, JSON.stringify(json));
}

// Use window.onload to ensure the DOM is fully loaded
window.onload = () => {
    console.log("loading tlmviewer tests");
    
    const main = document.getElementsByTagName("main")[0];
    
    for (const test_file of all_tests) {
        const container = document.createElement("div");
        main.appendChild(container);

        fetch(test_file)
            .then((response) => response.json())
            .then((data) => runTest(data, test_file, container));
    }
};
