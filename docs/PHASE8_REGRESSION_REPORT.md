# SortLens Rebuild — Phase 8 Full-System Regression Report

**Date of Execution:** October 2026  
**Auditor:** Principal Reliability & QA Systems Architect  
**Workspace:** `c:\Users\vishv\OneDrive\Desktop\DS MINI PROJECT\sortlens-rebuild`  
**Original Repository:** `c:\Users\vishv\OneDrive\Desktop\DS MINI PROJECT\sortlens` (Preserved READ-ONLY on branch `v2`)  
**Overall Regression Verdict:** **PHASE 8 PASS — READY FOR PHASE 9**

---

## 1. Initial Working-Tree Status

* **Rebuild Repository (`sortlens-rebuild`):** Branch `master`, baseline verified with all components clean.
* **Original Repository (`sortlens`):** Verified pristine on branch `v2`:
  ```text
  $ git -C "c:\Users\vishv\OneDrive\Desktop\DS MINI PROJECT\sortlens" status
  On branch v2
  nothing to commit, working tree clean
  ```

---

## 2. Baseline Type-Check, Test, and Build Results

* **TypeScript Typecheck:** `tsc --noEmit` exited with code 0 (zero errors).
* **Automated Unit & Integration Test Baseline:** 30 test files, 200 tests passing.
* **Production Static Build Baseline:** Vite 8 production build completed in 645ms.

---

## 3. C Source-Hash Verification

All 8 modular C99 core files were audited against the binary SHA-256 hashes recorded in `docs/SOURCE_MANIFEST.md`:

| Source File | Observed SHA-256 Hash | Manifest Hash | Match Status |
| :--- | :--- | :--- | :--- |
| `src/core/c/sortlens.h` | `E2489FDDC138E1C7A127F35D79802C4E6AA3F64F85400319B1912DD84AB5E262` | `E2489FDDC138E1C7A127F35D79802C4E6AA3F64F85400319B1912DD84AB5E262` | **EXACT MATCH** |
| `src/core/c/sorts.c` | `6A25B5089DF510DCED4E45D6F7D2F614CA039C049358F49013A8FDCB61399543` | `6A25B5089DF510DCED4E45D6F7D2F614CA039C049358F49013A8FDCB61399543` | **EXACT MATCH** |
| `src/core/c/analyzer.c` | `4B975C99D72B1296F710D8CB0BD243C16023450C088E3AB3AE3450ED70B0FC2B` | `4B975C99D72B1296F710D8CB0BD243C16023450C088E3AB3AE3450ED70B0FC2B` | **EXACT MATCH** |
| `src/core/c/hashtable.c` | `CF7CB554EE0C3DD3917BA8F9A359A2CAFD33E5D77E56A877EABDA6296A824E42` | `CF7CB554EE0C3DD3917BA8F9A359A2CAFD33E5D77E56A877EABDA6296A824E42` | **EXACT MATCH** |
| `src/core/c/stack.c` | `5E3977E76B679555B96D2747EB1EE64F6D9CDCE6F15BFDC62BFCB185FF147B16` | `5E3977E76B679555B96D2747EB1EE64F6D9CDCE6F15BFDC62BFCB185FF147B16` | **EXACT MATCH** |
| `src/core/c/trace.c` | `C1569C6191B5131EC0D1E741FE3E4251FBB6AFE9DFA8C8E780479A258C58292A` | `C1569C6191B5131EC0D1E741FE3E4251FBB6AFE9DFA8C8E780479A258C58292A` | **EXACT MATCH** |
| `src/core/c/search.c` | `598594AB8879CACC041CBDF08532F6271817F2CA41AF1CDBF12E801E73DF393E` | `598594AB8879CACC041CBDF08532F6271817F2CA41AF1CDBF12E801E73DF393E` | **EXACT MATCH** |
| `src/core/c/api.c` | `4A36F20236D559784A98ED86B4B4F26D48CBF23261B9E36D5E624FD5F49912A5` | `4A36F20236D559784A98ED86B4B4F26D48CBF23261B9E36D5E624FD5F49912A5` | **EXACT MATCH** |

* **Trace Buffer Capacity Verification:** Confirmed `sortlens.h` line 7:
  ```c
  #define MAX_EVENTS 30000
  ```

---

## 4. Native C99 Test & Calibration Results

1. **Native Test Suite (`tests/c/test_core.c`):**
   Compiled with MinGW-w64 GCC 15.2.0 (`gcc -Itests -O2 -Wall -std=c99 ...`):
   * `test_sort_correctness`: PASS (all 5 sorts correctly sort random, sorted, reverse, duplicates)
   * `test_closed_form_counts`: PASS (mathematical invariants verified)
   * `test_trace_replay`: PASS (replaying events produces sorted array, compare counts match)
   * `test_hashtable_duplicates`: PASS (hash table distinct matches $O(n^2)$ ground truth: 11)
   * `test_search`: PASS (Linear and Binary search both find targets and report miss)
   * `test_stack_depth`: PASS (Quick sort recursion depth on sorted data = 14, demonstrates $O(n)$ degradation)
   * **Result:** **ALL 6 NATIVE TESTS PASSED (100%)**.

