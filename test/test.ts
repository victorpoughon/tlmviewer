import tlmviewer from "../src/main.ts";

async function fetchManifest(): Promise<any> {
    return fetch("/testscenes.json")
        .then((response) => response.json())
        .then((files) => {
            return files;
        });
}

function loadMainViewer(test_file) {
    const viewerElement = document.getElementById("main-viewer") as HTMLElement;
    tlmviewer.load(viewerElement, test_file);
}

// Use window.onload to ensure the DOM is fully loaded
window.onload = async () => {
    console.log("loading tlmviewer tests");
    const all_tests = (await fetchManifest()).toSorted();
    console.log(`loaded ${all_tests.length} json test files from manifest`);

    const ul = document.getElementById("tests-list") as HTMLElement;
    for (const test_file of all_tests) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = test_file;
        a.addEventListener('click', (event) => {
            event.preventDefault();
            loadMainViewer(test_file);
          });
        li.appendChild(a);
        ul.appendChild(li);
    }


    tlmviewer.loadAll();
};
