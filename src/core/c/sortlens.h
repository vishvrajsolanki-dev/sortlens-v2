// sortlens.h - Core header for SortLens v2
// Course 102040304 Data Structures syllabus compliant.
#ifndef SORTLENS_H
#define SORTLENS_H

#define MAX_ARRAY_SIZE 100
#define MAX_EVENTS 30000

// Event types for the trace queue
#define EV_COMPARE 1
#define EV_SWAP    2
#define EV_WRITE   3
#define EV_PIVOT   4
#define EV_RANGE   5
#define EV_PUSH    6
#define EV_POP     7
#define EV_DONE    8

// Algorithm IDs
#define ALGO_BUBBLE    0
#define ALGO_SELECTION 1
#define ALGO_INSERTION 2
#define ALGO_QUICK     3
#define ALGO_MERGE     4
#define ALGO_COUNT     5

// Judge-by metric IDs
#define JUDGE_COMPARISONS 0
#define JUDGE_WRITES      1
#define JUDGE_TOTAL       2

// Operation counters
typedef struct {
    long long comparisons;
    long long writes;
    int max_depth;
} Counts;

// Trace event representation (5 integers)
typedef struct {
    int type;
    int a;
    int b;
    int c;
    int d;
} TraceEvent;

// Trace queue (array-based queue, Practical 5)
typedef struct {
    TraceEvent events[MAX_EVENTS];
    int front;
    int rear;
    int count;
    int overflow;
    int recording;
} TraceQueue;

// Array-based stack for recursion depth (Practical 3)
typedef struct {
    int data[MAX_ARRAY_SIZE * 2];
    int top;
    int max_depth;
} CallStack;

// Hash table node for duplicate detection (Unit 6 / Practical 10)
typedef struct HashNode {
    int value;
    struct HashNode *next;
} HashNode;

// Hash table structure with separate chaining
#define HASH_TABLE_SIZE 11
typedef struct {
    HashNode *buckets[HASH_TABLE_SIZE];
    int distinct_count;
    int collision_count;
} HashTable;

// Shape analysis result
typedef struct {
    long long inversions;
    double inversion_ratio;
    int max_left_greater;
    int distinct;
    int collisions;
    double dup_ratio;
    long long estimates[ALGO_COUNT];
    int predicted_algo;
    char reason[160];
} ShapeAnalysis;

// Search step representation
typedef struct {
    int index;
    int low;
    int high;
} SearchStep;

// --- Function Declarations ---

// Trace management (trace.c)
void trace_init(TraceQueue *q, int recording);
void trace_add(TraceQueue *q, int type, int a, int b, int c, int d);

// Stack operations (stack.c)
void stack_init(CallStack *s);
void stack_push(CallStack *s, int low, int high);
void stack_pop(CallStack *s);
int stack_depth(CallStack *s);

// Hash table operations (hashtable.c)
void ht_init(HashTable *ht);
int ht_insert(HashTable *ht, int val);
int ht_chain_length(const HashTable *ht, int bucket);
int ht_chain_value(const HashTable *ht, int bucket, int k);
void ht_free(HashTable *ht);

// Sorting algorithms (sorts.c)
void sort_bubble(int arr[], int n, Counts *c, TraceQueue *q);
void sort_selection(int arr[], int n, Counts *c, TraceQueue *q);
void sort_insertion(int arr[], int n, Counts *c, TraceQueue *q);
void sort_quick(int arr[], int n, Counts *c, TraceQueue *q, CallStack *s);
void sort_merge(int arr[], int n, Counts *c, TraceQueue *q, CallStack *s);

// Shape analyzer and Cost model (analyzer.c)
long long count_inversions(const int arr[], int n);
int compute_max_left_greater(const int arr[], int n);
void analyze_shape(const int arr[], int n, int judge_by, ShapeAnalysis *out);

// Search routines (search.c)
int linear_search(const int arr[], int n, int target, int *comparisons, SearchStep steps[], int max_steps, int *num_steps);
int binary_search(const int arr[], int n, int target, int *comparisons, SearchStep steps[], int max_steps, int *num_steps);

// WebAssembly / Public C API (api.c)
void sl_set_value(int i, int v);
void sl_analyze(int n, int judge_by);
long long sl_inversions(void);
int sl_inversion_ratio_x1000(void);
int sl_dup_ratio_x1000(void);
int sl_distinct(void);
int sl_collisions(void);
int sl_max_left_greater(void);
int sl_hash_size(void);
int sl_hash_chain_length(int b);
int sl_hash_chain_value(int b, int k);
long long sl_estimate(int algo);
int sl_predicted(void);
const char* sl_reason(void);

void sl_run(int algo, int n, int record);
long long sl_comparisons(int algo);
long long sl_writes(int algo);
int sl_max_depth(int algo);
int sl_event_count(int algo);
int sl_event_type(int algo, int k);
int sl_event_a(int algo, int k);
int sl_event_b(int algo, int k);
int sl_event_c(int algo, int k);
int sl_event_d(int algo, int k);
int sl_overflow(int algo);
int sl_result_value(int algo, int i);

void sl_make_sorted(int n);
int sl_search(int kind, int target, int n);
int sl_search_comparisons(void);
int sl_search_steps_count(void);
int sl_search_step_index(int k);
int sl_search_step_low(int k);
int sl_search_step_high(int k);

#endif // SORTLENS_H
