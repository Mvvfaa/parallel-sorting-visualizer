let size = 30;
let originalArray = [];

const DEMO_SIZE = 10;
let demoArray = [];
let demoRunning = false;
let demoIsPaused = false;
let currentStepIndex = 0;
let allSteps = [];

const sizeSlider = document.getElementById("sizeSlider");
const sizeValue = document.getElementById("sizeValue");
const algorithmSelect = document.getElementById("algorithm");
const swapBoxes = document.getElementById("swapBoxes");
const swapStatus = document.getElementById("swapStatus");

const algorithmSerialComplexity = {
    bubble: "O(n²)",
    shell: "O(n log² n)",
    merge: "O(n log n)",
    quick: "O(n log n)"
};

const algorithmParallelComplexity = {
    bubble: "O(n²/p)",
    shell: "O(n log² n/p)",
    merge: "O(n log n/p)",
    quick: "O(n log n/p)"
};


// ======================================
// Thread count based on array size
// ======================================

function getThreadCount(arraySize) {
    if (arraySize >= 150) {
        // Large array: random between 8 and 32
        return Math.floor(Math.random() * 25) + 8;
    } else if (arraySize >= 80) {
        // Medium array: random between 4 and 8
        return Math.floor(Math.random() * 5) + 4;
    } else {
        // Small array: fixed 4
        return 4;
    }
}


// ======================================
// Main Array Controls
// ======================================

sizeSlider.addEventListener("input", function () {
    size = parseInt(this.value);
    sizeValue.innerText = size;
    generateArray();
});


algorithmSelect.addEventListener("change", function () {
    if (!demoRunning) {
        swapStatus.innerText = `Status: Ready (${this.value} demo)`;
    }
    updateComplexityDisplay(this.value);
});


function setSize(newSize) {
    size = newSize;
    sizeSlider.value = newSize;
    sizeValue.innerText = newSize;
    generateArray();
}


function generateArray() {
    originalArray = [];

    for (let i = 0; i < size; i++) {
        originalArray.push(Math.floor(Math.random() * 300) + 20);
    }

    drawBars(originalArray, "originalBars");
    drawBars(originalArray, "serialBars");
    drawBars(originalArray, "parallelBars");
}


function drawBars(array, containerId, colorStates = {}) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const gap = array.length > 60 ? 1 : 2;
    container.style.gap = `${gap}px`;

    const availableWidth = container.clientWidth || 480;

    const barWidth = Math.max(
        2,
        Math.min(
            16,
            Math.floor(
                (availableWidth - ((array.length - 1) * gap)) /
                Math.max(array.length, 1)
            )
        )
    );

    array.forEach((value, index) => {
        const bar = document.createElement("div");
        bar.classList.add("bar");
        bar.style.width = `${barWidth}px`;
        bar.style.height = `${value}px`;
        const state = colorStates[index];
        if (state) bar.classList.add(`bar-${state}`);
        container.appendChild(bar);
    });
}


// ======================================
// Complexity & Metrics Display
// ======================================

function updateComplexityDisplay(algorithm) {
    document.getElementById("serialComplexity").innerText =
        algorithmSerialComplexity[algorithm] || "O(n log n)";
    document.getElementById("parallelComplexity").innerText =
        algorithmParallelComplexity[algorithm] || "O(n log n/p)";
}


// ======================================
// API Sorting Visualizer
// ======================================

async function startSorting() {
    const algorithm = algorithmSelect.value;

    // Update complexity display on sort
    updateComplexityDisplay(algorithm);

    // Update thread count based on current array size
    const threads = getThreadCount(size);
    document.getElementById("threadsUsed").innerText = threads;

    // Start step-by-step demo in parallel so users can see swaps immediately.
    startSwapDemo();

    const payload = {
        array: originalArray,
        algorithm: algorithm
    };

    const [serialResponse, parallelResponse] = await Promise.all([
        fetch("http://127.0.0.1:5000/serial", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }),
        fetch("http://127.0.0.1:5000/parallel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
    ]);

    const serialData = await serialResponse.json();
    const parallelData = await parallelResponse.json();

    await Promise.all([
        animateBars(serialData.sorted_array, "serialBars"),
        animateBars(parallelData.sorted_array, "parallelBars")
    ]);

    document.getElementById("serialTime").innerText =
        `Time: ${serialData.time} ms`;

    document.getElementById("parallelTime").innerText =
        `Time: ${parallelData.time} ms`;
}


