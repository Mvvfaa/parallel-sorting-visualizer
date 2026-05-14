let size = 30;

let originalArray = [];


// ======================================
// Slider
// ======================================

document
.getElementById("sizeSlider")
.addEventListener("input", function () {

    size = parseInt(this.value);

    generateArray();
});


// ======================================
// Generate Array
// ======================================

function generateArray() {

    originalArray = [];

    for (let i = 0; i < size; i++) {

        originalArray.push(

            Math.floor(
                Math.random() * 300
            ) + 20
        );
    }

    drawBars(
        originalArray,
        "originalBars"
    );

    drawBars(
        originalArray,
        "serialBars"
    );

    drawBars(
        originalArray,
        "parallelBars"
    );
}


// ======================================
// Draw Bars
// ======================================

function drawBars(array, containerId) {

    const container =
        document.getElementById(containerId);

    container.innerHTML = "";

    array.forEach(value => {

        const bar =
            document.createElement("div");

        bar.classList.add("bar");

        bar.style.height =
            `${value}px`;

        container.appendChild(bar);
    });
}


// ======================================
// START SORTING
// ======================================

async function startSorting() {

    const algorithm =
        document.getElementById(
            "algorithm"
        ).value;

    // SERIAL

    let serialResponse =
        await fetch(
            "http://127.0.0.1:5000/serial",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    array: originalArray,

                    algorithm: algorithm
                })
            }
        );

    let serialData =
        await serialResponse.json();

    animateBars(
        serialData.sorted_array,
        "serialBars"
    );

    document.getElementById(
        "serialTime"
    ).innerText =
        `Time: ${serialData.time} ms`;

    // PARALLEL

    let parallelResponse =
        await fetch(
            "http://127.0.0.1:5000/parallel",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    array: originalArray,

                    algorithm: algorithm
                })
            }
        );

    let parallelData =
        await parallelResponse.json();

    animateBars(
        parallelData.sorted_array,
        "parallelBars"
    );

    document.getElementById(
        "parallelTime"
    ).innerText =
        `Time: ${parallelData.time} ms`;

    // SPEEDUP

    let speedup =
        (
            serialData.time /
            parallelData.time
        ).toFixed(2);

    document.getElementById(
        "speedup"
    ).innerText =
        `Speedup: ${speedup}x`;
}


// ======================================
// Animate Bars
// ======================================

async function animateBars(array, containerId) {

    let temp = [...array];

    for (let i = 0; i < temp.length; i++) {

        drawBars(
            temp.slice(0, i + 1)
                .concat(
                    Array(
                        temp.length - i - 1
                    ).fill(5)
                ),
            containerId
        );

        await sleep(20);
    }

    drawBars(array, containerId);
}


// ======================================
// Sleep
// ======================================

function sleep(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}


// Initial
generateArray();