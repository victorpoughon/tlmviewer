import { tlmviewer } from "../src/main.ts";

const all_tests = [
    "/tests2D/test_colormap.json",
    "/tests2D/test_ray_variables.json",
    "/tests2D/test_ray_variables3D.json",

];

function runTest(json, test_file, container) {
    const source = document.createElement("h2");
    container.appendChild(source);
    source.innerHTML = test_file;

    tlmviewer(container, JSON.stringify(json));
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
