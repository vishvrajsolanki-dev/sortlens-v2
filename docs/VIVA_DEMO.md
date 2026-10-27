# Viva Demonstration Mode & Examiner Study Guide

## 1. Purpose and Architecture

Viva Demo Mode is an automated, scripted 90-second guided demonstration designed for university oral examinations and practical evaluations (Course 102040304 Data Structures, CVM University).

It allows a student to guide an examiner through the application's core concepts in a structured sequence without manual clicking or fumbling.

---

## 2. Stage Progression & Roadmap

The demonstration comprises 10 syllabus-aligned stages:

| Stage | Title | Target View | Duration | Syllabus Topic |
| :---: | :--- | :---: | :---: | :--- |
| **01** | **SortLens Purpose & Foundations** | Arena | 8s | Course Overview |
| **02** | **Deterministic Dataset Generation** | Arena | 8s | Unit 1 (Input Arrays) |
| **03** | **Dataset Shape Metrics & Hash Table** | Analysis | 10s | Unit 3 & 6 (Lists, Modulo Hashing) |
| **04** | **Empirical Cost-Model Prediction** | Analysis | 8s | Unit 1 (Complexity Modeling) |
| **05** | **Five-Lane Synchronized Sorting Arena**| Arena | 16s | Unit 2 (Queues & Stacks) |
| **06** | **Operation Telemetry Comparison** | Arena | 8s | Unit 1 (Space & Time Work) |
| **07** | **Verified Results Scoreboard** | Arena | 8s | Evaluation & Integrity |
| **08** | **Search Lab: Linear vs. Binary** | Search | 10s | Unit 6 (Searching Algorithms) |
| **09** | **Scaling Lab: Complexity Curves** | Scaling | 10s | Unit 1 (Asymptotic Benchmarks) |
| **10** | **Architecture Summary & Conclusion** | Viva | 6s | Course Summary |

**Total Duration:** Nominal 92 seconds.

---

## 3. Controller Architecture (`VivaDemoController`)

* **State Management:** Explicit state transitions (`idle` $\rightarrow$ `running` $\leftrightarrow$ `paused` $\rightarrow$ `completed`).
* **Safe Subscription Pattern:** Supports multiple concurrent UI subscribers via `subscribe((state) => void)` with unregister cleanup on unmount.
* **Non-Destructive Navigation:** Automatic view synchronization updates `useAppStore.activeSection` without corrupting user state or overwriting race coordinator listeners.
* **Manual Overrides:** The student or examiner can Pause, Resume, Advance (Next), Revisit (Prev), or Jump directly to any stage.
* **Clean Termination:** When stopped or exited, all timers (`setInterval`) are cleared immediately.

---

## 4. Examiner Study Guide & Viva Q&A

1. **Inversions ($I$):** Governs local sort work. A sorted array has $I = 0$; reversed has $I = n(n-1)/2$. Bubble sort writes equal $3I$ on swaps. Insertion sort shifts are directly proportional to leftward inversions.
2. **Lomuto Partition Breakdown:** On sorted/reverse data, fixing the pivot at `arr[high]` splits subarrays into $n-1$ and $0$, causing $O(n^2)$ comparisons and $O(n)$ recursion stack degradation.
3. **Separate-Chaining Hash Table:** Fixed 11 buckets with modulo hash function `val % 11`. Uses singly linked list chains (Unit 3) to detect duplicate values and log bucket collisions honestly.
4. **Trace Queue Guarantee:** C99 WebAssembly core emits event records (`type, a, b, c, d`) into a circular Trace Queue (Practical 5). Browser visualizes deterministic snapshots from this queue, asserting 100% parity on completion.
5. **Binary Search Precondition:** Requires an $O(n \log n)$ sorted search buffer. Halves the interval at each step, requiring at most $\lceil \log_2 n \rceil$ comparisons.
