// test_core.c - Automated assertions for SortLens v2 C core
// Tests sorts, counting rules, trace replaying, hash table duplicate checks, and searches.
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include "../core/sortlens.h"

// Helper to check if an array is sorted in ascending order
static int check_sorted(const int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        if (arr[i] > arr[i + 1]) return 0;
    }
    return 1;
}

// 1. Test that all five algorithms correctly sort different dataset patterns
static void test_sort_correctness(void) {
    int patterns[4][10] = {
        {10, 3, 18, 5, 12, 1, 15, 7, 20, 2}, // Random
        {1, 2, 3, 4, 5, 6, 7, 8, 9, 10},     // Sorted
        {10, 9, 8, 7, 6, 5, 4, 3, 2, 1},     // Reverse
        {5, 2, 5, 1, 9, 2, 5, 9, 1, 5}       // Duplicates
    };
    int n = 10;

    for (int p = 0; p < 4; p++) {
        for (int i = 0; i < n; i++) {
            sl_set_value(i, patterns[p][i]);
        }
        for (int algo = 0; algo < ALGO_COUNT; algo++) {
            sl_run(algo, n, 0);
            int result[10];
            for (int i = 0; i < n; i++) {
                result[i] = sl_result_value(algo, i);
            }
            assert(check_sorted(result, n));
        }
    }
    printf("PASS: test_sort_correctness (all 5 sorts correctly sort random, sorted, reverse, duplicates)\n");
}

// 2. Closed-form engineering tests for comparisons and writes
static void test_closed_form_counts(void) {
    int n = 10;

    // A. Selection Sort comparisons = n(n-1)/2 on any array
    int arr_rev[10] = {10, 9, 8, 7, 6, 5, 4, 3, 2, 1};
    for (int i = 0; i < n; i++) sl_set_value(i, arr_rev[i]);
    sl_run(ALGO_SELECTION, n, 0);
    assert(sl_comparisons(ALGO_SELECTION) == (n * (n - 1)) / 2);

    int arr_sorted[10] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    for (int i = 0; i < n; i++) sl_set_value(i, arr_sorted[i]);
    sl_run(ALGO_SELECTION, n, 0);
    assert(sl_comparisons(ALGO_SELECTION) == (n * (n - 1)) / 2);

    // B. Bubble sort on already sorted: n - 1 comparisons, 0 writes
    sl_run(ALGO_BUBBLE, n, 0);
    assert(sl_comparisons(ALGO_BUBBLE) == n - 1);
    assert(sl_writes(ALGO_BUBBLE) == 0);

    // C. Insertion sort on already sorted: n - 1 comparisons
    sl_run(ALGO_INSERTION, n, 0);
    assert(sl_comparisons(ALGO_INSERTION) == n - 1);

    // D. Bubble sort writes = 2 * inversions
    int arr_mix[8] = {4, 3, 2, 1, 8, 7, 6, 5};
    int n_mix = 8;
    for (int i = 0; i < n_mix; i++) sl_set_value(i, arr_mix[i]);
    sl_analyze(n_mix, JUDGE_COMPARISONS);
    long long inv = sl_inversions();
    sl_run(ALGO_BUBBLE, n_mix, 0);
    assert(sl_writes(ALGO_BUBBLE) == 2 * inv);

    // E. Insertion sort on reversed array: n(n-1)/2 comparisons
    for (int i = 0; i < n; i++) sl_set_value(i, arr_rev[i]);
    sl_run(ALGO_INSERTION, n, 0);
    assert(sl_comparisons(ALGO_INSERTION) == (n * (n - 1)) / 2);

    printf("PASS: test_closed_form_counts (all mathematical invariants verified)\n");
}

