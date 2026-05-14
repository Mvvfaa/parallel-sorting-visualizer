from flask import Flask, request, jsonify
from flask_cors import CORS

import threading
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

    start = time.time()

    sort_function(arr_copy)

    end = time.time()

    return jsonify({

        "sorted_array": arr_copy,

        "time":
            round((end - start) * 1000, 2)
    })


# =========================================
# PARALLEL SORT
# =========================================

@app.route("/parallel", methods=["POST"])
def parallel_sort():

    data = request.json

    arr = data["array"]

    algorithm = data["algorithm"]

    sort_function = get_sort_function(algorithm)

    arr_copy = arr.copy()

    mid = len(arr_copy) // 2

    left_half = arr_copy[:mid]

    right_half = arr_copy[mid:]

    start = time.time()

    t1 = threading.Thread(
        target=sort_function,
        args=(left_half,)
    )

    t2 = threading.Thread(
        target=sort_function,
        args=(right_half,)
    )

    t1.start()
    t2.start()

    t1.join()
    t2.join()

    merged = sorted(left_half + right_half)

    end = time.time()

    return jsonify({

        "sorted_array": merged,

        "time":
            round((end - start) * 1000, 2)
    })


# =========================================
# MAIN
# =========================================

if __name__ == "__main__":

    app.run(debug=True)