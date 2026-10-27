# SortLens Rebuild — Release Notes (v1.0.0)

**Release Date:** October 2026  
**Product:** SortLens — Academic Sorting & Searching Algorithm Analyzer  
**Version:** 1.0.0 (Production Release)  
**Distribution Target:** Static Browser Application (WebAssembly + React 19 / TypeScript 7)  
**Target Environment:** Modern Web Browsers (Chrome 80+, Edge 80+, Firefox 75+, Safari 14+)

---

## 1. Overview

SortLens v1.0.0 is an academic algorithmic analyzer and visualization workbench designed to explore the empirical runtime complexity of syllabus sorting and searching algorithms under controlled dataset shapes.

SortLens replaces traditional black-box sorting visualizers with a verified dual-layer architecture: all algorithm logic, operation counting, trace event generation, and duplicate tracking execute inside a compiled C99 core running via WebAssembly, while a deterministic React/TypeScript frontend provides reversible playback, multi-lane coordination, and telemetry visualization.

---

## 2. Core Capabilities & Architectural Highlights

### 2.1 Preserved C99 Algorithmic Engine
* **Five Syllabus Sorting Algorithms:**
  1. **Bubble Sort:** With early exit optimization on zero swaps.
  2. **Selection Sort:** Unconditional minimum element selection.
  3. **Insertion Sort:** Inner shift scan with element insertion.
  4. **Quick Sort:** Lomuto partitioning using the last element as the pivot.
  5. **Merge Sort:** Top-down recursive divide-and-conquer with temporary auxiliary buffer.
* **Rigorous Syllabus Counting Invariants:**
  - Comparisons and array writes are tallied strictly in the C engine at the point of logical execution.
  - Swap operations count as 3 writes in Bubble and Selection Sort per academic convention.
  - Key insertion writes are counted on every pass in Insertion Sort.
* **100% Native Parity:** Verified bit-for-bit event trace and counter identity between native GCC C execution and the WebAssembly build.

### 2.2 Deterministic Reversible Playback Engine
* **Bidirectional Step Navigation:** Step forward or backward through any recorded event with pure delta inversion.
* **Sparse Checkpointed Frame Store:** Interval-50 array state snapshots provide instantaneous (< 0.2ms) timeline seeking across thousands of events with negligible memory overhead (< 50 KB).
* **Decoupled Animation Timing:** Simulation clock (1 to 1000 events/second) operates independently from display refresh rates (60–144 Hz), immune to background tab throttling.
* **Five-Lane Coordination:** Parallel orchestrator tracks individual algorithm completion while maintaining global step synchronization across all five lanes.

### 2.3 Dataset Shape Analysis & 11-Bucket Hash Table
* **Inversion Analysis:** Exact calculation of inversions ($I$), normalized inversion ratio ($r = \frac{2I}{N(N-1)}$), and maximum leftward displacement ($p$).
* **11-Bucket Separate Chaining Hash Table:** Employs division modulo hashing ($h(k) = k \pmod{11}$) with linked list chains to detect duplicates, measure collision count, and display bucket occupancy.
* **Empirical Cost-Model Predictions:** Mathematical closed-form estimators predict the optimal algorithm for the dataset ($96.50\%$ calibration accuracy across 1,000 synthetic trials).
* **Zero Leakage:** Predictions and scoreboard rankings remain completely concealed during playback until the race finishes.

### 2.4 Post-Race Scoreboard & Verdicts
* **Authoritative Rankings:** Ranks all five algorithms based on the user-selected judge metric (Comparisons, Writes, or Total Operations).
* **Honest Tie Resolution:** Ties are marked explicitly (`T-1`, `T-2`) rather than arbitrarily broken.
* **Academic Verdicts:** Compares the mathematical model pick against the observed winner, declaring `CONFIRMED`, `MISSED`, or `INCONCLUSIVE`.

### 2.5 Specialized Academic Laboratories
* **Interactive Search Lab:** Side-by-side comparison between Linear Search ($O(n)$) and Binary Search ($O(\log n)$) on sorted data, featuring step navigation, target selection ($1..99$), and boundary tracking.
* **Empirical Scaling Lab:** Runs live C99 benchmarks across sizes $N \in [10, 100]$, rendering empirical curves, theoretical asymptotic references ($O(n^2), O(n \log n), O(n)$), and closed-form cost model predictions.
* **Scripted Viva Demo Mode:** Guided 10-stage, 92-second academic tour highlighting core architectural features with floating control bar and examiner study notes.

### 2.6 Persistence, Accessibility & Ergonomics
* **Local Persistence:** Version 1 envelope stored in `localStorage` preserving user preferences and a bounded history of up to 200 verified runs, with automatic quota recovery.
* **Keyboard Navigation:** System-wide shortcuts (<kbd>Space</kbd>, <kbd>→</kbd>, <kbd>←</kbd>, <kbd>Home</kbd>, <kbd>1</kbd>–<kbd>5</kbd>, <kbd>?</kbd>, <kbd>H</kbd>, <kbd>Esc</kbd>) with strict input field suppression.
* **WCAG 2.2 AA Compliance:** High-contrast dark graphite laboratory aesthetic, `aria-live` polite screen reader announcer, and Canvas fallback text mirrors.

---

## 3. Known Limitations & Engineering Boundaries

1. **Circular Trace Queue Capacity (`MAX_EVENTS = 30000`):**
   The C99 trace buffer allocates up to 30,000 events. For array sizes $N \le 100$, all five algorithms complete well within this bound under normal conditions. In the event of an overflow, the core sets `cOverflow = 1`, the arena displays an overflow warning, and persistence strictly rejects recording the run to prevent corrupted telemetry.
2. **Logical Operation Counts vs Wall-Clock Benchmarks:**
   SortLens measures algorithmic comparisons and writes as defined by academic syllabi. These figures reflect algorithmic complexity rather than nanosecond CPU elapsed time, which is subject to hardware CPU caching, SIMD vectorization, and JIT compilation.
3. **HTTP/HTTPS Protocol Requirement:**
   Due to browser WebAssembly and ECMAScript module security policies, SortLens must be served over an HTTP or HTTPS server. Opening `index.html` directly via the `file://` scheme is unsupported by modern web browsers.
4. **Predictive Cost-Model Calibration Ceiling:**
   The empirical cost model is calibrated on synthetic distributions (achieving 96.50% accuracy). Pathological custom datasets (e.g., highly inverted arrays with median pivots) can yield prediction misses. In SortLens, missed predictions are surfaced honestly as valuable educational observations.

---

## 4. Verification & Test Metrics

* **Automated Vitest Tests:** 31 test suites, 214 tests passing (100% pass rate).
* **Native C99 Tests:** 6/6 test suites passing (`test_core.c`).
* **Empirical Calibration:** 96.50% model accuracy across 1,000 trials (`calibrate.c`).
* **Cross-Runtime Parity:** 100% exact event and counter parity between native C and WebAssembly (`native-parity.test.ts`).
* **Real-Browser Automation (CDP / Edge):** 8/8 workflows verified passing on the production static build.
* **Production Static Build:** Zero TypeScript errors; 564ms static build time; 104 kB gzip transfer size.
