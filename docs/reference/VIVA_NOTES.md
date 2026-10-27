# VIVA NOTES: SortLens v2

These concise viva notes are prepared for a 2nd-year B.Tech (AI & Data Science) student at CVM University. You can explain every line and design decision with confidence.

---

### Q1: What is SortLens and what problem does it solve?
**Answer**:
"SortLens is an input-aware sorting analyzer. In standard data structures courses, students are often taught that Quick Sort is always fastest ($O(n \log n)$) and Insertion Sort is slow ($O(n^2)$). However, the real runtime performance depends heavily on the **shape** of the array—its inversions and duplicate count. SortLens measures these features in C, predicts the cheapest algorithm using an empirical cost model, races all five syllabus algorithms compiled to WebAssembly, and verifies the prediction honestly."

---

### Q2: What is an Inversion, and why does it matter?
**Answer**:
"An inversion is a pair of indices $(i, j)$ such that $i < j$ but $\text{arr}[i] > \text{arr}[j]$.
- A strictly sorted array has **0 inversions**.
- A strictly reversed array has the maximum possible inversions: $\frac{n(n - 1)}{2}$.
Inversions directly govern the work of local sorts:
- In **Bubble Sort**, every adjacent swap eliminates exactly 1 inversion. Therefore, Bubble Sort writes are strictly equal to $2 \times I$.
- In **Insertion Sort**, the number of shifts required to insert each element is directly proportional to the inversions to its left."

---

### Q3: Why does Quick Sort with a last-element Lomuto pivot lose on sorted or reversed data?
**Answer**:
"We use the syllabus-standard Lomuto partition where the pivot is always the last element (`arr[high]`).
- When the array is already sorted, the pivot is always the largest element. The partition splits into a subarray of size $n - 1$ and a subarray of size $0$.
- Because of this worst-case unbalanced division, Quick Sort performs:
  $$\sum_{i=1}^{n-1} i = \frac{n(n - 1)}{2} \text{ comparisons}$$
- Its recursion call stack depth degrades from $O(\log n)$ to $O(n)$, which our call stack visualizer proves directly. Merge Sort, on the other hand, strictly divides at the midpoint $\lfloor (low + high)/2 \rfloor$, guaranteeing $O(n \log n)$ depth."

---

### Q4: How is duplicate detection implemented, and why not use an $O(n^2)$ loop?
**Answer**:
"We implemented a Hash Table using **separate chaining** (Unit 6 / Practical 10):
- Table size is fixed at 11 buckets.
- Hash function is modulo: `val % 11`.
- Each bucket is a singly linked list (`struct HashNode`).
- When an element is inserted, we traverse its bucket chain. If it is found, it is recorded as a duplicate; if not found, a new node is inserted at the head. If the bucket already had items, we also log a hash collision.
- This maps directly to Unit 3 (Singly Linked Lists) and Unit 6 (Hashing with collision resolution)."

---

### Q5: How does the frame animation work, and how do you guarantee counters match?
**Answer**:
"In v1, sorting was re-implemented in JavaScript, which meant the JS animation could do different steps than the C code.
In v2, all five sorts run exclusively in C compiled to WebAssembly. As each algorithm executes, it enqueues event structs (`type, a, b, c, d`) into an array-based **Trace Queue** (Practical 5).
The JavaScript frontend simply iterates over these events, creating an array of snapshot frames with an `Int16Array`. The player only scrubs through these pre-recorded frames. At the final frame, the code asserts that the frame counter strictly equals the C counter."

---

### Q6: What is the space complexity of each algorithm?
**Answer**:
- **Bubble Sort**: $O(1)$ auxiliary space (in-place).
- **Selection Sort**: $O(1)$ auxiliary space (in-place).
- **Insertion Sort**: $O(1)$ auxiliary space (in-place).
- **Quick Sort**: $O(\log n)$ average recursion stack space; $O(n)$ worst-case stack space.
- **Merge Sort**: $O(n)$ auxiliary space because it requires a temporary buffer `temp_buf` during the merge step to hold elements before copying back.

---

### Q7: Why did legacy v1 achieve only 25% accuracy on random data, and how did v2 fix it?
**Answer**:
"The legacy classifier used a crude hardcoded rule: if $n > 18$ and not nearly sorted or heavily duplicated, always guess Quick Sort. But on random arrays of sizes 20–50 with Lomuto partitioning, Quick Sort often requires $\approx 1.39 n \log_2 n$ comparisons plus overhead, while Merge Sort requires only $\approx n \log_2 n - 1.25n$.
In v2, we introduced a mathematical cost model interpolating between best, average, and worst cases based on the mixing factor $m = 4r(1 - r)$ and duplicate penalty $d$. Our calibration benchmark over 1,000 synthetic arrays showed accuracy improved from 25% to **85.50% on random** and **96.50% overall**."
