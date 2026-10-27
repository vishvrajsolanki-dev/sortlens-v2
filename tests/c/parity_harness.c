// parity_harness.c - Native C reference harness for SortLens WASM parity verification
// Executes a deterministic test corpus and emits machine-readable JSON.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../../src/core/c/sortlens.h"

typedef struct {
    const char *name;
    int n;
    int data[MAX_ARRAY_SIZE];
    int search_target_present;
    int search_target_absent;
} TestCase;

// Deterministic Pseudo-Random Generator with fixed seed
static unsigned long g_seed = 987654321;
static int prng(int min_val, int max_val) {
    g_seed = g_seed * 1103515245 + 12345;
    unsigned int r = (unsigned int)(g_seed / 65536) % 32768;
    return min_val + (int)(r % (max_val - min_val + 1));
}

int main(int argc, char **argv) {
    FILE *out = stdout;
    if (argc > 1) {
        out = fopen(argv[1], "wb");
        if (!out) {
            fprintf(stderr, "Failed to open output file %s\n", argv[1]);
            return 1;
        }
    }

    // 1. Build deterministic test corpus
    TestCase cases[8];

    // Case 0: Random Small (n=10)
    cases[0].name = "random_small";
    cases[0].n = 10;
    int d0[10] = {10, 3, 18, 5, 12, 1, 15, 7, 20, 2};
    memcpy(cases[0].data, d0, sizeof(d0));
    cases[0].search_target_present = 12;
    cases[0].search_target_absent = 99;

    // Case 1: Already Sorted (n=10)
    cases[1].name = "already_sorted";
    cases[1].n = 10;
    for (int i = 0; i < 10; i++) cases[1].data[i] = (i + 1) * 3;
    cases[1].search_target_present = 15;
    cases[1].search_target_absent = 16;

    // Case 2: Strictly Reversed (n=10)
    cases[2].name = "strictly_reversed";
    cases[2].n = 10;
    for (int i = 0; i < 10; i++) cases[2].data[i] = 10 - i;
    cases[2].search_target_present = 7;
    cases[2].search_target_absent = 42;

    // Case 3: Duplicates Heavy (n=14)
    cases[3].name = "duplicates_heavy";
    cases[3].n = 14;
    int d3[14] = {5, 2, 5, 1, 9, 2, 5, 9, 1, 5, 2, 9, 5, 1};
    memcpy(cases[3].data, d3, sizeof(d3));
    cases[3].search_target_present = 9;
    cases[3].search_target_absent = 4;

    // Case 4: Min Size Boundary (n=2)
    cases[4].name = "min_size_two";
    cases[4].n = 2;
    cases[4].data[0] = 88;
    cases[4].data[1] = 13;
    cases[4].search_target_present = 88;
    cases[4].search_target_absent = 50;

    // Case 5: All Elements Identical (n=8)
    cases[5].name = "all_identical";
    cases[5].n = 8;
    for (int i = 0; i < 8; i++) cases[5].data[i] = 42;
    cases[5].search_target_present = 42;
    cases[5].search_target_absent = 10;

    // Case 6: Nearly Sorted (n=12)
    cases[6].name = "nearly_sorted";
    cases[6].n = 12;
    for (int i = 0; i < 12; i++) cases[6].data[i] = i + 1;
    cases[6].data[3] = 5; cases[6].data[4] = 4;
    cases[6].data[8] = 10; cases[6].data[9] = 9;
    cases[6].search_target_present = 10;
    cases[6].search_target_absent = 100;

    // Case 7: Deterministic PRNG Array (n=50)
    cases[7].name = "prng_large_50";
    cases[7].n = 50;
    for (int i = 0; i < 50; i++) {
        cases[7].data[i] = prng(1, 99);
    }
    cases[7].search_target_present = cases[7].data[25];
    cases[7].search_target_absent = 101;

    int total_cases = 8;

    // 2. Output JSON
    fprintf(out, "{\n  \"cases\": [\n");

    for (int tc = 0; tc < total_cases; tc++) {
        int n = cases[tc].n;

        // Set inputs into C core
        for (int i = 0; i < n; i++) {
            sl_set_value(i, cases[tc].data[i]);
        }

        // Run Shape Analysis
        sl_analyze(n, JUDGE_COMPARISONS);

        fprintf(out, "    {\n");
        fprintf(out, "      \"name\": \"%s\",\n", cases[tc].name);
        fprintf(out, "      \"n\": %d,\n", n);

        // Input array
        fprintf(out, "      \"input\": [");
        for (int i = 0; i < n; i++) {
            fprintf(out, "%d%s", cases[tc].data[i], (i == n - 1) ? "" : ", ");
        }
        fprintf(out, "],\n");

        // Analysis object
        fprintf(out, "      \"analysis\": {\n");
        fprintf(out, "        \"inversions\": %lld,\n", sl_inversions());
        fprintf(out, "        \"inversionRatio\": %.3f,\n", (double)sl_inversion_ratio_x1000() / 1000.0);
        fprintf(out, "        \"duplicateRatio\": %.3f,\n", (double)sl_dup_ratio_x1000() / 1000.0);
        fprintf(out, "        \"distinct\": %d,\n", sl_distinct());
        fprintf(out, "        \"collisions\": %d,\n", sl_collisions());
        fprintf(out, "        \"maxLeftGreater\": %d,\n", sl_max_left_greater());
        fprintf(out, "        \"predicted\": %d,\n", sl_predicted());
        fprintf(out, "        \"reason\": \"%s\",\n", sl_reason());
        fprintf(out, "        \"estimates\": [%lld, %lld, %lld, %lld, %lld]\n",
               sl_estimate(0), sl_estimate(1), sl_estimate(2), sl_estimate(3), sl_estimate(4));
        fprintf(out, "      },\n");

        // Runs for all 5 algorithms
        fprintf(out, "      \"runs\": [\n");
        for (int algo = 0; algo < ALGO_COUNT; algo++) {
            sl_run(algo, n, 1); // with trace recording

            fprintf(out, "        {\n");
            fprintf(out, "          \"algo\": %d,\n", algo);
            fprintf(out, "          \"comparisons\": %lld,\n", sl_comparisons(algo));
            fprintf(out, "          \"writes\": %lld,\n", sl_writes(algo));
            fprintf(out, "          \"maxDepth\": %d,\n", sl_max_depth(algo));
            fprintf(out, "          \"overflow\": %d,\n", sl_overflow(algo));
            fprintf(out, "          \"eventCount\": %d,\n", sl_event_count(algo));
            fprintf(out, "          \"sorted\": [");
            for (int i = 0; i < n; i++) {
                fprintf(out, "%d%s", sl_result_value(algo, i), (i == n - 1) ? "" : ", ");
            }
            fprintf(out, "]\n");
            fprintf(out, "        }%s\n", (algo == ALGO_COUNT - 1) ? "" : ",");
        }
        fprintf(out, "      ],\n");

        // Search Lab verification
        sl_make_sorted(n);
        int idx_pres_lin = sl_search(0, cases[tc].search_target_present, n);
        int comp_pres_lin = sl_search_comparisons();
        int steps_pres_lin = sl_search_steps_count();

        int idx_abs_lin = sl_search(0, cases[tc].search_target_absent, n);
        int comp_abs_lin = sl_search_comparisons();
        int steps_abs_lin = sl_search_steps_count();

        int idx_pres_bin = sl_search(1, cases[tc].search_target_present, n);
        int comp_pres_bin = sl_search_comparisons();
        int steps_pres_bin = sl_search_steps_count();

        int idx_abs_bin = sl_search(1, cases[tc].search_target_absent, n);
        int comp_abs_bin = sl_search_comparisons();
        int steps_abs_bin = sl_search_steps_count();

        fprintf(out, "      \"search\": {\n");
        fprintf(out, "        \"targetPresent\": %d,\n", cases[tc].search_target_present);
        fprintf(out, "        \"targetAbsent\": %d,\n", cases[tc].search_target_absent);
        fprintf(out, "        \"linear\": {\n");
        fprintf(out, "          \"present\": {\"index\": %d, \"comparisons\": %d, \"steps\": %d},\n",
               idx_pres_lin, comp_pres_lin, steps_pres_lin);
        fprintf(out, "          \"absent\": {\"index\": %d, \"comparisons\": %d, \"steps\": %d}\n",
               idx_abs_lin, comp_abs_lin, steps_abs_lin);
        fprintf(out, "        },\n");
        fprintf(out, "        \"binary\": {\n");
        fprintf(out, "          \"present\": {\"index\": %d, \"comparisons\": %d, \"steps\": %d},\n",
               idx_pres_bin, comp_pres_bin, steps_pres_bin);
        fprintf(out, "          \"absent\": {\"index\": %d, \"comparisons\": %d, \"steps\": %d}\n",
               idx_abs_bin, comp_abs_bin, steps_abs_bin);
        fprintf(out, "        }\n");
        fprintf(out, "      }\n");

        fprintf(out, "    }%s\n", (tc == total_cases - 1) ? "" : ",");
    }

    fprintf(out, "  ]\n}\n");

    if (out != stdout) {
        fclose(out);
    }
    return 0;
}
