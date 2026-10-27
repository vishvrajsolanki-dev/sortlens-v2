// analyzer.c - Array shape analyzer and cost prediction model
// Measures inversions, duplicates, max_left_greater, and predicts the cheapest sort.
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "sortlens.h"

// Count inversions using merge sort helper
static long long merge_count(int arr[], int temp[], int low, int high) {
    long long inv_count = 0;
    if (low < high) {
        int mid = low + (high - low) / 2;
        inv_count += merge_count(arr, temp, low, mid);
        inv_count += merge_count(arr, temp, mid + 1, high);

        int i = low;
        int j = mid + 1;
        int k = low;

        while (i <= mid && j <= high) {
            if (arr[i] <= arr[j]) {
                temp[k++] = arr[i++];
            } else {
                temp[k++] = arr[j++];
                inv_count += (mid - i + 1);
            }
        }

        while (i <= mid) {
            temp[k++] = arr[i++];
        }
        while (j <= high) {
            temp[k++] = arr[j++];
        }
        for (k = low; k <= high; k++) {
            arr[k] = temp[k];
        }
    }
    return inv_count;
}

// Compute total number of inversions
long long count_inversions(const int arr[], int n) {
    if (n <= 1) return 0;
    int *arr_copy = (int *)malloc(sizeof(int) * n);
    int *temp = (int *)malloc(sizeof(int) * n);
    if (!arr_copy || !temp) {
        if (arr_copy) free(arr_copy);
        if (temp) free(temp);
        return 0;
    }
    for (int i = 0; i < n; i++) {
        arr_copy[i] = arr[i];
    }
    long long inv = merge_count(arr_copy, temp, 0, n - 1);
    free(arr_copy);
    free(temp);
    return inv;
}

// Compute max_left_greater: max count of larger elements sitting to the left of any item
// Nested loop is O(n^2), acceptable because n <= 100.
int compute_max_left_greater(const int arr[], int n) {
    int max_p = 0;
    for (int i = 0; i < n; i++) {
        int count = 0;
        for (int j = 0; j < i; j++) {
            if (arr[j] > arr[i]) {
                count++;
            }
        }
        if (count > max_p) {
            max_p = count;
        }
    }
    return max_p;
}

