# SortLens Rebuild

**SortLens** is an academic algorithmic sorting analyzer and telemetry laboratory built to explore the empirical runtime complexity of syllabus sorting and searching algorithms.

This repository is a ground-up modernization and rebuild of the SortLens frontend and architecture, preserving the verified C99 algorithmic engine while eliminating legacy state and interaction defects.

---

## 1. Project Status: Phase 9 Completed (Release Ready)

| Phase | Title | Status |
| :--- | :--- | :--- |
| **Phase 0** | **Workspace & Baseline Verification** | **COMPLETED & VERIFIED** |
| **Phase 1** | **Core & WebAssembly Integration** | **COMPLETED & VERIFIED** |
| **Phase 2** | **Playback Engine** | **COMPLETED & VERIFIED** |
| **Phase 3** | **Design System & Application Shell** | **COMPLETED & VERIFIED** |
| **Phase 4** | **Sorting Arena (5 Synchronized Lanes)** | **COMPLETED & VERIFIED** |
| **Phase 5** | **Analysis, Predictions & Scoreboard** | **COMPLETED & VERIFIED** |
| **Phase 6** | **Supporting Labs (Search, Scaling, Viva)** | **COMPLETED & VERIFIED** |
| **Phase 7** | **Persistence, Keyboard Shortcuts & Polish** | **COMPLETED & VERIFIED** |
| **Phase 8** | **Regression & Acceptance Testing** | **COMPLETED & VERIFIED** |
| **Phase 9** | **Release Readiness & Academic Packaging** | **COMPLETED & VERIFIED** |


---

## 2. Completed Work

### Phase 0: Workspace & Baseline
1. **Independent Workspace:** Initialized `sortlens-rebuild/` without modifying the original repository (`sortlens/`).
2. **C99 Source Preservation:** Migrated all 8 modular C99 core files into `src/core/c/`, with 100% binary hash verification (`docs/SOURCE_MANIFEST.md`).
3. **Native C99 Test Verification:** Compiled and executed `tests/c/test_core.c` with MinGW GCC 15.2.0; all 6 test suites passed.
4. **Empirical Calibration Verification:** Compiled and executed `tools/calibrate.c` on 1,000 synthetic arrays; verified **96.50%** prediction accuracy (exceeding 85% requirement).
5. **Modern Frontend Toolchain:** Established React 19, TypeScript 7 (strict mode), Vite 8, Zustand 5, Motion, Vitest, and React Testing Library.

### Phase 1: WebAssembly Integration & Native Parity
1. **Universal WASM Loader:** Built `src/core/adapter/loader.ts` enabling seamless cross-runtime initialization in both browser (Vite) and Node/JSDOM (Vitest).
2. **Typed API Adapter:** Implemented `CoreClient` wrapping all 33 C99 exports with strict input validation, BigInt normalization, and C-string decoding.
3. **Native Parity Verification:** Compiled native reference harness `tests/c/parity_harness.c` and proved **100% exact parity** across all 5 sorting algorithms and search routines.
4. **Interactive Diagnostic Console:** Updated `src/app/App.tsx` with live WASM execution workbench for real-time shape analysis and sorting.
5. **Core Contracts:** Published `docs/CORE_API_CONTRACT.md`, `docs/WASM_VERIFICATION.md`, `docs/TRACE_CONTRACT.md`, and `docs/PHASE1_REPORT.md`.

### Phase 2: Playback Engine & Reversible Event Replay
1. **Reversible Replay Engine:** Built pure delta transitions in `src/engine/frameReplay.ts` supporting bidirectional navigation across all 8 trace opcodes.
2. **Sparse Checkpointed Frame Store:** Implemented `src/engine/FrameStore.ts` with interval-50 checkpoints, delivering sub-millisecond (< 0.2ms) arbitrary seeks and bounded memory (< 50 KB).
3. **Decoupled Animation Timing:** Implemented `src/engine/PlaybackClock.ts` decoupling screen refresh rates (60–144 Hz) from simulation speeds (1–1000 events/sec), protected against background tab freezes.
4. **Single-Lane Controller:** Built `src/engine/TracePlayer.ts` state machine with subscriber notifications, step navigation, and auto-restart.
5. **Multi-Lane Arena Coordinator:** Built `src/engine/RaceCoordinator.ts` orchestrating all 5 syllabus algorithms in parallel with independent lane completion and synchronized seeking.
6. **Engine Verification:** Delivered 6 automated test suites (29 tests) bringing total automated tests to **71/71 passing**; published `docs/PLAYBACK_ENGINE_DESIGN.md`, `docs/PLAYBACK_ENGINE_TESTING.md`, and `docs/PHASE2_REPORT.md`.