// 3. Trace replaying: applying trace events to a copy of original array gives sorted array
static void test_trace_replay(void) {
    int orig[12] = {9, 2, 7, 4, 1, 8, 3, 6, 5, 12, 11, 10};
    int n = 12;

    for (int algo = 0; algo < ALGO_COUNT; algo++) {
        for (int i = 0; i < n; i++) sl_set_value(i, orig[i]);
        sl_run(algo, n, 1); // record trace
        assert(sl_overflow(algo) == 0);

        int sim[12];
        for (int i = 0; i < n; i++) sim[i] = orig[i];

        int ev_count = sl_event_count(algo);
        long long counted_compares = 0;

        for (int k = 0; k < ev_count; k++) {
            int t = sl_event_type(algo, k);
            int a = sl_event_a(algo, k);
            int b = sl_event_b(algo, k);
            if (t == EV_COMPARE) {
                counted_compares++;
            } else if (t == EV_SWAP) {
                int tmp = sim[a];
                sim[a] = sim[b];
                sim[b] = tmp;
            } else if (t == EV_WRITE) {
                sim[a] = b; // a = index, b = new value
            }
        }

        assert(check_sorted(sim, n));
        assert(counted_compares == sl_comparisons(algo));
    }
    printf("PASS: test_trace_replay (replaying events produces sorted array, compare count matches)\n");
}

// 4. Hash table duplicate detection matches naive O(n^2) check
static void test_hashtable_duplicates(void) {
    int test_arr[20] = {12, 5, 12, 7, 9, 5, 23, 12, 44, 9, 3, 8, 7, 5, 99, 1, 23, 6, 8, 12};
    int n = 20;

    for (int i = 0; i < n; i++) sl_set_value(i, test_arr[i]);
    sl_analyze(n, JUDGE_COMPARISONS);

    // Naive O(n^2) distinct calculation
    int naive_distinct = 0;
    for (int i = 0; i < n; i++) {
        int first_seen = 1;
        for (int j = 0; j < i; j++) {
            if (test_arr[i] == test_arr[j]) {
                first_seen = 0;
                break;
            }
        }
        if (first_seen) naive_distinct++;
    }

    assert(sl_distinct() == naive_distinct);
    printf("PASS: test_hashtable_duplicates (Hash table distinct matches O(n^2) ground truth: %d)\n", naive_distinct);
}

// 5. Search Lab: Linear and Binary search correctness
static void test_search(void) {
    int arr[10] = {10, 40, 20, 50, 30, 80, 60, 90, 70, 100};
    int n = 10;
    for (int i = 0; i < n; i++) sl_set_value(i, arr[i]);
    sl_make_sorted(n);

    // Sorted array is [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    // Search target 70 -> index 6
    int idx_lin = sl_search(0, 70, n);
    assert(idx_lin == 6);
    assert(sl_search_comparisons() == 7);

    int idx_bin = sl_search(1, 70, n);
    assert(idx_bin == 6);
    assert(sl_search_comparisons() > 0 && sl_search_comparisons() <= 4);

    // Target not found -> -1
    int idx_miss_lin = sl_search(0, 45, n);
    assert(idx_miss_lin == -1);
    assert(sl_search_comparisons() == n);

    int idx_miss_bin = sl_search(1, 45, n);
    assert(idx_miss_bin == -1);

    printf("PASS: test_search (Linear and Binary search both find targets and report miss)\n");
}

// 6. Recursion stack depth test
static void test_stack_depth(void) {
    // Sorted array of size 15 with last-element pivot Lomuto partition
    int n = 15;
    for (int i = 0; i < n; i++) sl_set_value(i, i + 1);
    sl_run(ALGO_QUICK, n, 0);
    // On sorted array with Lomuto, recursion depth approaches n - 1
    assert(sl_max_depth(ALGO_QUICK) >= 10);
    printf("PASS: test_stack_depth (Quick sort stack depth on sorted data = %d, demonstrates O(n) degradation)\n",
           sl_max_depth(ALGO_QUICK));
}

int main(void) {
    printf("=== SortLens v2 Core Test Suite ===\n");
    test_sort_correctness();
    test_closed_form_counts();
    test_trace_replay();
    test_hashtable_duplicates();
    test_search();
    test_stack_depth();
    printf("=== ALL TESTS PASSED SUCCESSFULLY ===\n");
    return 0;
}
