// sorts.c - Five instrumented syllabus sorting algorithms (Unit 6)
// Keeps exact comparison and write counting rules from v1.
#include <stdlib.h>
#include "sortlens.h"

// 1. Bubble sort with early-exit flag
void sort_bubble(int arr[], int n, Counts *c, TraceQueue *q) {
    int i, j, temp, swapped;
    c->comparisons = 0;
    c->writes = 0;
    c->max_depth = 0;
    if (n <= 1) {
        trace_add(q, EV_DONE, 0, 0, 0, 0);
        return;
    }

    for (i = 0; i < n - 1; i++) {
        swapped = 0;
        for (j = 0; j < n - 1 - i; j++) {
            c->comparisons++;
            trace_add(q, EV_COMPARE, j, j + 1, arr[j], arr[j + 1]);
            if (arr[j] > arr[j + 1]) {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                c->writes += 2;
                trace_add(q, EV_SWAP, j, j + 1, 0, 0);
                swapped = 1;
            }
        }
        if (swapped == 0) break; // Array is sorted
    }
    trace_add(q, EV_DONE, 0, 0, 0, 0);
}

// 2. Selection sort
void sort_selection(int arr[], int n, Counts *c, TraceQueue *q) {
    int i, j, min_idx, temp;
    c->comparisons = 0;
    c->writes = 0;
    c->max_depth = 0;
    if (n <= 1) {
        trace_add(q, EV_DONE, 0, 0, 0, 0);
        return;
    }

    for (i = 0; i < n - 1; i++) {
        min_idx = i;
        for (j = i + 1; j < n; j++) {
            c->comparisons++;
            trace_add(q, EV_COMPARE, j, min_idx, arr[j], arr[min_idx]);
            if (arr[j] < arr[min_idx]) {
                min_idx = j;
            }
        }
        if (min_idx != i) {
            temp = arr[i];
            arr[i] = arr[min_idx];
            arr[min_idx] = temp;
            c->writes += 2;
            trace_add(q, EV_SWAP, i, min_idx, 0, 0);
        }
    }
    trace_add(q, EV_DONE, 0, 0, 0, 0);
}

// 3. Insertion sort by shifting
void sort_insertion(int arr[], int n, Counts *c, TraceQueue *q) {
    int i, j, key;
    c->comparisons = 0;
    c->writes = 0;
    c->max_depth = 0;
    if (n <= 1) {
        trace_add(q, EV_DONE, 0, 0, 0, 0);
        return;
    }

    for (i = 1; i < n; i++) {
        key = arr[i];
        j = i - 1;
        while (j >= 0) {
            c->comparisons++;
            trace_add(q, EV_COMPARE, j, i, arr[j], key);
            if (arr[j] > key) {
                int old_val = arr[j + 1];
                arr[j + 1] = arr[j];
                c->writes++;
                trace_add(q, EV_WRITE, j + 1, arr[j], old_val, 0);
                j--;
            } else {
                break;
            }
        }
        int old_dest = arr[j + 1];
        arr[j + 1] = key;
        c->writes++;
        trace_add(q, EV_WRITE, j + 1, key, old_dest, 0);
    }
    trace_add(q, EV_DONE, 0, 0, 0, 0);
}

// 4. Quick sort recursive Lomuto partition (last element as pivot)
static void quick_recurse(int arr[], int low, int high, Counts *c, TraceQueue *q, CallStack *s) {
    if (low < high) {
        stack_push(s, low, high);
        trace_add(q, EV_PUSH, low, high, 0, 0);
        trace_add(q, EV_RANGE, low, high, 0, 0);

        int pivot = arr[high];
        trace_add(q, EV_PIVOT, high, pivot, 0, 0);
        int i = low - 1;
        int j;

        for (j = low; j < high; j++) {
            c->comparisons++;
            trace_add(q, EV_COMPARE, j, high, arr[j], pivot);
            if (arr[j] <= pivot) {
                i++;
                if (i != j) {
                    int temp = arr[i];
                    arr[i] = arr[j];
                    arr[j] = temp;
                    c->writes += 2;
                    trace_add(q, EV_SWAP, i, j, 0, 0);
                }
            }
        }

        if (i + 1 != high) {
            int temp = arr[i + 1];
            arr[i + 1] = arr[high];
            arr[high] = temp;
            c->writes += 2;
            trace_add(q, EV_SWAP, i + 1, high, 0, 0);
        }

        int p = i + 1;
        quick_recurse(arr, low, p - 1, c, q, s);
        quick_recurse(arr, p + 1, high, c, q, s);

        trace_add(q, EV_POP, low, high, 0, 0);
        stack_pop(s);
    }
}

void sort_quick(int arr[], int n, Counts *c, TraceQueue *q, CallStack *s) {
    c->comparisons = 0;
    c->writes = 0;
    c->max_depth = 0;
    stack_init(s);
    if (n > 1) {
        quick_recurse(arr, 0, n - 1, c, q, s);
    }
    c->max_depth = s->max_depth;
    trace_add(q, EV_DONE, 0, 0, 0, 0);
}

// 5. Merge sort top-down with auxiliary buffer
static void merge(int arr[], int temp_buf[], int low, int mid, int high, Counts *c, TraceQueue *q) {
    int i = low;
    int j = mid + 1;
    int k = low;

    trace_add(q, EV_RANGE, low, high, 0, 0);

    while (i <= mid && j <= high) {
        c->comparisons++;
        trace_add(q, EV_COMPARE, i, j, arr[i], arr[j]);
        if (arr[i] <= arr[j]) {
            temp_buf[k++] = arr[i++];
        } else {
            temp_buf[k++] = arr[j++];
        }
    }

    while (i <= mid) {
        temp_buf[k++] = arr[i++];
    }

    while (j <= high) {
        temp_buf[k++] = arr[j++];
    }

    for (k = low; k <= high; k++) {
        int old_val = arr[k];
        arr[k] = temp_buf[k];
        c->writes++;
        trace_add(q, EV_WRITE, k, temp_buf[k], old_val, 0);
    }
}

static void merge_recurse(int arr[], int temp_buf[], int low, int high, Counts *c, TraceQueue *q, CallStack *s) {
    if (low < high) {
        stack_push(s, low, high);
        trace_add(q, EV_PUSH, low, high, 0, 0);

        int mid = low + (high - low) / 2;
        merge_recurse(arr, temp_buf, low, mid, c, q, s);
        merge_recurse(arr, temp_buf, mid + 1, high, c, q, s);
        merge(arr, temp_buf, low, mid, high, c, q);

        trace_add(q, EV_POP, low, high, 0, 0);
        stack_pop(s);
    }
}

void sort_merge(int arr[], int n, Counts *c, TraceQueue *q, CallStack *s) {
    c->comparisons = 0;
    c->writes = 0;
    c->max_depth = 0;
    stack_init(s);
    if (n <= 1) {
        trace_add(q, EV_DONE, 0, 0, 0, 0);
        return;
    }

    int *temp_buf = (int *)malloc(sizeof(int) * n);
    if (!temp_buf) {
        trace_add(q, EV_DONE, 0, 0, 0, 0);
        return;
    }

    merge_recurse(arr, temp_buf, 0, n - 1, c, q, s);
    c->max_depth = s->max_depth;
    free(temp_buf);
    trace_add(q, EV_DONE, 0, 0, 0, 0);
}