2. **Empirical Calibration Benchmark (`tools/calibrate.c`):**
   Evaluated 1,000 synthetic arrays across 5 patterns, sizes $N \in [10, 100]$:
   * Random: 171 / 200 (85.50%)
   * Nearly sorted: 200 / 200 (100.00%)
   * Reverse: 200 / 200 (100.00%)
   * Sorted: 200 / 200 (100.00%)
   * Few unique: 194 / 200 (97.00%)
   * **Overall Accuracy:** **96.50% (965 / 1,000 runs confirmed)**, comfortably exceeding the $\ge 85\%$ threshold.

---

## 5. WebAssembly Runtime & Cross-Runtime Parity

Executed `npm run test:parity` which compiles the native reference harness (`parity_harness.c`) and asserts exact equality against `CoreClient` WebAssembly outputs:
* **Test Cases:** `random_small` ($N=10$), `already_sorted` ($N=10$), `strictly_reversed` ($N=10$), `duplicates_heavy` ($N=14$), `min_size_two` ($N=2$), `all_identical` ($N=8$), `nearly_sorted` ($N=12$), `prng_large_50` ($N=50$).
* **Metrics Verified:**
  - Sorted array outputs: 100% bitwise parity.
  - Comparisons and writes counts: 100% exact parity.
  - Maximum call stack depth: 100% exact parity.
  - Event queue counts: 100% exact parity.
  - Shape metrics (inversions, inversion ratio, duplicate ratio, distinct count, hash collisions, max left greater displacement): 100% exact parity.
  - Search results and comparison counts (linear and binary, present and absent targets): 100% exact parity.
* **Parity Verdict:** **100% EXACT CROSS-RUNTIME PARITY VERIFIED**.

---

## 6. Sorting Arena Integration Results

* 5 concurrent lanes (Bubble, Selection, Insertion, Lomuto Quick, Merge) mount reliably with independent completion status.
* Race coordinator manages playback lockstep without React re-render thrashing.
* Playback controls verified: Play, Pause, Resume, Step Forward, Step Backward, Seek (arbitrary timeline scrub), Restart (Step 0), Speed adjustment (1–1000 events/sec).
* Staging a new dataset resets coordinator and frame buffer without state leakage.

---

## 7. Playback and Canvas Verification

* **Geometry & Layout:** Bar layout generator (`calculateBarLayout.ts`) tested across sizes $N \in [2, 100]$:
  - Width and height strictly bounded within canvas dimensions.
  - Labels cleanly suppressed for $N > 25$ to prevent visual overlap.
  - High-DPI retina scaling ($DPR \ge 1$) properly handled.
* **Canvas Drawing:** Tested highlight states for active comparison, element writes/swaps, Lomuto pivot, and partition range shading.

---

## 8. Analysis and Prediction Results

* **Pre-Run Shape Analysis:** Displays Inversions ($I$), inversion ratio ($r$) gauge, maximum leftward displacement ($p$), distinct count, duplicate ratio ($d$), and 11-bucket hash table structure.
* **Closed-Form Predictions:** Zero-leakage policy verified: predictions and model rationale remain concealed until the student or examiner triggers the reveal button.

---

## 9. Scoreboard and Tie Handling

* **Outcome Gating:** Scoreboard is strictly hidden before race-wide completion (`isRaceComplete === true`).
* **Tie Handling:** Competition ranking handles identical operation counts honestly (`T-1`, `T-2`), with subsequent ranks properly incremented.
* **Verdict Accuracy:** Validated against 4 outcome states: `CONFIRMED`, `SURPRISED`, `INCONCLUSIVE`, and `UNAVAILABLE`.

---

## 10. Search Lab Results

* Linear Search ($O(n)$) and Binary Search ($O(\log n)$) execute side-by-side on the identical dataset.
* Verified that Binary Search visualizer probes the exact C `g_sorted_array` buffer produced by `prepareSearch`.
* Search playback supports stepping, timeline scrub, speed change, and restart.
* Target validation rejects non-integer, negative, or $>99$ inputs.

---

## 11. Empirical Scaling Lab Results

* Live C benchmarks execute across sizes $N \in [10, 100]$ with `recordTrace = false`.
* Mathematical complexity verified: Selection Sort comparisons strictly equal $N(N-1)/2$.
* Interactive SVG chart renders solid empirical curves alongside dashed asymptotic references and dotted cost-model estimates.
* Data table provides accessible tabular representation of all recorded measurements.

