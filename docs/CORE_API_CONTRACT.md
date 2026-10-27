# Core API Contract: SortLens C99 & WebAssembly Interface

This document specifies the authoritative contract between the C99 algorithmic engine (`src/core/c/`) and the TypeScript frontend adapter (`src/core/adapter/`).

---

## 1. Architectural Principles

1. **Single Source of Algorithmic Truth:** The C99 codebase is the sole authority for all sorting logic, comparison and write counts, shape analyses, duplicate detections, and search step traces. The frontend never computes or simulates sorting mechanics independently.
2. **Encapsulated WebAssembly Boundary:** Application components and state stores must never invoke low-level Emscripten exports directly (`Module._sl_*`). All interactions must pass through the typed, promise-guarded `CoreClient` adapter.
3. **Immutability & Memory Safety:** WebAssembly linear memory (`HEAP8`, `HEAPU8`) is transient. Primitive values and strings are cloned out of WebAssembly memory into native TypeScript objects at the adapter boundary.
4. **Pure Integer Interop:** In accordance with the student specification, all core APIs use pure integer, BigInt, and primitive parameters without complex struct serialization across the boundary.

---

## 2. Global State & Lifecycle Semantics

The C core maintains internal static global variables in `api.c`:
* `g_input_array[100]`: Stores array values set via `sl_set_value(i, v)`.
* `g_current_n`: Length of the current input array ($0 \le n \le 100$).
* `g_analysis`: Holds shape metrics, algorithm estimates, predicted winner, and explanation reason.
* `g_analysis_ht`: Separate-chaining hash table (11 buckets) populated during `sl_analyze`.
* `g_run_results[5][100]`: Copies of array sorted by each algorithm.
* `g_counts[5]`: Comparisons, writes, and recursion max depth for each algorithm.
* `g_queues[5]`: Circular trace event queues ($30,000$ events capacity per queue).
* `g_stacks[5]`: Recursion call stacks for Quick and Merge sorts.
* `g_sorted_array[100]`: Auxiliary sorted array prepared by `sl_make_sorted(n)` for Search Lab.
* `g_search_steps[100]`: Recorded search steps during linear or binary search.

### Reset & Idempotence Rules
* Setting values: Invoking `sl_set_value(i, v)` mutates index `i`. Setting a new input requires setting all elements $0 \dots n-1$.
* Analysis: Calling `sl_analyze(n, judge_by)` frees previous hash table allocations (`ht_free(&g_analysis_ht)`) and recomputes all metrics cleanly.
* Algorithm Runs: Calling `sl_run(algo, n, record)` resets `g_counts[algo]`, initializes `g_queues[algo]` (`count = 0, overflow = 0`), and copies `g_input_array` fresh into `g_run_results[algo]`.
* Search Preparation: Calling `sl_make_sorted(n)` re-runs Merge sort without recording and copies the sorted output into `g_sorted_array`.

---

## 3. Function Inventory & TypeScript Mapping