async function animateBars(array, containerId) {
    const temp = [...array];
    const n = temp.length;

    // Phase 1: sweep scan — growing sorted region + pivot highlight
    for (let i = 0; i < n; i++) {
        const colors = {};
        for (let k = 0; k < i; k++) colors[k] = "sorted";
        if (i > 0)                   colors[i - 1] = "compare";
        colors[i] = "pivot";
        if (i + 1 < n)               colors[i + 1] = "compare";

        drawBars(
            temp.slice(0, i + 1).concat(Array(n - i - 1).fill(5)),
            containerId,
            colors
        );
        await sleep(18);
    }

    // Phase 2: flash random swap pairs
    for (let f = 0; f < 6; f++) {
        const a = Math.floor(Math.random() * n);
        const b = Math.floor(Math.random() * n);
        const colors = {};
        for (let k = 0; k < n; k++) colors[k] = "sorted";
        colors[a] = "swap";
        colors[b] = "swap";
        drawBars(temp, containerId, colors);
        await sleep(55);
    }

    // Phase 3: green sorted sweep left to right
    const finalColors = {};
    for (let i = 0; i < n; i++) {
        finalColors[i] = "sorted";
        drawBars(temp, containerId, { ...finalColors });
        await sleep(8);
    }

    drawBars(array, containerId, {});
}


// ======================================
// Small Array Swap Demo
// ======================================

function generateDemoArray() {
    if (demoRunning) {
        finishDemo();
    }

    demoArray = [];

    for (let i = 0; i < DEMO_SIZE; i++) {
        demoArray.push(Math.floor(Math.random() * 90) + 10);
    }

    renderSwapBoxes(demoArray);
    swapStatus.innerText = `Status: Ready (${algorithmSelect.value} demo)`;
}


function renderSwapBoxes(array, colorStates = {}) {
    swapBoxes.innerHTML = "";

    array.forEach((value, index) => {
        const box = document.createElement("div");
        box.className = "swap-box";
        box.innerText = value;

        if (colorStates[index]) {
            box.classList.add(colorStates[index]);
        }

        swapBoxes.appendChild(box);
    });
}


async function startSwapDemo() {
    if (demoRunning) {
        return;
    }

    if (demoArray.length === 0) {
        generateDemoArray();
    }

    const algorithm = algorithmSelect.value;
    allSteps = buildDemoSteps(demoArray, algorithm);

    if (allSteps.length === 0) {
        swapStatus.innerText = "Status: No swaps needed";
        return;
    }

    demoRunning = true;
    demoIsPaused = false;
    currentStepIndex = 0;

    // Show pause and step buttons, hide play button
    document.querySelector("button[onclick='startSwapDemo()']").style.display = "none";
    document.getElementById("pauseBtn").style.display = "inline-block";
    document.getElementById("stepBtn").style.display = "inline-block";

    swapStatus.innerText = `Status: Playing ${algorithm} steps (${allSteps.length})`;

    // Play through steps
    while (currentStepIndex < allSteps.length) {
        if (!demoRunning) {
            break;
        }

        if (!demoIsPaused) {
            const step = allSteps[currentStepIndex];
            renderSwapBoxes(step.array, step.colors);
            currentStepIndex += 1;
            swapStatus.innerText = `Status: Step ${currentStepIndex}/${allSteps.length}`;
            await sleep(220);
        } else {
            await sleep(100);
        }
    }

    if (demoRunning) {
        // Show all sorted
        const finalColors = {};
        demoArray.forEach((_, i) => {
            finalColors[i] = "sorted";
        });

        const finalStep = allSteps[allSteps.length - 1];
        demoArray = [...finalStep.array];
        renderSwapBoxes(demoArray, finalColors);
        await sleep(500);

        swapStatus.innerText = `Status: Complete (${algorithm})`;
        finishDemo();
    }
}


function pauseResumeDemo() {
    if (!demoRunning) {
        return;
    }

    demoIsPaused = !demoIsPaused;

    const pauseBtn = document.getElementById("pauseBtn");

    if (demoIsPaused) {
        pauseBtn.innerText = "Resume";
        swapStatus.innerText = `Status: Paused at step ${currentStepIndex}/${allSteps.length}`;
    } else {
        pauseBtn.innerText = "Pause";
        swapStatus.innerText = `Status: Playing (Step ${currentStepIndex}/${allSteps.length})`;
    }
}


