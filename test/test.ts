import { tlmviewer } from "../src/main.ts";

const embed_tests = [
    "/tests2D/test_colormap.json",
    "/tests2D/test_ray_variables.json",
    "/tests2D/test_ray_variables3D.json",
];

const load_tests = ["/testsEmbed/landscape.json"];

function runTest(json, test_file, testContainer) {
    const source = document.createElement("h3");
    testContainer.appendChild(source);
    source.innerHTML = test_file;

    const viewerElement = document.createElement("div");
    viewerElement.style.height = "450px";
    viewerElement.style.width = "800px";
    viewerElement.classList.add("tlmviewer");
    testContainer.appendChild(viewerElement);

    tlmviewer.embed(viewerElement, JSON.stringify(json));
}

// Use window.onload to ensure the DOM is fully loaded
window.onload = () => {
    console.log("loading tlmviewer tests");

    const mainEmbed = document.getElementById("embed-tests");
    const mainLoad = document.getElementById("load-tests");

    if (mainEmbed == null || mainLoad == null) {
        throw Error("can't find expected divs");
    }

    // test tlmviewer.embed
    for (const test_file of embed_tests) {
        const testContainer = document.createElement("div");
        mainEmbed.appendChild(testContainer);

        fetch(test_file)
            .then((response) => response.json())
            .then((data) => runTest(data, test_file, testContainer));
    }

    // test tlmviewer.load
    for (const test_file of load_tests) {
        const viewerElement = document.createElement("div");
        viewerElement.style.height = "450px";
        viewerElement.style.width = "800px";
        viewerElement.classList.add("tlmviewer");
        mainLoad.appendChild(viewerElement);

        tlmviewer.load(viewerElement, test_file).then(() => {
            // override title
            viewerElement.getElementsByClassName(
                "tlmviewer-title"
            )[0].innerHTML = test_file;
        });
    }

    // test tlmviewer.loadAll
    tlmviewer.loadAll();
};
