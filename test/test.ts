import { tlmviewer } from "../src/main.ts";


function runTests(json) {
    const main = document.getElementsByTagName("main")[0];

    for (const test of json) {
        const div = document.createElement("div");
        main.appendChild(div);

        tlmviewer(div, JSON.stringify(test));
    }
}

console.log("hello from test.ts");

// Use window.onload to ensure the DOM is fully loaded
window.onload = () => {
    fetch("/tests.json").then(response => response.json()).then(runTests);
};