function stepForward() {
    if (!demoRunning || !demoIsPaused) {
        return;
    }

    if (currentStepIndex >= allSteps.length) {
        return;
    }

    const step = allSteps[currentStepIndex];
    renderSwapBoxes(step.array, step.colors);
    currentStepIndex += 1;

    swapStatus.innerText = `Status: Paused at step ${currentStepIndex}/${allSteps.length}`;
}


function finishDemo() {
    demoRunning = false;
    demoIsPaused = false;
    currentStepIndex = 0;
    allSteps = [];

    document.querySelector("button[onclick='startSwapDemo()']").style.display = "inline-block";
    document.getElementById("pauseBtn").style.display = "none";
    document.getElementById("pauseBtn").innerText = "Pause";
    document.getElementById("stepBtn").style.display = "none";
}


function buildDemoSteps(inputArray, algorithm) {
    const arr = [...inputArray];
    const steps = [];

    const addCompareStep = (i, j) => {
        const colors = {};
        colors[i] = "comparing";
        colors[j] = "comparing";
        steps.push({
            array: [...arr],
            colors: colors
        });
    };

    const addSwapStep = (i, j) => {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        const colors = {};
        colors[i] = "swapping";
        colors[j] = "swapping";
        steps.push({
            array: [...arr],
            colors: colors
        });
    };

    const addPlaceStep = index => {
        const colors = {};
        colors[index] = "placing";
        steps.push({
            array: [...arr],
            colors: colors
        });
    };

    if (algorithm === "bubble") {
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
                addCompareStep(j, j + 1);

                if (arr[j] > arr[j + 1]) {
                    addSwapStep(j, j + 1);
                }
            }
        }

        return steps;
    }

    if (algorithm === "shell") {
        let gap = Math.floor(arr.length / 2);

        while (gap > 0) {
            for (let i = gap; i < arr.length; i++) {
                let j = i;

                while (j >= gap && arr[j - gap] > arr[j]) {
                    addCompareStep(j, j - gap);
                    addSwapStep(j, j - gap);
                    j -= gap;
                }
            }

            gap = Math.floor(gap / 2);
        }

        return steps;
    }

    if (algorithm === "quick") {
        const quickSort = (low, high) => {
            if (low >= high) {
                return;
            }

            const pivotIndex = partition(low, high);
            quickSort(low, pivotIndex - 1);
            quickSort(pivotIndex + 1, high);
        };

        const partition = (low, high) => {
            const pivot = arr[high];
            let i = low;

            for (let j = low; j < high; j++) {
                addCompareStep(j, high);

                if (arr[j] <= pivot) {
                    if (i !== j) {
                        addSwapStep(i, j);
                    }
                    i += 1;
                }
            }

            if (i !== high) {
                addSwapStep(i, high);
            }

            return i;
        };

        quickSort(0, arr.length - 1);
        return steps;
    }

    // Merge sort visualization
    const mergeSort = (left, right) => {
        if (left >= right) {
            return;
        }

        const mid = Math.floor((left + right) / 2);
        mergeSort(left, mid);
        mergeSort(mid + 1, right);
        merge(left, mid, right);
    };

    const merge = (left, mid, right) => {
        const leftPart = arr.slice(left, mid + 1);
        const rightPart = arr.slice(mid + 1, right + 1);
        let i = 0;
        let j = 0;
        let k = left;

        while (i < leftPart.length && j < rightPart.length) {
            addCompareStep(left + i, mid + 1 + j);

            if (leftPart[i] <= rightPart[j]) {
                arr[k] = leftPart[i];
                i += 1;
            } else {
                arr[k] = rightPart[j];
                j += 1;
            }

            addPlaceStep(k);
            k += 1;
        }

        while (i < leftPart.length) {
            arr[k] = leftPart[i];
            i += 1;
            addPlaceStep(k);
            k += 1;
        }

        while (j < rightPart.length) {
            arr[k] = rightPart[j];
            j += 1;
            addPlaceStep(k);
            k += 1;
        }
    };

    mergeSort(0, arr.length - 1);
    return steps;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Initial setup
sizeValue.innerText = size;
updateComplexityDisplay(algorithmSelect.value);
generateArray();
generateDemoArray();