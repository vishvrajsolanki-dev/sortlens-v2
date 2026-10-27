// api.c - Global state and exported functions for WebAssembly and native harness
// Pure integer/primitive boundary matching the student spec.
#include <string.h>
#include "sortlens.h"

// Global state holding current inputs and run results
static int g_input_array[MAX_ARRAY_SIZE];
static int g_current_n = 0;
static ShapeAnalysis g_analysis;
static HashTable g_analysis_ht;

// Sort runs state
static int g_run_results[ALGO_COUNT][MAX_ARRAY_SIZE];
static Counts g_counts[ALGO_COUNT];
static TraceQueue g_queues[ALGO_COUNT];
static CallStack g_stacks[ALGO_COUNT];

// Search lab state
static int g_sorted_array[MAX_ARRAY_SIZE];
static SearchStep g_search_steps[MAX_ARRAY_SIZE];
static int g_search_num_steps = 0;
static int g_search_comparisons = 0;

// Set array element i to value v
void sl_set_value(int i, int v) {
    if (i >= 0 && i < MAX_ARRAY_SIZE) {
        g_input_array[i] = v;
    }
}

// Analyze current array of size n with given judge_by metric
void sl_analyze(int n, int judge_by) {
    if (n < 0) n = 0;
    if (n > MAX_ARRAY_SIZE) n = MAX_ARRAY_SIZE;
    g_current_n = n;

    // Retain hash table instance for inspection
    ht_free(&g_analysis_ht);
    ht_init(&g_analysis_ht);
    for (int i = 0; i < n; i++) {
        ht_insert(&g_analysis_ht, g_input_array[i]);
    }

    analyze_shape(g_input_array, n, judge_by, &g_analysis);
}

long long sl_inversions(void) {
    return g_analysis.inversions;
}

int sl_inversion_ratio_x1000(void) {
    return (int)(g_analysis.inversion_ratio * 1000.0 + 0.5);
}

int sl_dup_ratio_x1000(void) {
    return (int)(g_analysis.dup_ratio * 1000.0 + 0.5);
}

int sl_distinct(void) {
    return g_analysis.distinct;
}

int sl_collisions(void) {
    return g_analysis.collisions;
}

int sl_max_left_greater(void) {
    return g_analysis.max_left_greater;
}

int sl_hash_size(void) {
    return HASH_TABLE_SIZE;
}

int sl_hash_chain_length(int b) {
    return ht_chain_length(&g_analysis_ht, b);
}

int sl_hash_chain_value(int b, int k) {
    return ht_chain_value(&g_analysis_ht, b, k);
}

long long sl_estimate(int algo) {
    if (algo >= 0 && algo < ALGO_COUNT) {
        return g_analysis.estimates[algo];
    }
    return 0;
}

int sl_predicted(void) {
    return g_analysis.predicted_algo;
}

const char* sl_reason(void) {
    return g_analysis.reason;
}

// Execute sorting algorithm 'algo' on array of size n
void sl_run(int algo, int n, int record) {
    if (algo < 0 || algo >= ALGO_COUNT) return;
    if (n < 0) n = 0;
    if (n > MAX_ARRAY_SIZE) n = MAX_ARRAY_SIZE;

    // Copy original input array
    for (int i = 0; i < n; i++) {
        g_run_results[algo][i] = g_input_array[i];
    }

    trace_init(&g_queues[algo], record);

    switch (algo) {
        case ALGO_BUBBLE:
            sort_bubble(g_run_results[algo], n, &g_counts[algo], &g_queues[algo]);
            break;
        case ALGO_SELECTION:
            sort_selection(g_run_results[algo], n, &g_counts[algo], &g_queues[algo]);
            break;
        case ALGO_INSERTION:
            sort_insertion(g_run_results[algo], n, &g_counts[algo], &g_queues[algo]);
            break;
        case ALGO_QUICK:
            sort_quick(g_run_results[algo], n, &g_counts[algo], &g_queues[algo], &g_stacks[algo]);
            break;
        case ALGO_MERGE:
            sort_merge(g_run_results[algo], n, &g_counts[algo], &g_queues[algo], &g_stacks[algo]);
            break;
    }
}

long long sl_comparisons(int algo) {
    if (algo >= 0 && algo < ALGO_COUNT) return g_counts[algo].comparisons;
    return 0;
}

long long sl_writes(int algo) {
    if (algo >= 0 && algo < ALGO_COUNT) return g_counts[algo].writes;
    return 0;
}

int sl_max_depth(int algo) {
    if (algo >= 0 && algo < ALGO_COUNT) return g_counts[algo].max_depth;
    return 0;
}

int sl_event_count(int algo) {
    if (algo >= 0 && algo < ALGO_COUNT) return g_queues[algo].count;
    return 0;
}

int sl_event_type(int algo, int k) {
    if (algo >= 0 && algo < ALGO_COUNT && k >= 0 && k < g_queues[algo].count) {
        return g_queues[algo].events[k].type;
    }
    return 0;
}

int sl_event_a(int algo, int k) {
    if (algo >= 0 && algo < ALGO_COUNT && k >= 0 && k < g_queues[algo].count) {
        return g_queues[algo].events[k].a;
    }
    return 0;
}

int sl_event_b(int algo, int k) {
    if (algo >= 0 && algo < ALGO_COUNT && k >= 0 && k < g_queues[algo].count) {
        return g_queues[algo].events[k].b;
    }
    return 0;
}

int sl_event_c(int algo, int k) {
    if (algo >= 0 && algo < ALGO_COUNT && k >= 0 && k < g_queues[algo].count) {
        return g_queues[algo].events[k].c;
    }
    return 0;
}

int sl_event_d(int algo, int k) {
    if (algo >= 0 && algo < ALGO_COUNT && k >= 0 && k < g_queues[algo].count) {
        return g_queues[algo].events[k].d;
    }
    return 0;
}

int sl_overflow(int algo) {
    if (algo >= 0 && algo < ALGO_COUNT) return g_queues[algo].overflow;
    return 0;
}

int sl_result_value(int algo, int i) {
    if (algo >= 0 && algo < ALGO_COUNT && i >= 0 && i < MAX_ARRAY_SIZE) {
        return g_run_results[algo][i];
    }
    return 0;
}

// Copy sorted output of merge sort for Search Lab
void sl_make_sorted(int n) {
    sl_run(ALGO_MERGE, n, 0);
    for (int i = 0; i < n; i++) {
        g_sorted_array[i] = g_run_results[ALGO_MERGE][i];
    }
}

// Search kind: 0 = Linear, 1 = Binary
int sl_search(int kind, int target, int n) {
    if (kind == 0) {
        return linear_search(g_sorted_array, n, target, &g_search_comparisons,
                             g_search_steps, MAX_ARRAY_SIZE, &g_search_num_steps);
    } else {
        return binary_search(g_sorted_array, n, target, &g_search_comparisons,
                             g_search_steps, MAX_ARRAY_SIZE, &g_search_num_steps);
    }
}

int sl_search_comparisons(void) {
    return g_search_comparisons;
}

int sl_search_steps_count(void) {
    return g_search_num_steps;
}

int sl_search_step_index(int k) {
    if (k >= 0 && k < g_search_num_steps) return g_search_steps[k].index;
    return -1;
}

int sl_search_step_low(int k) {
    if (k >= 0 && k < g_search_num_steps) return g_search_steps[k].low;
    return -1;
}

int sl_search_step_high(int k) {
    if (k >= 0 && k < g_search_num_steps) return g_search_steps[k].high;
    return -1;
}
