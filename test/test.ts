import { tlmviewer } from "../src/main.ts";

const all_tests = [
    "test1.json",
    "test2.json",
    "test3.json",
    "test4.json",
    "test5.json",
    "test6.json",
];

function runTest(json, test_file) {
    const main = document.getElementsByTagName("main")[0];

    const container = document.createElement("div");
    main.appendChild(container);

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
    for (const test_file of all_tests) {
        fetch("/tests/" + test_file)
            .then((response) => response.json())
            .then((data) => runTest(data, test_file));
    }
};
