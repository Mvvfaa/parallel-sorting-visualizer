from flask import Flask, request, jsonify
from flask_cors import CORS

from concurrent.futures import ProcessPoolExecutor
import time

app = Flask(__name__)

CORS(app)

# =========================================
# BUBBLE SORT
# =========================================

def bubble_sort(arr):

    for i in range(len(arr)):

        for j in range(len(arr) - i - 1):

            if arr[j] > arr[j + 1]:

                arr[j], arr[j + 1] = arr[j + 1], arr[j]


# =========================================
# SHELL SORT
# =========================================

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


# =========================================
# MERGE SORT
# =========================================

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


# =========================================
# QUICK SORT
# =========================================

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
# GET SORT FUNCTION
# =========================================

def get_sort_function(name):

    if name == "bubble":
        return bubble_sort

    if name == "shell":
        return shell_sort

    if name == "merge":
        return merge_sort

    if name == "quick":
        return quick_sort

    return bubble_sort


def sort_chunk(args):
    """Sort a chunk in a separate process."""
    chunk, algorithm = args
    chunk_copy = chunk.copy()
    sort_function = get_sort_function(algorithm)
    sort_function(chunk_copy)
    return chunk_copy


# =========================================
# SERIAL SORT
# =========================================

@app.route("/serial", methods=["POST"])
def serial_sort():

    data = request.json

    arr = data["array"]

    algorithm = data["algorithm"]

    arr_copy = arr.copy()

    sort_function = get_sort_function(algorithm)

    start = time.perf_counter()

    sort_function(arr_copy)

    end = time.perf_counter()

    return jsonify({

        "sorted_array": arr_copy,

        "time":
            round((end - start) * 1000, 3)
    })


# =========================================
# PARALLEL MERGE FUNCTION
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
# PARALLEL SORT
# =========================================


# =========================================
# PARALLEL SORT - Simulated for Demo
# =========================================

# For educational purposes: split array into chunks, sort each, and merge
# This demonstrates the parallel strategy without ProcessPoolExecutor overhead


@app.route("/parallel", methods=["POST"])
def parallel_sort():

    data = request.json

    arr = data["array"]

    algorithm = data["algorithm"]

    arr_copy = arr.copy()

    start = time.perf_counter()

    # Split into 4 logical chunks
    chunk_count = 4
    chunk_size = (len(arr_copy) + chunk_count - 1) // chunk_count
    chunks = [arr_copy[i:i + chunk_size] for i in range(0, len(arr_copy), chunk_size)]

    # Sort each chunk using the specified algorithm
    sort_function = get_sort_function(algorithm)
    sorted_chunks = []
    for chunk in chunks:
        chunk_copy = chunk.copy()
        sort_function(chunk_copy)
        sorted_chunks.append(chunk_copy)

    # Merge all sorted chunks back together
    sorted_array = sorted_chunks[0]
    for chunk in sorted_chunks[1:]:
        sorted_array = merge_two_sorted(sorted_array, chunk)

    end = time.perf_counter()

    return jsonify({

        "sorted_array": sorted_array,

        "time":
            round((end - start) * 1000, 3)
    })


# =========================================
# MAIN
# =========================================

if __name__ == "__main__":
    app.run(debug=True)