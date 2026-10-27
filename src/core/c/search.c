// search.c - Linear search and Binary search (Unit 6)
// Records steps for animated visualization in Search Lab.
#include "sortlens.h"

// Linear search on array. Records every index visited.
int linear_search(const int arr[], int n, int target, int *comparisons, SearchStep steps[], int max_steps, int *num_steps) {
    int i;
    *comparisons = 0;
    *num_steps = 0;

    for (i = 0; i < n; i++) {
        (*comparisons)++;
        if (*num_steps < max_steps) {
            steps[*num_steps].index = i;
            steps[*num_steps].low = 0;
            steps[*num_steps].high = n - 1;
            (*num_steps)++;
        }
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}

// Binary search on sorted array. Records mid index and low/high window.
int binary_search(const int arr[], int n, int target, int *comparisons, SearchStep steps[], int max_steps, int *num_steps) {
    int low = 0;
    int high = n - 1;
    *comparisons = 0;
    *num_steps = 0;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        (*comparisons)++;
        if (*num_steps < max_steps) {
            steps[*num_steps].index = mid;
            steps[*num_steps].low = low;
            steps[*num_steps].high = high;
            (*num_steps)++;
        }

        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}
