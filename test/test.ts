import { tlmviewer } from "../src/main.ts";

const embed_tests = [
    "/tests2D/test_colormap.json",
    "/tests2D/test_ray_variables.json",
    "/tests2D/test_ray_variables3D.json",

];

const load_tests = [
    "/testsEmbed/landscape.json",
];

function runTest(json, test_file, container) {
    const source = document.createElement("h3");
    container.appendChild(source);
    source.innerHTML = test_file;

    tlmviewer.embed(container, JSON.stringify(json));
}

// Use window.onload to ensure the DOM is fully loaded
window.onload = () => {
    console.log("loading tlmviewer tests");
    
    const mainEmbed = document.getElementById("embed-tests");
    const mainLoad = document.getElementById("load-tests")

    if (mainEmbed == null || mainLoad == null) {
        throw Error("can't find expected divs")
    }
    
    for (const test_file of embed_tests) {
        const container = document.createElement("div");
        mainEmbed.appendChild(container);

        fetch(test_file)
            .then((response) => response.json())
            .then((data) => runTest(data, test_file, container));
    }

    for (const test_file of load_tests) {
        const container = document.createElement("div");
        mainLoad.appendChild(container);

        tlmviewer.load(container, test_file);
    }
};
