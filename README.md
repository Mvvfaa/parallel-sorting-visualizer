# Parallel Sorting Visualizer

A simple, interactive visualizer that demonstrates parallel and concurrent sorting algorithms in the browser. This repository contains HTML/CSS/JavaScript front-end code and small Python utilities used during development.

Built for learning and demonstration purposes.

## Live demo
Open `index.html` in a browser or serve the directory with a static server (see below).

## Features
- Visualize different sorting algorithms side-by-side
- Adjustable array size and animation speed
- Start / pause / reset controls
- Color-coded comparisons and swaps for clarity

## Getting started
These instructions assume you have Git and a browser. No build step is required for the static site.

1. Clone the repository

   git clone https://github.com/Mvvfaa/parallel-sorting-visualizer.git
   cd parallel-sorting-visualizer

2. Open the visualizer

- Option A — Open directly: double-click `index.html` in the repository root to open it in your default browser.
- Option B — Serve locally (recommended for consistent behavior):

  - Using Python 3:

    python -m http.server 8000

    then open http://localhost:8000 in your browser.

  - Using Node (http-server):

    npm install -g http-server
    http-server -p 8000

## Usage
- Use the UI controls to select the number of elements and animation speed.
- Click play to start; pause to halt the animation; reset to randomize the array again.
- Watch how algorithms operate in parallel for comparison.

## Development
- The front-end is plain HTML/CSS/JavaScript; edit files in the project root.
- A small amount of Python (if present) is for tooling or generation — check any `.py` files for details.

## Project structure
- index.html — main UI and entry point
- css/ — styles
- js/ — JavaScript code for visualizations
- assets/ — images and other static assets

## Language composition
According to repository analysis, the codebase is mostly:
- HTML (~78.6%)
- CSS (~9.4%)
- JavaScript (~8.8%)
- Python (~3.2%)
