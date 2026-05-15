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

const performanceHistory = {
    bubble: [],
    shell: [],
    merge: [],
    quick: []
};

const algorithmComplexity = {
    bubble: "O(n^2)",
    shell: "O(n log n)",
    merge: "O(n log n)",
    quick: "O(n log n)"
};


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


function drawBars(array, containerId) {
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

    array.forEach(value => {
        const bar = document.createElement("div");
        bar.classList.add("bar");
        bar.style.width = `${barWidth}px`;
        bar.style.height = `${value}px`;
        container.appendChild(bar);
    });
}


// ======================================
// API Sorting Visualizer
// ======================================

async function startSorting() {
    const algorithm = algorithmSelect.value;

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

    const safeParallelTime = Math.max(Number(parallelData.time), 0.001);
    const speedup = (Number(serialData.time) / safeParallelTime).toFixed(2);

    document.getElementById("speedup").innerText =
        `Speedup: ${speedup}x`;

    updateMetrics(
        algorithm,
        Number(serialData.time),
        Number(parallelData.time),
        Number(speedup)
    );
}


async function animateBars(array, containerId) {
    const temp = [...array];

    for (let i = 0; i < temp.length; i++) {
        drawBars(
            temp.slice(0, i + 1).concat(
                Array(temp.length - i - 1).fill(5)
            ),
            containerId
        );

        await sleep(20);
    }

    drawBars(array, containerId);
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


// ======================================
// Metrics
// ======================================

function updateMetrics(algorithm, serialTime, parallelTime, speedupValue) {
    performanceHistory[algorithm].push({
        speedup: speedupValue,
        serialTime: serialTime,
        parallelTime: parallelTime
    });

    const history = performanceHistory[algorithm];

    const avgSpeedup = (
        history.reduce((sum, run) => sum + run.speedup, 0) / history.length
    ).toFixed(2);

    document.getElementById("avgSpeedup").innerText = `~${avgSpeedup}x`;

    const totalSerialTime = history.reduce((sum, run) => sum + run.serialTime, 0);
    const totalParallelTime = history.reduce((sum, run) => sum + run.parallelTime, 0);

    let savedPercent = 0;
    if (totalSerialTime > 0) {
        savedPercent = ((totalSerialTime - totalParallelTime) / totalSerialTime) * 100;
    }

    document.getElementById("timeSaved").innerText = `~${savedPercent.toFixed(0)}%`;

    document.getElementById("threadsUsed").innerText = "4";
    document.getElementById("complexity").innerText = algorithmComplexity[algorithm];
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Initial
sizeValue.innerText = size;
generateArray();
generateDemoArray();