// Full shape analysis and Cost Model estimation
void analyze_shape(const int arr[], int n, int judge_by, ShapeAnalysis *out) {
    if (n <= 1) {
        out->inversions = 0;
        out->inversion_ratio = 0.0;
        out->max_left_greater = 0;
        out->distinct = n;
        out->collisions = 0;
        out->dup_ratio = 0.0;
        for (int i = 0; i < ALGO_COUNT; i++) out->estimates[i] = 0;
        out->predicted_algo = ALGO_INSERTION;
        snprintf(out->reason, sizeof(out->reason), "Trivial array of size %d.", n);
        return;
    }

    // 1. Measure shape features
    out->inversions = count_inversions(arr, n);
    double total_pairs = (double)n * (n - 1) / 2.0;
    out->inversion_ratio = (double)out->inversions / total_pairs;
    out->max_left_greater = compute_max_left_greater(arr, n);

    // Hash table duplicate analysis
    HashTable ht;
    ht_init(&ht);
    for (int i = 0; i < n; i++) {
        ht_insert(&ht, arr[i]);
    }
    out->distinct = ht.distinct_count;
    out->collisions = ht.collision_count;
    out->dup_ratio = (double)(n - ht.distinct_count) / (double)(n - 1);
    ht_free(&ht);

    // 2. Cost Model Variables
    double I = (double)out->inversions;
    double p = (double)out->max_left_greater;
    double r = out->inversion_ratio;
    double m = 4.0 * r * (1.0 - r); // 0 when sorted/reversed, 1 when well mixed
    if (m < 0.0) m = 0.0;
    double d = out->dup_ratio;
    double log2n = log((double)n) / log(2.0);

    // Initial formula constants (calibrated in Phase 2)
    // Selection
    long long sel_comp = (long long)(total_pairs + 0.5);
    long long sel_writes = (long long)(2 * (n - 1));

    // Bubble with early exit: passes = min(p + 1, n - 1)
    long long bubble_passes = (long long)p + 1;
    if (bubble_passes > n - 1) bubble_passes = n - 1;
    long long bubble_comp = 0;
    for (long long pass = 0; pass < bubble_passes; pass++) {
        bubble_comp += (n - 1 - pass);
    }
    long long bubble_writes = 2 * out->inversions;

    // Insertion
    long long ins_comp = (long long)(I + (n - 1) + 0.5);
    long long ins_writes = (long long)(I + (n - 1) + 0.5);

    // Merge: comp between (n/2)*log2n and n*log2n - 1.25n, writes ~ n*log2n
    double merge_best = (n / 2.0) * log2n;
    double merge_avg = n * log2n - 1.25 * n;
    if (merge_avg < merge_best) merge_avg = merge_best;
    double merge_comp_f = (1.0 - m) * merge_best + m * merge_avg;
    long long merge_comp = (long long)(merge_comp_f + 0.5);
    long long merge_writes = (long long)(n * ceil(log2n) + 0.5); // merge tree levels

    // Quick Lomuto (last element pivot):
    // comp degrades to n(n-1)/2 on sorted (r=0), reversed (r=1), or duplicates (high d)
    double quick_best_avg = 1.39 * n * log2n;
    double quick_worst = total_pairs;
    // Effective mixing drops if sorted/reversed or heavy duplicates
    double quick_mix = m * (1.0 - d);
    if (quick_mix < 0.0) quick_mix = 0.0;
    double quick_comp_f = quick_mix * quick_best_avg + (1.0 - quick_mix) * quick_worst;
    long long quick_comp = (long long)(quick_comp_f + 0.5);
    long long quick_writes = (long long)(quick_mix * (0.6 * n * log2n) + (1.0 - quick_mix) * (2 * n) + 0.5);

    // Populate estimates according to judge_by
    if (judge_by == JUDGE_COMPARISONS) {
        out->estimates[ALGO_BUBBLE] = bubble_comp;
        out->estimates[ALGO_SELECTION] = sel_comp;
        out->estimates[ALGO_INSERTION] = ins_comp;
        out->estimates[ALGO_QUICK] = quick_comp;
        out->estimates[ALGO_MERGE] = merge_comp;
    } else if (judge_by == JUDGE_WRITES) {
        out->estimates[ALGO_BUBBLE] = bubble_writes;
        out->estimates[ALGO_SELECTION] = sel_writes;
        out->estimates[ALGO_INSERTION] = ins_writes;
        out->estimates[ALGO_QUICK] = quick_writes;
        out->estimates[ALGO_MERGE] = merge_writes;
    } else { // JUDGE_TOTAL
        out->estimates[ALGO_BUBBLE] = bubble_comp + bubble_writes;
        out->estimates[ALGO_SELECTION] = sel_comp + sel_writes;
        out->estimates[ALGO_INSERTION] = ins_comp + ins_writes;
        out->estimates[ALGO_QUICK] = quick_comp + quick_writes;
        out->estimates[ALGO_MERGE] = merge_comp + merge_writes;
    }

    // Pick predicted cheapest algorithm
    int best_algo = 0;
    long long min_est = out->estimates[0];
    for (int i = 1; i < ALGO_COUNT; i++) {
        if (out->estimates[i] < min_est) {
            min_est = out->estimates[i];
            best_algo = i;
        }
    }
    out->predicted_algo = best_algo;

    // Build plain-English reason sentence
    const char *metric_name = (judge_by == JUDGE_COMPARISONS) ? "comparisons" :
                              (judge_by == JUDGE_WRITES) ? "writes" : "total ops";
    if (best_algo == ALGO_INSERTION) {
        snprintf(out->reason, sizeof(out->reason),
                 "Insertion: only %lld inversions, so it needs about %lld %s.",
                 out->inversions, min_est, metric_name);
    } else if (best_algo == ALGO_MERGE) {
        snprintf(out->reason, sizeof(out->reason),
                 "Merge: balanced O(n log n) division handles this shape in about %lld %s.",
                 min_est, metric_name);
    } else if (best_algo == ALGO_QUICK) {
        snprintf(out->reason, sizeof(out->reason),
                 "Quick: well-mixed distribution (inversion ratio %.2f) yields fast partitioning with about %lld %s.",
                 r, min_est, metric_name);
    } else if (best_algo == ALGO_BUBBLE) {
        snprintf(out->reason, sizeof(out->reason),
                 "Bubble: max displacement is only %d, so early-exit stops in %lld %s.",
                 out->max_left_greater, min_est, metric_name);
    } else {
        snprintf(out->reason, sizeof(out->reason),
                 "Selection: constant comparison scan predicted to do %lld %s.",
                 min_est, metric_name);
    }
}
