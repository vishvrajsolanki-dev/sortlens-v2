# Search Laboratory Documentation

## 1. Overview and Syllabus Mapping

The Search Laboratory provides a comparative, step-by-step interactive analysis of **Linear Search** ($O(n)$) and **Binary Search** ($O(\log n)$). It is strictly mapped to Course 102040304 Data Structures (Unit 6: Searching Algorithms).

All search executions, step records, range windows (`[low, high]`), and comparison counters are computed authoritatively by the C99 core compiled to WebAssembly (`core/search.c`, `core/api.c`).

---

## 2. C Core Search Contract

### 2.1 Function Signatures
```c
// Linear search on array. Records every index visited.
int linear_search(const int arr[], int n, int target, int *comparisons,
                  SearchStep steps[], int max_steps, int *num_steps);

// Binary search on sorted array. Records mid index and low/high window.
int binary_search(const int arr[], int n, int target, int *comparisons,
                  SearchStep steps[], int max_steps, int *num_steps);
```

### 2.2 Preconditions & Array Synchronization
* **Binary Search Precondition:** Binary Search requires the array to be sorted ascending.
* **C Memory Buffer:** When `client.prepareSearch(arr)` is called:
  1. The C core runs Merge Sort (`sl_run(ALGO_MERGE, n, 0)`).
  2. The sorted output is copied into `g_sorted_array`.
  3. `sl_search(kind, target, n)` executes `linear_search` (kind 0) or `binary_search` (kind 1) against `g_sorted_array`.
* **Zero Index Desynchronization:**
  - The UI explicitly displays the **Sorted Search Buffer (C Memory)**.
  - The displayed cells $0, 1, \dots, n-1$ strictly correspond to the probed memory indices (`step.index`) and window bounds `[step.low, step.high]`.
  - Linear Search and Binary Search operate on the identical sorted buffer, allowing students to observe the exact difference in probe count without artificial cell mismatches.

### 2.3 SearchStep Structure
```c
typedef struct {
    int index; // Currently probed array index
    int low;   // Active lower boundary of search window
    int high;  // Active upper boundary of search window
} SearchStep;
```

---

## 3. Algorithm Behavior and Counting Rules

### 3.1 Linear Search (Sequential Scan)
* **Inspection Rule:** Probes indices sequentially from $i = 0$ to $n - 1$.
* **Step Recording:** At index $i$, sets `low = 0`, `high = n - 1`, `index = i`.
* **Comparisons:** Increments `*comparisons` for every probed element.
* **Found Index:** Returns the first index $i$ where `arr[i] == target`.
* **Absent Target:** Returns `-1` after inspecting all $n$ elements ($n$ comparisons).
* **Asymptotic Work:** Best case $O(1)$, Average case $O(n/2)$, Worst case $O(n)$.

### 3.2 Binary Search (Divide and Conquer)
* **Inspection Rule:** Computes midpoint `mid = low + (high - low) / 2`.
* **Step Recording:** Records `index = mid`, `low = low`, `high = high`.
* **Comparisons:** Increments `*comparisons` once per iteration.
* **Window Discarding:**
  - If `arr[mid] == target`, returns `mid`.
  - If `arr[mid] < target`, sets `low = mid + 1` (discards left half).
  - If `arr[mid] > target`, sets `high = mid - 1` (discards right half).
* **Absent Target:** Returns `-1` when `low > high`.
* **Asymptotic Work:** Best case $O(1)$, Worst case $\lceil \log_2(n + 1) \rceil \approx O(\log n)$.

---

## 4. Playback Controls & Deterministic Navigation

The search laboratory includes a dedicated `SearchStepPlayer` state machine:
* **Play / Pause:** Advances step-by-step at user-selected speeds ($0.75\times, 1.5\times, 3\times, 6\times$).
* **Step Forward / Backward:** Bidirectional single-step comparison navigation.
* **Timeline Scrubber:** Arbitrary timeline seek to any step index.
* **Restart:** Resets to step 0.
* **Target Picker:** Direct numeric input $V \in [1, 99]$, Quick Target presets (First, Mid, Last, Absent), or direct cell clicks.