### Phase 3: Design System & Responsive Application Shell
1. **Design Tokens & System:** Established comprehensive dark graphite tokens (`src/styles/tokens.css`), typography hierarchy, and purposeful telemetry accents.
2. **UI Component Library:** Implemented accessible `Button`, `IconButton`, `Badge`, `Panel`, `Tooltip`, `SectionHeading`, and `EngineStatusBadge` primitives.
3. **Responsive Application Shell:** Built `AppShell`, `AppHeader`, `PrimaryNavigation`, and `WorkspaceFrame` supporting desktop, tablet, and mobile off-canvas drawer.
4. **Zustand State Architecture:** Built `src/state/appStore.ts` managing navigation and dataset parameters ($N \in [2, 100]$) while isolating high-frequency playback ticks.
5. **Phase 3 Verification:** Added 3 test suites (19 new tests) reaching **90/90 passing tests** across 13 suites; published `docs/DESIGN_SYSTEM.md`, `docs/APP_SHELL_ARCHITECTURE.md`, and `docs/PHASE3_REPORT.md`.

### Phase 4: Five-Lane Sorting Arena, Canvas 2D Graphics & Telemetry
1. **Canvas 2D Rendering Engine:** Built pure layout geometry calculator (`calculateBarLayout.ts`) and pure canvas drawer (`drawLane.ts`) supporting DPR retina scaling, active partition range shading, and label suppression for $N > 25$.
2. **Five Synchronized Lanes:** Implemented `CanvasLane.tsx` mounting 5 concurrent algorithm lanes (Bubble, Selection, Insertion, Quick, Merge) with live telemetry HUDs (comparisons, writes, recursion stack depth) and responsive `ResizeObserver`.
3. **Playback & Telemetry Toolbar:** Built `RaceToolbar.tsx` offering Play/Pause, Step Forward/Backward, Restart (Step 0), scrub slider, and speed multiplier (1–1000 ev/s).
4. **Dataset Configuration:** Built `DatasetControls.tsx` and `generator.ts` with Mulberry32 PRNG supporting 5 input patterns and custom comma-separated array validation ($N \in [2, 100]$, values $1..99$).
5. **Phase 4 Verification:** Added 4 test suites (33 new tests) reaching **123/123 passing tests** across 17 suites; published `docs/SORTING_ARENA_DESIGN.md`, `docs/ARENA_INTEGRATION.md`, and `docs/PHASE4_REPORT.md`.

### Phase 5: Dataset Shape Analysis, Predictions, Scoreboard & Verdicts
1. **Dataset Shape Analysis:** Built `ShapeAnalysisPanel.tsx` displaying Inversions ($I$), inversion ratio ($r$) gauge, max leftward displacement ($p$), distinct count, duplicate ratio ($d$), and syllabus notes.
2. **11-Bucket Hash Table Visualization:** Built `HashTableVisualization.tsx` depicting division hashing ($h(k) = k \pmod{11}$), chain distribution, key chips, and collision metrics.
3. **Empirical Cost-Model Predictions:** Built `PredictionPanel.tsx` with closed-form estimates across all 5 algorithms, C rationale explanation, and zero-leakage hypothesis toggle.
4. **Post-Race Scoreboard & Verdicts:** Built `Scoreboard.tsx` and `PredictionVerdict.tsx` featuring zero outcome leakage prior to race completion, verified final operations, call stack depth, honest tie rankings (`T-1`, `T-2`), and academic verdicts (`CONFIRMED`, `MISSED`, `INCONCLUSIVE`, `UNAVAILABLE`).
5. **Phase 5 Verification:** Added 4 test suites (25 new tests) reaching **148/148 passing tests** across 21 suites; published `docs/ANALYSIS_AND_PREDICTION.md`, `docs/RESULTS_AND_SCORING.md`, and `docs/PHASE5_REPORT.md`.