---

## 12. Viva Demo Mode Results

* 10-stage scripted 92-second demonstration progresses deterministically through all academic topics.
* Multi-subscriber `VivaDemoController` notifies listeners with stage metadata, progress timers, and automatic cleanup upon unmount.
* Integrated examiner study guide provides syllabus talking points for academic evaluation.

---

## 13. Persistence and Reload Results

* Preferences (`arraySize`, `datasetPattern`, `judgeBy`, `playbackSpeed`, `activeSection`, `sidebarCollapsed`) hydrate upon startup and auto-save on mutation.
* Telemetry history records completed runs idempotently (keyed by unique `runId`).
* Max 200 runs retention enforced newest-first.
* Automatic recovery from `QuotaExceededError` prunes the oldest 50% of history records.
* History modal supports run inspection, table expansion, JSON export, and confirmed clearing.

---

## 14. Keyboard and Accessibility Findings

* **Keyboard Navigation:** <kbd>Space</kbd>, <kbd>→</kbd>, <kbd>←</kbd>, <kbd>Home</kbd>, <kbd>1</kbd>–<kbd>5</kbd>, <kbd>?</kbd>, <kbd>H</kbd>, <kbd>Esc</kbd> verified across the entire application shell.
* **Input Suppression:** Typing within `<input>`, `<textarea>`, `<select>`, or contenteditable elements suppresses global shortcuts.
* **Live Announcer:** `aria-live="polite"` with 300ms polite throttling broadcasts state transitions without queue flooding.
* **Canvas Fallback:** `role="img"` with descriptive `aria-label` and accompanying `.sl-sr-only` live mirror text.
* **Motion & Contrast:** `@media (prefers-reduced-motion: reduce)` supported; text contrast ratios exceed 4.5:1 (WCAG AA).

---

## 15. Responsive Browser Verification

* Production build previewed over HTTP (`http://localhost:4173` via Vite Preview).
* Verified clean viewport adaptability across:
  - Mobile (360px): Hamburger navigation drawer, stacked control layout, zero horizontal scroll.
  - Tablet (768px): Responsive grid wrapping.
  - Laptop (1366px): Full side-by-side analysis and 5-lane arena.
  - Desktop (1920px): Centered workbench with bounded maximum widths.

---

## 16. Performance and Resource-Lifecycle Findings

* **50 Consecutive Race Runs:** Verified zero coordinator degradation, zero memory bloat, and sub-millisecond seeking.
* **Event Loop Decoupling:** Simulation clock updates independently of React render cycles.
* **Timer Cleanup:** Search player and Viva demo controllers dispose interval/timeout references upon unmount.

---

## 17. Defects Discovered & Remediated

1. **Defect P8-01: Native C Test Include Path Mismatch**
   - *Symptom:* `npm run test:native` failed during GCC compilation because `tests/c/test_core.c` included `../core/sortlens.h` from a sub-directory depth of 2.
   - *Fix:* Added `-Itests` to GCC flags in `package.json` so `#include "../core/sortlens.h"` resolves correctly without mutating the preserved C source.
2. **Defect P8-02: Target Integer Validation in SearchLab**
   - *Symptom:* Non-integer floating point targets (e.g. `42.5`) could be partially parsed by `parseInt`.
   - *Fix:* Added explicit `!Number.isInteger(newVal)` check in `SearchLab.tsx` `handleTargetCommit`.

---

## 18. Final Full-Suite Test Execution Results

```text
Test Files  31 passed (31)
     Tests  214 passed (214)
  Duration  140.48s
```

All 31 test suites and 214 automated tests passed with a 100% pass rate.

---

## 19. Final Production Build & TypeScript Verification

```text
> npm run typecheck
tsc --noEmit (Exit Code 0 — 0 errors)

> npm run build
vite v8.3.5 building client environment for production...
✓ 81 modules transformed.
dist/index.html                                    0.49 kB │ gzip:   0.32 kB
dist/assets/index-Bg_Cwofg.css                    42.63 kB │ gzip:   7.29 kB
dist/assets/__vite-browser-external-cjWwuEFt.js    0.09 kB │ gzip:   0.10 kB
dist/assets/index-CivxPR-1.js                    348.18 kB │ gzip: 104.51 kB
✓ built in 773ms
```

---

## 20. Original Repository Safety Confirmation

```text
$ git -C "c:\Users\vishv\OneDrive\Desktop\DS MINI PROJECT\sortlens" status
On branch v2
nothing to commit, working tree clean
```
The original `sortlens` repository remains 100% untouched.

---

## 21. Final Verdict

**PHASE 8 PASS — READY FOR PHASE 9 (FINAL RELEASE READINESS, DOCUMENTATION PACKAGING & DEMONSTRATION SIGN-OFF)**
