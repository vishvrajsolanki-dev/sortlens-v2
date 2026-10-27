# SortLens — Academic Viva Examination Guide

**Academic Subject:** Data Structures & Algorithms (Course 102040304)  
**Project:** SortLens — Empirical Sorting & Searching Algorithm Telemetry Workbench  
**Engineering Stack:** C99, WebAssembly, React 19, TypeScript 7, Vite 8, HTML5 Canvas  
**Authoritative Reference:** CVM University Syllabus & SortLens v2 Technical Specifications

---

## Table of Contents
1. [Section A — Project Overview & Academic Problem Statement](#section-a--project-overview--academic-problem-statement)
2. [Section B — Technology Stack Rationale](#section-b--technology-stack-rationale)
3. [Section C — System Architecture & Data Flow](#section-c--system-architecture--data-flow)
4. [Section D — The Five Sorting Algorithms](#section-d--the-five-sorting-algorithms)
5. [Section E — Data Structures Implemented & Evaluated](#section-e--data-structures-implemented--evaluated)
6. [Section F — Authoritative Operation Counting Rules](#section-f--authoritative-operation-counting-rules)
7. [Section G — Dataset Shape Analysis & Mathematical Metrics](#section-g--dataset-shape-analysis--mathematical-metrics)
8. [Section H — Empirical Cost-Model Prediction & Scoreboard Verdicts](#section-h--empirical-cost-model-prediction--scoreboard-verdicts)
9. [Section I — Interactive Search Laboratory](#section-i--interactive-search-laboratory)
10. [Section J — Empirical Scaling Laboratory](#section-j--empirical-scaling-laboratory)
11. [Section K — Testing Methodology & Mathematical Verification](#section-k--testing-methodology--mathematical-verification)
12. [Section L — Known Limitations & Future Work](#section-l--known-limitations--future-work)
13. [Section M — Comprehensive Viva Q&A (35 Authoritative Questions)](#section-m--comprehensive-viva-qa-35-authoritative-questions)

---

## Section A — Project Overview & Academic Problem Statement

### 1. The Core Academic Problem
Traditional data structures education teaches algorithm analysis primarily through asymptotic Big-$O$ notation:
$$\text{Bubble Sort } O(n^2), \quad \text{Insertion Sort } O(n^2), \quad \text{Merge Sort } O(n \log n), \quad \text{Quick Sort } O(n \log n)$$
While Big-$O$ captures asymptotic scaling as $n \to \infty$, it hides three critical real-world phenomena:
1. **Constant Factor Variations:** Selection Sort performs $\Theta(n^2)$ comparisons but only $\Theta(n)$ writes. Insertion Sort on an almost-sorted array performs $O(n)$ comparisons and writes, vastly outperforming an $O(n \log n)$ Merge Sort.
2. **Structural Sensitivity:** The performance of Lomuto Quick Sort degrades catastrophically from $O(n \log n)$ to $\Theta(n^2)$ when given already sorted or reverse-sorted data, causing recursion depth to scale linearly ($O(n)$) rather than logarithmically ($O(\log n)$).
3. **Black-Box Visualization Pitfalls:** Most visualizers invent transitions, decouple animation counters from algorithmic steps, or rely on slow JavaScript loops that conflate animation timing with algorithmic operations.

### 2. The SortLens Solution
SortLens is an empirical telemetry laboratory. It replaces visual guessing with mathematical instrumentation:
* **Single Authority:** All sorting, counting, duplicate detection, and search operations are compiled directly from C99 into WebAssembly.
* **Deterministic Event Trace:** Visualizations render pre-recorded, bit-identical event traces rather than executing live JavaScript sorting.
* **Structural Predictability:** Before algorithms race, SortLens computes structural metrics (inversions, duplicate ratios, leftward displacement) and utilizes a calibrated closed-form cost model to predict the optimal algorithm.

---

## Section B — Technology Stack Rationale

| Component | Technology | Rationale in SortLens Architecture |
| :--- | :--- | :--- |
| **Algorithmic Core** | **C99 (ISO/IEC 9899:1999)** | Guarantees deterministic pointer arithmetic, precise stack frame tracking, absence of garbage-collection pauses, and strict alignment with core CS curriculum data structures. |
| **Compilation Target** | **WebAssembly (Emscripten)** | Allows the identical, untouched C99 algorithms to execute inside the browser sandbox at near-native execution speeds. |
| **Application Layer** | **React 19 & TypeScript 7** | Delivers component modularity, strict compile-time type safety across the WASM boundary, and responsive state management without runtime crashes. |
| **State Management** | **Zustand 5** | Provides an unopinionated, lightweight store (`appStore.ts`) that isolates high-frequency playback ticks from UI navigation state. |
| **Rendering Graphics** | **HTML5 Canvas 2D API** | Renders 5 concurrent lanes with DPR retina scaling, sub-pixel bar geometry, and zero React DOM re-render overhead. |
| **Testing Harness** | **Vitest + MinGW-w64 GCC** | Verifies dual-runtime parity: tests run both against compiled native C (`test_core.exe`) and against the WASM bundle (`native-parity.test.ts`). |

---

## Section C — System Architecture & Data Flow

```text
[ User / Staged Dataset Input ]
               │
               ▼
   [ C99 / WebAssembly Core ]
   ├── Input Validation: N ∈ [2, 100], values ∈ [1, 99]
   ├── Shape Analyzer: Inversions (I), Inversion Ratio (r), Max Left Greater (p)
   ├── 11-Bucket Hash Table: Modulo Hashing h(k) = k mod 11, Duplicates & Collisions
   ├── Five Algorithm Sorts: Bubble, Selection, Insertion, Quick (Lomuto), Merge
   └── Circular Trace Event Queue: MAX_EVENTS = 30,000 opcodes
               │
               ▼
   [ TypeScript Typed Adapter (CoreClient) ]
   ├── WASM Memory Bridge: BigInt normalization, C-string decoding, error wrapping
   └── Session Extraction: cComparisons, cWrites, cMaxDepth, event queue array
               │
               ▼
   [ Deterministic Playback Engine ]
   ├── Sparse Checkpoint Store (FrameStore): Checkpoints every 50 events (<0.2ms seek)
   ├── Reversible Replay (frameReplay): Pure delta inverse transitions
   └── Decoupled Simulation Clock (PlaybackClock): 1 to 1000 events/second
               │
               ▼
   [ Multi-Lane Race Coordinator (RaceCoordinator) ]
   ├── Synchronized 5-lane step progression & independent lane completion
   └── Reactive Event Bus: Emits atomic snapshots to subscribers
               │
               ▼
   [ Visual Presentation Layer ]
   ├── Canvas 2D Sorting Arena: 5 concurrent lanes, live HUD, active partition highlights
   ├── Shape & Cost Panel: Inversion gauges, hash table chains, closed-form formulas
   ├── Post-Race Scoreboard: Honest tie ranking (T-1, T-2), model pick comparison
   └── Interactive Laboratories: Search Lab (Linear vs Binary), Scaling Lab, Viva Tour
```

---

## Section D — The Five Sorting Algorithms

### 1. Bubble Sort with Early Exit (`src/core/c/sorts.c:26`)
* **Mechanism:** Iteratively compares adjacent pairs $(A[j], A[j+1])$ and swaps out-of-order elements. If a complete pass executes with zero swaps, the algorithm exits immediately.
* **Counting Convention:**
  - Each adjacent check is $1\text{ comparison}$.
  - Swapping two elements counts as $3\text{ writes}$ ($t = A[j]; A[j] = A[j+1]; A[j+1] = t$).
* **Complexity:**
  - Best Case (Already sorted): $\Theta(n)$ comparisons, $0\text{ writes}$.
  - Worst Case (Reverse sorted): $\frac{n(n-1)}{2}$ comparisons, $\frac{3n(n-1)}{2}$ writes.

### 2. Selection Sort (`src/core/c/sorts.c:54`)
* **Mechanism:** Scans the unsorted suffix $[i \dots n-1]$ to locate the global minimum element, then executes exactly one swap placing it into index $i$.
* **Counting Convention:**
  - Compares every element in suffix: always $\frac{n(n-1)}{2}$ comparisons regardless of input.
  - If minimum index $\ne i$, performs $1\text{ swap} = 3\text{ writes}$. Total writes $\le 3(n-1)$.
* **Complexity:**
  - Always $\Theta(n^2)$ comparisons and $\Theta(n)$ writes across all inputs.

### 3. Insertion Sort (`src/core/c/sorts.c:83`)
* **Mechanism:** Maintains sorted prefix $[0 \dots i-1]$. Takes element $A[i]$ as `key` ($1\text{ write}$), shifts elements greater than `key` rightward ($1\text{ write per shift}$), and assigns `key` to the vacated slot ($1\text{ write}$).
* **Counting Convention:**
  - Shifting element $A[j]$ to $A[j+1]$ counts as $1\text{ write}$.
  - Final placement of `key` into slot $A[j+1]$ counts as $1\text{ write}$ per outer loop iteration.
* **Complexity:**
  - Best Case (Already sorted): $n-1\text{ comparisons}$, $n-1\text{ writes}$ (each iteration sets `key` into its own index).
  - Worst Case (Reverse sorted): $\frac{n(n-1)}{2}$ comparisons, $\frac{n(n-1)}{2} + (n-1)$ writes.

### 4. Lomuto Quick Sort (`src/core/c/sorts.c:116`)
* **Mechanism:** Top-down divide-and-conquer. Partitions range $[low \dots high]$ around pivot $P = A[high]$. Scans index $j$ from $low$ to $high-1$. If $A[j] \le P$, increments boundary index $i$ and swaps $A[i]$ with $A[j]$. Finally, swaps $A[i+1]$ with $A[high]$. Recursively sorts $[low \dots i]$ and $[i+2 \dots high]$.
* **Counting Convention:**
  - Pivot comparisons against $P$: $1\text{ comparison}$ per element in range.
  - Swaps: $3\text{ writes}$ each.
  - Call stack: tracks recursion depth in `sl_stack_t`.
* **Complexity:**
  - Average Case: $O(n \log n)$ comparisons and writes; $O(\log n)$ stack depth.
  - Pathological Case (Sorted/Reverse Input): Pivot is always extreme element. Partition yields subproblems of size $0$ and $n-1$. Comparisons degrade to $\frac{n(n-1)}{2}$, stack depth scales linearly to $n-1$.

### 5. Top-down Merge Sort (`src/core/c/sorts.c:158`)
* **Mechanism:** Recursively divides array at $mid = low + \frac{high - low}{2}$. Merges sorted halves using an auxiliary buffer `temp[]` of size $n$, then copies merged values back into $A[low \dots high]$.
* **Counting Convention:**
  - Merge comparisons: $1\text{ comparison}$ between heads of left and right halves.
  - Writing into auxiliary buffer: $1\text{ write}$ per element.
  - Copying back from auxiliary buffer to main array: $1\text{ write}$ per element.
  - Total writes per merge pass: exactly $2(high - low + 1)$ writes.
* **Complexity:**
  - Comparisons: $\Theta(n \log n)$ best, average, and worst.
  - Writes: Exactly $2n \lceil \log_2 n \rceil$ writes across all permutations.
  - Auxiliary Space: $\Theta(n)$ auxiliary array.

---

## Section E — Data Structures Implemented & Evaluated

### 1. Circular Trace Queue (`src/core/c/trace.c`)
* **Role:** Decouples algorithm execution from playback. As C algorithms run, every operation generates an 8-byte event pushed into a static circular ring buffer.
* **Capacity:** `#define MAX_EVENTS 30000` (defined in `src/core/c/sortlens.h:17`).
* **Structure:**
  ```c
  typedef struct {
      sl_event_t buffer[MAX_EVENTS];
      int head;   // Write index
      int tail;   // Read index
      int count;  // Current event occupancy
      int overflow; // Set to 1 if count exceeds MAX_EVENTS
  } sl_trace_t;
  ```
* **Overflow Invariant:** If `count >= MAX_EVENTS`, the buffer sets `overflow = 1`, ceases recording further events, and returns `cOverflow = 1` to the frontend.

### 2. Array-Based Recursion Call Stack (`src/core/c/stack.c`)
* **Role:** Tracks call frames for recursive algorithms (Merge Sort and Quick Sort) to evaluate space complexity.
* **Capacity:** `MAX_STACK = 128` frames.
* **Operations:** `stack_push()` increments depth and updates `max_depth = max(max_depth, current_depth)`. `stack_pop()` decrements depth.

### 3. 11-Bucket Separate Chaining Hash Table (`src/core/c/hashtable.c`)
* **Role:** Measures duplicate distributions, distinct elements, and collision patterns without requiring $O(n^2)$ pairwise scans.
* **Hash Function:** Division modulo hashing:
  $$h(k) = k \pmod{11}$$
* **Collision Resolution:** Singly linked list nodes allocated dynamically or from static memory pools (`struct sl_hash_node`).
* **Metrics Computed:**
  - `distinctCount`: Count of unique values inserted.
  - `collisions`: Total elements that mapped to a non-empty bucket ($N - \text{non-empty buckets}$).
  - `duplicateRatio`: $d = \frac{N - \text{distinctCount}}{N}$.

---

## Section F — Authoritative Operation Counting Rules

In SortLens, counting conventions follow strict syllabus guidelines (`docs/reference/COUNTING_RULES.md`):

1. **Comparisons:**
   - Incremented each time two data elements are compared (`A[i] < A[j]`, `A[i] <= pivot`, etc.).
   - Loop index comparisons (`i < n`, `low < high`) are **NOT** counted.
2. **Array Writes:**
   - Incremented each time an array element is modified (`A[i] = value`).
   - A variable swap ($t = A[i]; A[i] = A[j]; A[j] = t$) modifies the array twice and uses an auxiliary temporary variable; by academic syllabus convention, it is tallied as **$3\text{ writes}$** (or $2\text{ in-place writes}$ plus temporary allocation).
   - In Merge Sort, copying to `temp[k]` is $1\text{ write}$, and copying back from `temp[k]` to `A[i]` is $1\text{ write}$.
3. **Swaps vs Writes:**
   - Swaps are compound operations. Selection Sort performs at most $n-1$ swaps ($3(n-1)$ writes), whereas Bubble Sort can perform up to $\frac{n(n-1)}{2}$ swaps.
4. **Operation Counts vs Execution Time:**
   - Operation counts are **invariant**: running the same array on an Apple M3, Intel Core i7, or WebAssembly yields the exact same logical operation numbers.
   - Wall-clock time varies based on CPU clock frequency, branch predictors, cache hierarchies, and OS scheduling.

---

## Section G — Dataset Shape Analysis & Mathematical Metrics

Before any sorting race begins, `src/core/c/analyzer.c` analyzes the input array:

### 1. Inversions ($I$)
An inversion is a pair of indices $(i, j)$ such that:
$$i < j \quad \text{and} \quad A[i] > A[j]$$
* **Sorted Array:** $I = 0$.
* **Reverse Array:** $I = \frac{n(n-1)}{2}$.

### 2. Inversion Ratio ($r$)
Normalized measure of disorder ($0 \le r \le 1$):
$$r = \frac{2I}{n(n-1)}$$
Represented in the C API as an integer fixed-point value:
$$\text{inversion\_ratio\_x1000} = \left\lfloor 1000 \cdot r \right\rfloor$$

### 3. Maximum Leftward Displacement ($p$)
The greatest distance an element must travel leftward to reach its sorted position:
$$p = \max_{0 \le i < n} (i - \text{rank}(A[i]))$$
If $p$ is small ($p \le 2$), Insertion Sort will require at most $p$ shifts per element, executing in near-$O(n)$ time.

### 4. Duplicate Ratio ($d$)
$$d = \frac{n - \text{distinct}}{n}$$
Evaluated via the 11-bucket hash table. High duplicate ratios ($d > 0.5$) indicate that algorithms with early stability or duplicate bypass will perform well.

---

## Section H — Empirical Cost-Model Prediction & Scoreboard Verdicts

### 1. Mathematical Cost Estimators (`src/core/c/analyzer.c`)
The C99 core estimates total operations $O_{\text{est}}$ for each algorithm:
* **Bubble Sort:**
  $$O_{\text{bubble}} = \frac{n(n-1)}{2} + 3I$$
* **Selection Sort:**
  $$O_{\text{select}} = \frac{n(n-1)}{2} + 3(n - 1)$$
* **Insertion Sort:**
  $$O_{\text{insert}} = (n - 1) + 2I$$
* **Quick Sort (Lomuto):**
  $$O_{\text{quick}} = \begin{cases} 2n \ln(n) + 3I_{\text{eff}}, & \text{if } r < 0.9 \\ \frac{n(n-1)}{2} \cdot 1.5, & \text{if } r \ge 0.9 \text{ (Pathological Lomuto)} \end{cases}$$
* **Merge Sort:**
  $$O_{\text{merge}} = n \log_2(n) + 2n \lceil \log_2(n) \rceil$$

### 2. Prediction Winner Selection
$$\text{Predicted Winner} = \arg\min_{a \in \text{Algos}} O_{\text{est}}(a)$$
The model achieves **$96.50\%$ accuracy** across 1,000 synthetic trials.

### 3. Verdict Classification
* **CONFIRMED:** Predicted algorithm matches the observed winner on the selected metric.
* **MISSED:** A different algorithm won the race. (Observed legitimately on borderline cases, e.g., Quick vs Insertion at $N=20$).
* **INCONCLUSIVE:** A tie occurred for first place (`T-1`).

---

## Section I — Interactive Search Laboratory

SortLens provides a dedicated laboratory comparing Linear Search and Binary Search (`src/core/c/search.c`):

| Characteristic | Linear Search (`sl_linear_search`) | Binary Search (`sl_binary_search`) |
| :--- | :--- | :--- |
| **Input Precondition** | Unordered or ordered array | **Strictly Sorted Array** ($A[i] \le A[i+1]$) |
| **Time Complexity** | $O(n)$ worst-case, $O(1)$ best-case | $O(\log n)$ worst-case, $O(1)$ best-case |
| **Operation Invariant** | Inspects indices $0, 1, 2, \dots$ consecutively | Divides search space by halving: $mid = low + \frac{high - low}{2}$ |
| **Buffer Management** | Operates on the staged array directly | Operates on a dedicated pre-sorted search buffer `search_sorted_buf[]` |
| **Miss Detection** | Exits after $n$ comparisons | Exits when $low > high$ (at most $\lfloor \log_2 n \rfloor + 1$ comparisons) |

---

## Section J — Empirical Scaling Laboratory

* **Objective:** Compares empirical operation counts against theoretical asymptotic functions across sizes $N \in [10, 100]$.
* **Execution:** Runs the compiled C algorithms in batch mode with trace generation disabled (`recordTrace = 0`), guaranteeing instantaneous microsecond execution without UI lag.
* **Overlay Curves:**
  - **Solid Lines:** Measured empirical values ($C, W, \text{Total}$).
  - **Dashed Lines:** Theoretical references ($c_1 n^2, c_2 n \log_2 n, c_3 n$).
  - **Dotted Lines:** Closed-form cost model predictions ($O_{\text{est}}$).

---

## Section K — Testing Methodology & Mathematical Verification

1. **Native C Suite (`tests/c/test_core.c`):** 6/6 test suites compiled with MinGW-w64 GCC verifying sorting correctness, mathematical closed-form bounds, trace circularity, hash table duplicates, search, and stack depth.
2. **Empirical Calibration (`tools/calibrate.c`):** 1,000 synthetic runs verifying $96.50\%$ model accuracy.
3. **Cross-Runtime Parity (`tests/c/parity_harness.c` & `native-parity.test.ts`):** Verifies that WebAssembly output is 100% bit-identical to native GCC output.
4. **Automated Vitest Suite:** 31 test suites, 214 tests passing.
5. **Real-Browser Automation (`scripts/verify-browser-workflows.mjs`):** Exercises all 8 end-to-end workflows in Microsoft Edge via CDP with 100% pass rate.

---

## Section L — Known Limitations & Future Work

1. **Trace Queue Upper Bound:** $30,000$ events is optimal for $N \le 100$. For $N > 500$, trace generation requires dynamic paging or chunked streaming.
2. **Hardware Cache Invariance:** The core measures logical syllabus operations. It intentionally does not measure L1/L2 cache misses or CPU branch mispredictions.
3. **Lomuto Partitioning:** Quick Sort uses the last element as pivot per syllabus requirements; future iterations could include median-of-three or randomized pivots.

---

## Section M — Comprehensive Viva Q&A (35 Authoritative Questions)

### Q1: What problem does SortLens solve?
**Answer:** SortLens resolves the gap between theoretical Big-$O$ complexity and empirical algorithm behavior. It demonstrates how dataset structure (inversions, duplicate ratios, order) influences actual operation counts, showing that $O(n^2)$ Insertion Sort can outperform $O(n \log n)$ Quick or Merge Sort on nearly sorted inputs.  
*Reference:* `docs/reference/PROJECT_STATEMENT.md`.

### Q2: Why were these specific five sorting algorithms selected?
**Answer:** These five algorithms represent the core syllabus curriculum for Data Structures (Course 102040304): Bubble Sort (iterative exchange), Selection Sort (iterative selection), Insertion Sort (adaptive incremental insertion), Quick Sort (divide-and-conquer partitioning), and Merge Sort (divide-and-conquer merging).  
*Reference:* `src/core/c/sorts.c`.

### Q3: Why write the algorithms in C99 instead of pure TypeScript/JavaScript?
**Answer:** C99 provides deterministic memory layouts, precise pointer control, absence of JIT optimization variance, zero garbage collection pauses, and direct stack depth measurement. This ensures that algorithmic operation counts remain exact and identical across any execution platform.  
*Reference:* `docs/decisions/ADR-0001-target-architecture.md`.

### Q4: What role does WebAssembly play?
**Answer:** WebAssembly allows the compiled C99 codebase to run natively inside modern web browsers at near-native execution speed without rewriting the algorithms in JavaScript.  
*Reference:* `src/core/adapter/loader.ts`.

### Q5: Why use React and TypeScript for the frontend?
**Answer:** TypeScript provides compile-time type safety at the boundary with the C/WASM API (`CoreClient`), preventing memory corruption or invalid parameter calls. React provides declarative UI components and clean lifecycle management.  
*Reference:* `src/core/adapter/adapter.ts`.

### Q6: How are operation counts calculated?
**Answer:** Operation counts are tallied directly in the C source code at the exact line where operations occur. `cComparisons` is incremented whenever two data elements are compared; `cWrites` is incremented whenever an array slot is modified.  
*Reference:* `src/core/c/sorts.c`.

### Q7: What is an inversion?
**Answer:** An inversion is any pair of indices $(i, j)$ such that $i < j$ and $A[i] > A[j]$. It represents a pair of elements that are out of sorted order.  
*Reference:* `src/core/c/analyzer.c:38`.

### Q8: What does the inversion ratio ($r$) indicate?
**Answer:** The inversion ratio $r = \frac{2I}{n(n-1)}$ normalizes the inversion count between $0$ (completely sorted) and $1$ (strictly reverse sorted). It measures the global disorder of the array.  
*Reference:* `src/core/c/analyzer.c:56`.

### Q9: How is the maximum leftward displacement ($p$) defined?
**Answer:** $p = \max_{0 \le i < n} (i - \text{rank}(A[i]))$. It measures the maximum distance any element must shift to the left to reach its final sorted position. When $p$ is small, Insertion Sort runs in $O(n)$ time.  
*Reference:* `src/core/c/analyzer.c:98`.

### Q10: How does the cost model predict the winning algorithm?
**Answer:** It computes closed-form operational estimates for all five algorithms using input size $n$, inversion count $I$, and displacement $p$. The algorithm with the lowest estimated total operations is selected as the predicted winner.  
*Reference:* `src/core/c/analyzer.c:168`.

### Q11: Why can the predictive model make an incorrect prediction?
**Answer:** The cost model uses closed-form approximations calibrated on synthetic distributions. In borderline cases (e.g., $N=20$, $r=0.15$), the operational difference between Insertion Sort and Quick Sort may be just 2–3 operations, where exact pivot placement can swing the actual winner.  
*Reference:* `tools/calibrate.c`.

### Q12: How does the circular trace queue work?
**Answer:** It is a ring buffer of `#define MAX_EVENTS 30000` elements with `head` and `tail` pointers. Events are written to `buffer[head]` and wrap around using modulo arithmetic.  
*Reference:* `src/core/c/trace.c:28`.

### Q13: What happens if the circular trace queue overflows?
**Answer:** If event count reaches $30,000$, the C core sets `overflow = 1`, halts further recording, and returns `cOverflow = 1`. The frontend displays an overflow warning banner and persistence history rejects the run.  
*Reference:* `src/core/c/trace.c:45`, `src/state/persistence/runHelper.ts:60`.

### Q14: Why is the Lomuto Quick Sort pivot strategy important?
**Answer:** Lomuto always selects the last element ($A[high]$) as pivot. On sorted or reverse-sorted data, this produces highly unbalanced partitions ($0$ and $n-1$), degrading performance to $\Theta(n^2)$ and stack depth to $n-1$.  
*Reference:* `src/core/c/sorts.c:122`.

### Q15: How is Merge Sort's auxiliary storage handled?
**Answer:** A temporary auxiliary array `temp[]` of size $n$ is allocated before sorting. During each merge pass, elements are merged into `temp[]` ($1\text{ write each}$) and copied back to $A[]$ ($1\text{ write each}$), totaling $2k$ writes per merge pass of length $k$.  
*Reference:* `src/core/c/sorts.c:174`.

### Q16: What is separate chaining in the hash table?
**Answer:** Separate chaining handles hash collisions by maintaining a singly linked list at each table index. Colliding keys are prepended or appended to the list at `table[hash]`.  
*Reference:* `src/core/c/hashtable.c:35`.

### Q17: Why are there eleven hash buckets?
**Answer:** 11 is a prime number, which minimizes clustering when using division modulo hashing ($k \pmod{11}$) for keys in the range $[1 \dots 99]$.  
*Reference:* `src/core/c/sortlens.h:20`.

### Q18: How are recursion depths measured?
**Answer:** Through an array-based stack structure `sl_stack_t`. Whenever a recursive function is invoked, `sl_stack_push()` increments `depth` and updates `max_depth = max(max_depth, depth)`. On return, `sl_stack_pop()` decrements depth.  
*Reference:* `src/core/c/stack.c:30`.

### Q19: How does reverse playback reconstruct previous array states?
**Answer:** `frameReplay.ts` applies pure mathematical inverses to event opcodes. For example, a swap event $(i, j)$ is undone by swapping $(i, j)$ again; an element assignment $(i, oldVal, newVal)$ is reversed by restoring $A[i] = oldVal$.  
*Reference:* `src/engine/frameReplay.ts:45`.

### Q20: How is timeline seeking implemented without lag?
**Answer:** `FrameStore.ts` stores full array checkpoints every 50 events. Seeking to step $S$ loads checkpoint $\lfloor S / 50 \rfloor \cdot 50$ and replays at most 49 forward delta events, taking $< 0.2\text{ms}$.  
*Reference:* `src/engine/FrameStore.ts:50`.

### Q21: How do you guarantee that visual counters match the C core?
**Answer:** Visual counters are extracted directly from the C trace session metadata (`cComparisons`, `cWrites`, `cMaxDepth`). The frontend never calculates operation counts independently.  
*Reference:* `src/core/adapter/adapter.ts:165`.

### Q22: How does native/WebAssembly parity testing work?
**Answer:** `parity_harness.c` compiles natively with GCC and outputs a baseline JSON of counts and event traces across 8 test arrays. `native-parity.test.ts` runs the identical arrays in WASM and asserts bit-for-bit equality.  
*Reference:* `tests/c/parity_harness.c`, `src/core/test/native-parity.test.ts`.

### Q23: What is the difference between comparisons and writes?
**Answer:** Comparisons read and evaluate two values without altering memory. Writes modify array memory slots. Selection Sort has high comparisons ($\Theta(n^2)$) but low writes ($3(n-1)$), whereas Insertion Sort writes on every element shift.  
*Reference:* `docs/reference/COUNTING_RULES.md`.

### Q24: Why are empirical operation counts different from wall-clock execution time?
**Answer:** Operation counts reflect logical complexity independent of hardware. Wall-clock time depends on CPU frequency, branch prediction, hardware SIMD vectorization, cache misses, and background operating system tasks.  
*Reference:* `docs/reference/CALIBRATION.md`.

### Q25: How does Binary Search differ from Linear Search?
**Answer:** Linear Search checks elements sequentially in $O(n)$ time. Binary Search eliminates half the remaining elements at each step, operating in $O(\log n)$ time.  
*Reference:* `src/core/c/search.c:30`.

### Q26: Why must Binary Search operate on sorted input?
**Answer:** Binary Search relies on the monotonicity invariant: if $A[mid] < target$, the target cannot exist in $A[0 \dots mid]$. If the array is unsorted, this property fails and valid elements will be incorrectly discarded.  
*Reference:* `src/components/search/SearchLab.tsx:65`.

### Q27: How does the Scaling Lab generate measurements?
**Answer:** It executes the C99 algorithms across sizes $N \in [10, 100]$ with trace recording disabled (`recordTrace = 0`), reading exact final counter values in microseconds.  
*Reference:* `src/components/scaling/ScalingBenchmark.ts:40`.

### Q28: What is the difference between theoretical and empirical complexity?
**Answer:** Theoretical complexity ($O, \Omega, \Theta$) describes asymptotic scaling behavior as $n \to \infty$, ignoring constants. Empirical complexity measures actual operations performed on concrete finite inputs, capturing constant factors and shape-dependent variance.  
*Reference:* `docs/reference/PROJECT_STATEMENT.md`.

### Q29: How does the scoreboard handle ties?
**Answer:** It assigns honest tied rankings (e.g., `T-1`, `T-1`, `3`) when two or more algorithms achieve the exact same operation count on the judged metric.  
*Reference:* `src/components/results/Scoreboard.tsx:85`.

### Q30: Why is a complete race required before revealing final results?
**Answer:** Concealing results prevents outcome leakage. In an educational environment, students should observe the execution dynamics and formulate hypotheses before inspecting the final scoreboard verdict.  
*Reference:* `src/components/arena/SortingArena.tsx:212`.

### Q31: How does local persistence work?
**Answer:** It uses browser `localStorage` with versioned envelopes (`sortlens_preferences_v1`, `sortlens_history_v1`). Preferences sync automatically on change; completed runs are appended up to a 200-run ceiling.  
*Reference:* `src/state/persistence/storage.ts:80`.

### Q32: What does the application do when stored data is malformed?
**Answer:** `storage.ts` wraps parsing in schema validation. Corrupted JSON or invalid version headers are discarded and safely replaced with `DEFAULT_PREFERENCES` without throwing runtime exceptions.  
*Reference:* `src/state/persistence/storage.ts:110`.

### Q33: How is keyboard accessibility handled?
**Answer:** `useKeyboardShortcuts.ts` registers global listeners for <kbd>Space</kbd>, arrows, <kbd>Home</kbd>, and <kbd>1</kbd>–<kbd>5</kbd>, suppressing execution when focused inside form inputs (`<input>`, `<textarea>`). Modal dialogs enforce focus trapping.  
*Reference:* `src/hooks/useKeyboardShortcuts.ts:60`.

### Q34: What is the role of the HTML5 Canvas in the arena?
**Answer:** Canvas 2D draws bars, active partitions, comparisons, and write highlights directly in pixels, decoupling 60 FPS animation rendering from React's virtual DOM reconciliation.  
*Reference:* `src/components/arena/canvas/drawLane.ts:30`.

### Q35: What are the project's primary engineering limitations?
**Answer:** The static trace queue bound of 30,000 events limits single-run visualization to $N \le 100$; operations are logical rather than wall-clock nanoseconds; and the application requires an HTTP/HTTPS server due to browser WebAssembly security policies.  
*Reference:* `release/RELEASE_NOTES.md:90`.