### Phase 6: Supporting Labs (Search, Scaling, and Viva Demo Mode)
1. **Search Laboratory:** Built `SearchLab.tsx`, `SearchVisualizer.tsx`, and `SearchStepPlayer.ts` featuring verified C search buffer synchronization, target selection ($1..99$), and side-by-side comparison between Linear ($O(n)$) and Binary ($O(\log n)$) search.
2. **Empirical Scaling Lab:** Built `ScalingLab.tsx`, `ScalingChart.tsx`, `ScalingDataTable.tsx`, and `ScalingBenchmark.ts` executing actual C algorithm runs across $N \in [10, 100]$ (`recordTrace = 0`), rendering solid empirical curves, dashed asymptotic references, and dotted cost model predictions.
3. **Automated Viva Demo Mode:** Built `VivaDemoController.ts`, `VivaDemoBar.tsx`, and `VivaDemoView.tsx` with a 10-stage 92-second academic tour, floating control bar, observer subscriptions, and university examiner study guide.
4. **Phase 6 Verification:** Added 4 test suites (18 new tests) reaching **166/166 passing tests** across 25 suites; published `docs/SEARCH_LAB.md`, `docs/SCALING_LAB.md`, `docs/VIVA_DEMO.md`, and `docs/PHASE6_REPORT.md`.

### Phase 7: Local Persistence, Keyboard Shortcuts, Accessibility & Polish
1. **Schema-Versioned Persistence Subsystem:** Implemented `src/state/persistence/` with `StoredPreferences` (version 1) and `CompletedRunRecord` (version 1), featuring automatic QuotaExceeded recovery and invalid JSON fallbacks.
2. **Telemetry History & Bounded Retention:** Records verified 5-lane completed runs with zero trace overflows (bounded at 200 runs), expandable operation tables, and JSON report export.
3. **Global Keyboard Shortcuts & Input Suppression:** Implemented `src/hooks/useKeyboardShortcuts.ts` (<kbd>Space</kbd>, <kbd>→</kbd>, <kbd>←</kbd>, <kbd>Home</kbd>, <kbd>1</kbd>–<kbd>5</kbd>, <kbd>?</kbd>, <kbd>H</kbd>, <kbd>Esc</kbd>) with strict typing suppression in input fields.
4. **WCAG 2.2 AA Accessibility Refinements:** Integrated `LiveAnnouncer.tsx` with polite throttled screen reader announcements, Canvas `role="img"` with dynamic labels and `.sl-sr-only` mirror text, `:focus-visible` styling, and `@media (prefers-reduced-motion: reduce)` support.
5. **Phase 7 Verification:** Added 5 test suites (34 new tests) reaching **200/200 passing tests** across 30 suites; published `docs/PERSISTENCE.md`, `docs/KEYBOARD_SHORTCUTS.md`, `docs/ACCESSIBILITY_AUDIT.md`, and `docs/PHASE7_REPORT.md`.

### Phase 8: Full-System Regression & Release Acceptance Testing
1. **Source Preservation Audit:** Verified 100% SHA-256 match on all 8 preserved C99 source files (`docs/SOURCE_MANIFEST.md`); original `sortlens` repository remains clean on branch `v2`.
2. **Native C99 Verification & Parity:** Confirmed 6/6 native C test suites pass and calibration achieves 96.50% prediction accuracy; verified 100% exact event and counter parity between native C and WebAssembly.
3. **Automated Regression & Stress Suite:** Built `tests/regression/phase8Regression.test.tsx` verifying $N=2, 100$, all-identical arrays, reversed arrays, extreme duplicate arrays, custom input parsing rejection, trace queue overflow rejection, and 50 consecutive runs without memory leak or performance degradation.
4. **Defect Remediation:** Enforced strict integer validation in `SearchLab.tsx` to reject decimal and non-numeric inputs.
5. **Phase 8 Verification:** Reached **214/214 passing tests** across 31 test suites, verified sub-second production static build (773ms) and local HTTP preview; published `docs/PHASE8_ACCEPTANCE_MATRIX.md`, `docs/PHASE8_REGRESSION_REPORT.md`, and `docs/PHASE8_REPORT.md`.