| C Signature | Inputs & Constraints | Return Value | Global State Mutated | TypeScript Adapter Method |
| :--- | :--- | :--- | :--- | :--- |
| `void sl_set_value(int i, int v)` | $0 \le i < 100$, $1 \le v \le 99$ | `void` | `g_input_array[i]` | `setInputArray(arr: number[]): void` |
| `void sl_analyze(int n, int judge_by)` | $0 \le n \le 100$, `judge_by` $\in \{0, 1, 2\}$ | `void` | `g_analysis`, `g_analysis_ht` | `analyze(arr: number[], metric?: JudgeMetric): ShapeAnalysisResult` |
| `long long sl_inversions(void)` | None | `long long` (WASM `bigint`) | None | Included in `analyze()` |
| `int sl_inversion_ratio_x1000(void)` | None | $r \times 1000 + 0.5$ ($0 \dots 1000$) | None | Included in `analyze()` (divided by 1000) |
| `int sl_dup_ratio_x1000(void)` | None | $d \times 1000 + 0.5$ ($0 \dots 1000$) | None | Included in `analyze()` (divided by 1000) |
| `int sl_distinct(void)` | None | Count of unique values | None | Included in `analyze()` |
| `int sl_collisions(void)` | None | Total hash collisions | None | Included in `analyze()` |
| `int sl_max_left_greater(void)` | None | $\max_i (\text{count}(j < i \mid \text{arr}[j] > \text{arr}[i]))$ | None | Included in `analyze()` |
| `int sl_hash_size(void)` | None | Fixed: 11 | None | Included in `getHashTableData()` |
| `int sl_hash_chain_length(int b)` | $0 \le b < 11$ | Number of nodes in bucket $b$ | None | Included in `getHashTableData()` |
| `int sl_hash_chain_value(int b, int k)`| $0 \le b < 11$, $0 \le k < \text{len}$ | Value at node $k$ | None | Included in `getHashTableData()` |
| `long long sl_estimate(int algo)` | $0 \le \text{algo} < 5$ | Predicted cost (comparisons) | None | Included in `analyze()` |
| `int sl_predicted(void)` | None | Algorithm ID ($0 \dots 4$) | None | Included in `analyze()` |
| `const char* sl_reason(void)` | None | Pointer to C-string | None | Included in `analyze()` (read via `ccall`) |
| `void sl_run(int algo, int n, int record)` | $0 \le \text{algo} < 5$, $0 \le n \le 100$, `record` $\in \{0, 1\}$ | `void` | `g_run_results`, `g_counts`, `g_queues`, `g_stacks` | `runSort(algo: AlgorithmId, recordTrace?: boolean): SortRunResult` |
| `long long sl_comparisons(int algo)` | $0 \le \text{algo} < 5$ | Total comparisons | None | Included in `runSort()` |
| `long long sl_writes(int algo)` | $0 \le \text{algo} < 5$ | Total array writes | None | Included in `runSort()` |
| `int sl_max_depth(int algo)` | $0 \le \text{algo} < 5$ | Maximum call stack depth | None | Included in `runSort()` |
| `int sl_event_count(int algo)` | $0 \le \text{algo} < 5$ | Total recorded events | None | Included in `runSort()` |
| `int sl_event_type(int algo, int k)` | $0 \le k < \text{count}$ | Event type ID ($1 \dots 8$) | None | Included in `runSort()` trace events |
| `int sl_event_a(int algo, int k)` | $0 \le k < \text{count}$ | Payload field $a$ | None | Included in `runSort()` trace events |
| `int sl_event_b(int algo, int k)` | $0 \le k < \text{count}$ | Payload field $b$ | None | Included in `runSort()` trace events |
| `int sl_event_c(int algo, int k)` | $0 \le k < \text{count}$ | Payload field $c$ | None | Included in `runSort()` trace events |
| `int sl_event_d(int algo, int k)` | $0 \le k < \text{count}$ | Payload field $d$ | None | Included in `runSort()` trace events |
| `int sl_overflow(int algo)` | $0 \le \text{algo} < 5$ | 1 if $>30000$ events, else 0 | None | Included in `runSort()` |
| `int sl_result_value(int algo, int i)` | $0 \le i < n$ | Sorted element at $i$ | None | Included in `runSort().sortedArray` |
| `void sl_make_sorted(int n)` | $0 \le n \le 100$ | `void` | `g_sorted_array` | `prepareSearch(arr: number[]): number[]` |
| `int sl_search(int kind, int target, int n)` | `kind` $\in \{0, 1\}$, target $\in \mathbb{Z}$ | Index found, or `-1` | `g_search_steps` | `search(kind: SearchKind, target: number): SearchResult` |
| `int sl_search_comparisons(void)` | None | Search comparisons count | None | Included in `search()` |
| `int sl_search_steps_count(void)` | None | Number of search steps | None | Included in `search()` |
| `int sl_search_step_index(int k)` | $0 \le k < \text{steps}$ | Examined index | None | Included in `search().steps` |
| `int sl_search_step_low(int k)` | $0 \le k < \text{steps}$ | Low bound ($0$ for linear) | None | Included in `search().steps` |
| `int sl_search_step_high(int k)` | $0 \le k < \text{steps}$ | High bound ($n-1$ for linear)| None | Included in `search().steps` |

---

## 4. Input Preconditions & Boundary Validation

The TypeScript adapter enforces strict boundary checks before delegating to WebAssembly exports:
1. **Array Length:** Must satisfy $0 \le n \le 100$. Arrays with $n < 2$ are rejected by sorting methods ($n \in [2, 100]$ is the required operational domain).
2. **Element Range:** Integers in $[1, 99]$ (or syllabus range). Floats and non-integers are rejected.
3. **Algorithm ID:** Must be in $\{0, 1, 2, 3, 4\}$ (`ALGO_BUBBLE`, `ALGO_SELECTION`, `ALGO_INSERTION`, `ALGO_QUICK`, `ALGO_MERGE`).
4. **Judge Metric:** Must be in $\{0, 1, 2\}$ (`JUDGE_COMPARISONS`, `JUDGE_WRITES`, `JUDGE_TOTAL`). Defaults to `0` (`JUDGE_COMPARISONS`).
5. **Search Kind:** Must be in $\{0, 1\}$ (`SEARCH_LINEAR`, `SEARCH_BINARY`). For binary search, the input array must be sorted in non-descending order.

---

## 5. Error Taxonomy

The adapter surfaces strongly-typed domain errors:
* `CoreNotInitializedError`: Thrown when calling core methods before `init()` completes.
* `InvalidInputError`: Thrown on invalid array sizes, out-of-range elements, or invalid algorithm IDs.
* `TraceOverflowError`: Thrown or signaled when an algorithm run exceeded the $30,000$ event capacity.
* `CoreRuntimeError`: Thrown if WebAssembly traps or fails an internal precondition.
