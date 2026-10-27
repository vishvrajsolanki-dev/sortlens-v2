# PROJECT STATEMENT & SYLLABUS MAPPING

## 1. Project Statement
SortLens is an input-aware sorting analyzer. It measures the shape of an array (inversions, maximum leftward displacement, and duplicates via hashing with separate chaining), estimates the cost of each of the five syllabus sorting algorithms using an empirical cost model, predicts the cheapest, then verifies the prediction by running instrumented C implementations compiled to WebAssembly. Each race is replayed step by step from the C program's own recorded trace queue, so the animation and the counters cannot disagree. Prediction accuracy is logged honestly.

---

## 2. Syllabus Mapping (Course 102040304 - Data Structures, CVM University)

SortLens strictly complies with the **Syllabus Lock**: only syllabus topics are implemented, with zero forbidden data structures (no trees, heaps, AVL, shell sort, Timsort, or median-of-three pivots).

| Syllabus Unit | Topics Covered in Syllabus | How SortLens Uses It | Files in Codebase |
| :--- | :--- | :--- | :--- |
| **Unit 1** | Arrays, Time & Space Complexity | Array representation of datasets (size 2..100, values 1..99). Time and space complexity benchmarking ($O(n^2)$ vs $O(n \log n)$). | `core/sorts.c`, `core/analyzer.c` |
| **Unit 2** | Stack & Queue as Arrays, Recursion | - **Trace Queue (Practical 5)**: Array-based circular queue (`events[MAX_EVENTS]`) storing C sorting events for deterministic browser playback.<br>- **Call Stack (Practical 3)**: Array-based recursion stack (`data[]`, `top`) tracking recursion call depth in Quick Sort and Merge Sort. | `core/trace.c`, `core/stack.c` |
| **Unit 3** | Singly Linked List | Singly linked list nodes (`struct HashNode { int value; struct HashNode *next; }`) used for separate chaining bucket collisions. | `core/hashtable.c` |
| **Unit 6** | Five Sorting Algorithms, Searching, Hashing | - **Bubble Sort**: Adjacent swaps with early-exit flag `swapped`.<br>- **Selection Sort**: Minimum index selection with single swap per pass.<br>- **Insertion Sort**: Shift-based insertion with key variable.<br>- **Quick Sort**: Recursive Lomuto partition with last element `arr[high]` as pivot.<br>- **Merge Sort**: Top-down recursion with auxiliary buffer.<br>- **Searching**: Linear search ($O(n)$) and Binary search ($O(\log n)$) with step tracking.<br>- **Hashing (Practical 10)**: Table size 11, modulo hash function (`val % 11`), separate chaining for duplicate measurement. | `core/sorts.c`, `core/search.c`, `core/hashtable.c` |

---

## 3. Before vs. After Matrix (v1 vs. v2)

| Feature | Legacy v1 | SortLens v2 |
| :--- | :--- | :--- |
| **Architecture** | Client-Server (Flask backend running local `sortlens_core.exe` subprocess, SQLite database) | **100% Client-Side WebAssembly**: C core compiles via Emscripten into single-file `frontend/js/core.js`. Runs locally on double-click (`file://`) and free static hosts (Cloudflare Pages). |
| **Sorting Engine** | Sorting logic duplicated: C counted operations, but JavaScript re-implemented all 5 sorts for animation (risking counter-visual mismatches). | **Single Source of Truth**: Zero sorting logic in JS. WebAssembly records exact trace queue events; JS simply plays back snapshots. |
| **Prediction Model** | Naive 5-rule heuristic table predicting Quick Sort on almost all random arrays (accuracy: **25.0% on random**, 50% overall). | **Calibrated Cost Model**: Estimates comparisons and writes from inversions, $p$, and duplicate ratio. Achieves **85.50% on random** and **96.50% overall**. |
| **Duplicate Detection** | $O(n^2)$ brute-force nested loops. | **Hash Table with Separate Chaining** (Unit 6 / Practical 10) tracking distinct values and bucket collisions. |
| **Recursion Tracking** | None. | **Array-based Call Stack** (Practical 3) tracking call tree depth, exposing Lomuto $O(n)$ stack degradation on sorted data. |
| **Interactive Labs** | None. | **Search Lab** (Linear vs Binary), **Scaling Lab** (empirical complexity curves), and **Viva Demo Mode** (90s automated tour). |
| **History & Storage** | Server-side SQLite `backend/sortlens.db`. | Browser `localStorage` (last 200 runs preserved safely). |
