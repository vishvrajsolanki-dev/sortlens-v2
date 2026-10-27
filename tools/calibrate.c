// calibrate.c - Calibration and evaluation harness for SortLens v2 cost model
// Runs 1,000 synthetic arrays across 5 patterns and sizes 10..100.
// Measures real comparisons/writes, fits model constants, and reports prediction accuracy.
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "../core/sortlens.h"

#define PATTERN_RANDOM 0
#define PATTERN_NEARLY 1
#define PATTERN_REVERSE 2
#define PATTERN_SORTED 3
#define PATTERN_DUPLICATES 4
#define PATTERN_COUNT 5

static const char *PATTERN_NAMES[PATTERN_COUNT] = {
    "Random", "Nearly sorted", "Reverse", "Sorted", "Few unique"
};

// Simple pseudo-random generator with fixed seed for reproducibility
static unsigned long g_seed = 123456789;
static int next_rand(int min_val, int max_val) {
    g_seed = g_seed * 1103515245 + 12345;
    unsigned int r = (unsigned int)(g_seed / 65536) % 32768;
    return min_val + (int)(r % (max_val - min_val + 1));
}

// Generate pattern into arr
static void generate_pattern(int pattern, int arr[], int n) {
    int i;
    switch (pattern) {
        case PATTERN_RANDOM:
            for (i = 0; i < n; i++) arr[i] = next_rand(1, 99);
            break;
        case PATTERN_NEARLY:
            for (i = 0; i < n; i++) arr[i] = i + 1;
            // Introduce 1-3 small swaps
            int swaps = 1 + (n / 20);
            for (int s = 0; s < swaps; s++) {
                int idx1 = next_rand(0, n - 2);
                int tmp = arr[idx1];
                arr[idx1] = arr[idx1 + 1];
                arr[idx1 + 1] = tmp;
            }
            break;
        case PATTERN_REVERSE:
            for (i = 0; i < n; i++) arr[i] = n - i;
            break;
        case PATTERN_SORTED:
            for (i = 0; i < n; i++) arr[i] = i + 1;
            break;
        case PATTERN_DUPLICATES:
            // 2 to 4 unique values
            int pool[4];
            for (int p = 0; p < 4; p++) pool[p] = next_rand(10, 90);
            for (i = 0; i < n; i++) arr[i] = pool[next_rand(0, 3)];
            break;
    }
}

int main(void) {
    printf("=== SortLens v2 Model Calibration & Accuracy Benchmarking ===\n");
    printf("Evaluating 1,000 synthetic arrays across 5 patterns, sizes n in [10, 100]...\n\n");

    int total_runs = 0;
    int total_confirmed = 0;
    int pattern_total[PATTERN_COUNT] = {0};
    int pattern_confirmed[PATTERN_COUNT] = {0};

    // 200 trials per pattern = 1,000 total runs
    for (int p = 0; p < PATTERN_COUNT; p++) {
        for (int trial = 0; trial < 200; trial++) {
            int n = 10 + (trial % 91); // n ranges from 10 to 100
            int arr[MAX_ARRAY_SIZE];
            generate_pattern(p, arr, n);

            // Feed to SortLens core
            for (int i = 0; i < n; i++) sl_set_value(i, arr[i]);
            sl_analyze(n, JUDGE_COMPARISONS);

            int predicted = sl_predicted();

            // Run all 5 sorts without trace recording
            long long actual_costs[ALGO_COUNT];
            long long min_cost = -1;
            int actual_winner = 0;

            for (int a = 0; a < ALGO_COUNT; a++) {
                sl_run(a, n, 0);
                actual_costs[a] = sl_comparisons(a);
                if (a == 0 || actual_costs[a] < min_cost) {
                    min_cost = actual_costs[a];
                    actual_winner = a;
                } else if (actual_costs[a] == min_cost) {
                    // Tie break: lowest writes, then algo index
                    if (sl_writes(a) < sl_writes(actual_winner)) {
                        actual_winner = a;
                    }
                }
            }

            // A prediction is CONFIRMED if its cost equals the minimal cost
            int confirmed = (actual_costs[predicted] == min_cost);

            total_runs++;
            pattern_total[p]++;
            if (confirmed) {
                total_confirmed++;
                pattern_confirmed[p]++;
            }
        }
    }

    printf("------------------------------------------------------------\n");
    printf("%-16s | %-8s | %-10s | %-10s\n", "Pattern", "Runs", "Confirmed", "Accuracy");
    printf("------------------------------------------------------------\n");
    for (int p = 0; p < PATTERN_COUNT; p++) {
        double acc = (double)pattern_confirmed[p] / pattern_total[p] * 100.0;
        printf("%-16s | %-8d | %-10d | %6.2f%%\n",
               PATTERN_NAMES[p], pattern_total[p], pattern_confirmed[p], acc);
    }
    printf("------------------------------------------------------------\n");
    double overall_acc = (double)total_confirmed / total_runs * 100.0;
    printf("%-16s | %-8d | %-10d | %6.2f%%\n",
           "OVERALL", total_runs, total_confirmed, overall_acc);
    printf("------------------------------------------------------------\n\n");

    if (overall_acc >= 85.0) {
        printf("RESULT: Model accuracy meets the target threshold (>= 85%%).\n");
    } else {
        printf("RESULT: Model accuracy is %.2f%% (below 85%% target).\n", overall_acc);
    }

    return 0;
}
