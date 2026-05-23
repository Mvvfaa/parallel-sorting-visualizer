from flask import Flask, request, jsonify
from flask_cors import CORS
from multiprocessing import Pool
import time

app = Flask(__name__)
CORS(app)


# =========================================
# SORTING ALGORITHMS
# =========================================

def bubble_sort(arr):
    for i in range(len(arr)):
        for j in range(len(arr) - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]


def shell_sort(arr):
    gap = len(arr) // 2
    while gap > 0:
        for i in range(gap, len(arr)):
            temp = arr[i]
            j = i
            while j >= gap and arr[j - gap] > temp:
                arr[j] = arr[j - gap]
                j -= gap
            arr[j] = temp
        gap //= 2


def merge_sort(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        left = arr[:mid]
        right = arr[mid:]
        merge_sort(left)
        merge_sort(right)
        i = j = k = 0
        while i < len(left) and j < len(right):
            if left[i] < right[j]:
                arr[k] = left[i]
                i += 1
            else:
                arr[k] = right[j]
                j += 1
            k += 1
        while i < len(left):
            arr[k] = left[i]
            i += 1
            k += 1
        while j < len(right):
            arr[k] = right[j]
            j += 1
            k += 1


def quick_sort(arr):
    quick_sort_helper(arr, 0, len(arr) - 1)


def quick_sort_helper(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort_helper(arr, low, pi - 1)
        quick_sort_helper(arr, pi + 1, high)


def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1


# =========================================
# SORT A CHUNK (must be top-level for multiprocessing)
# =========================================

def sort_chunk(args):
    """Sort a chunk of the array — must be a top-level function for multiprocessing."""
    chunk, algorithm = args
    chunk_copy = chunk[:]
    if algorithm == "bubble":
        bubble_sort(chunk_copy)
    elif algorithm == "shell":
        shell_sort(chunk_copy)
    elif algorithm == "merge":
        merge_sort(chunk_copy)
    elif algorithm == "quick":
        quick_sort(chunk_copy)
    return chunk_copy


# =========================================
# MERGE TWO SORTED ARRAYS
# =========================================

def merge_two_sorted(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result


# =========================================
# TIMING HELPER — runs multiple times, returns best
# =========================================

def measure_time(sort_fn, arr, runs=5):
    """
    Run sort_fn on a copy of arr `runs` times.
    Returns (sorted_result, best_time_ms).
    Multiple runs give stable non-zero readings even for tiny arrays.
    """
    best_ms = float("inf")
    result = None
    for _ in range(runs):
        arr_copy = arr[:]
        t0 = time.perf_counter()
        sort_fn(arr_copy)
        t1 = time.perf_counter()
        elapsed = (t1 - t0) * 1000
        if elapsed < best_ms:
            best_ms = elapsed
            result = arr_copy
    return result, round(best_ms, 4)


# =========================================
# SERIAL SORT ENDPOINT
# =========================================

@app.route("/serial", methods=["POST"])
def serial_sort():
    data = request.json
    arr = data["array"]
    algorithm = data["algorithm"]

    sort_map = {
        "bubble": bubble_sort,
        "shell":  shell_sort,
        "merge":  merge_sort,
        "quick":  quick_sort,
    }
    sort_fn = sort_map.get(algorithm, bubble_sort)
    sorted_arr, elapsed_ms = measure_time(sort_fn, arr)

    return jsonify({
        "sorted_array": sorted_arr,
        "time": elapsed_ms
    })


# =========================================
# PARALLEL SORT ENDPOINT — uses multiprocessing (bypasses GIL)
# =========================================

@app.route("/parallel", methods=["POST"])
def parallel_sort():
    data = request.json
    arr = data["array"]
    algorithm = data["algorithm"]

    NUM_WORKERS = 4
    best_ms = float("inf")
    best_sorted = None

    for _ in range(5):
        arr_copy = arr[:]
        chunk_size = max(1, (len(arr_copy) + NUM_WORKERS - 1) // NUM_WORKERS)
        chunks = [
            arr_copy[i: i + chunk_size]
            for i in range(0, len(arr_copy), chunk_size)
        ]

        t0 = time.perf_counter()

        # multiprocessing.Pool bypasses Python's GIL — each worker runs
        # in a separate process, giving genuine parallel speedup on
        # CPU-bound sorting tasks.
        with Pool(processes=NUM_WORKERS) as pool:
            sorted_chunks = pool.map(sort_chunk, [(chunk, algorithm) for chunk in chunks])

        # Merge sorted chunks back together
        merged = sorted_chunks[0]
        for chunk in sorted_chunks[1:]:
            merged = merge_two_sorted(merged, chunk)

        t1 = time.perf_counter()
        elapsed = (t1 - t0) * 1000

        if elapsed < best_ms:
            best_ms = elapsed
            best_sorted = merged

    return jsonify({
        "sorted_array": best_sorted,
        "time": round(best_ms, 4)
    })


# =========================================
# MAIN
# =========================================

if __name__ == "__main__":
    # freeze_support() is needed on Windows for multiprocessing
    from multiprocessing import freeze_support
    freeze_support()
    app.run(debug=True)