### Phase 9: Release Readiness, Static Packaging & Academic Viva Delivery
1. **Static Production Distribution:** Built and staged clean static distribution package in `release/SortLens-static/` containing `index.html`, `assets/`, and `wasm/core.js`, alongside compressed archive `release/SortLens-static-v1.0.0.zip` (133 kB).
2. **Real-Browser Verification Suite:** Implemented `scripts/verify-browser-workflows.mjs` verifying all 8 end-to-end browser workflows (A–H) in headless Microsoft Edge via CDP with 100% pass rate.
3. **Windows Development & Launch Scripts:** Delivered `scripts/windows/run-dev.bat`, `build-release.bat`, and `preview-release.bat` with automated prerequisite checking.
4. **Academic Viva Defense Handbook:** Authored comprehensive `release/ACADEMIC_VIVA_GUIDE.md` covering architecture, counting rules, shape analysis, data structures, and **35 authoritative examiner Q&As** with source code references.
5. **Live Demonstration Runbook:** Authored `release/VIVA_DEMONSTRATION_RUNBOOK.md` providing an 11-stage, 10–12 minute live evaluation presentation sequence with immediate recovery procedures.
6. **Release Governance & Audit:** Authored `release/RELEASE_NOTES.md`, `release/RELEASE_MANIFEST.md`, `release/RELEASE_README.md`, `docs/PHASE9_RELEASE_CHECKLIST.md`, and `docs/PHASE9_REPORT.md`.

---


## 3. Technology Stack

* **Algorithmic Core:** C99 (`core/sorts.c`, `analyzer.c`, `hashtable.c`, `stack.c`, `trace.c`, `search.c`, `api.c`)
* **Core Bridge:** WebAssembly (Emscripten compilation target)
* **Frontend Framework:** React 19 + TypeScript 7
* **Build System & Dev Server:** Vite 8
* **State Management:** Zustand 5
* **Animation Framework:** Motion for React + Canvas 2D for sorting lanes
* **Testing:** Vitest + React Testing Library + Native GCC test runner
* **Styling:** Custom CSS with dark graphite laboratory design tokens

---

## 4. Development & Testing Commands

### Prerequisites
* Node.js v20+ (tested on v24.12.0)
* npm v10+ (tested on v11.6.2)
* GCC with C99 support (e.g., MinGW-w64 GCC 15.2.0)

### Frontend Development
```bash
# Start local development server with Hot Module Replacement
npm run dev

# Run TypeScript type check
npm run typecheck

# Run automated frontend unit & integration tests
npm run test

# Run real-browser automation verification suite (Edge / Chrome via CDP)
npm run test:browser

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

### Windows Batch Helpers (`scripts/windows/`)
* **`scripts\windows\run-dev.bat`**: Prerequisite checks & development server launch.
* **`scripts\windows\build-release.bat`**: Full typecheck, test suite, production build, and staging to `release/SortLens-static/`.
* **`scripts\windows\preview-release.bat`**: Production static preview launcher.

### Native C99 Verification
```bash
# Compile and run native C core test suite
npm run test:native

# Compile and run empirical cost-model calibration benchmark
npm run calibrate:native

# Compile native reference harness and run native/WASM parity tests
npm run test:parity
```

---

## 5. Academic Documentation & Release Package

* **[`release/ACADEMIC_VIVA_GUIDE.md`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/release/ACADEMIC_VIVA_GUIDE.md)**: Comprehensive viva defense guide with Sections A–L and **35 authoritative examiner Q&As** with source code references.
* **[`release/VIVA_DEMONSTRATION_RUNBOOK.md`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/release/VIVA_DEMONSTRATION_RUNBOOK.md)**: 11-stage, 10–12 minute live presentation sequence with recovery steps.
* **[`release/RELEASE_NOTES.md`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/release/RELEASE_NOTES.md)**: Production release notes, feature highlights, and known limitations.
* **[`release/RELEASE_MANIFEST.md`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/release/RELEASE_MANIFEST.md)**: Exact build hashes, test metrics, and environment specifications.
* **[`release/RELEASE_README.md`](file:///c:/Users/vishv/OneDrive/Desktop/DS%20MINI%20PROJECT/sortlens-rebuild/release/RELEASE_README.md)**: Static deployment instructions for local and cloud web servers.

---

## 6. Architectural Principles

* **Single Authority:** All sorting, counting, shape analysis, duplicate detection, and search operations run strictly in C99 / WebAssembly.
* **No Gamification:** Free of XP points, streak counters, mascots, sounds, or confetti.
* **Decoupled Playback:** Visual animation updates bypass full React component re-renders to guarantee steady 60 FPS performance.
* **Zero Backend Requirement:** Operates entirely client-side, fully compatible with static website hosting.

