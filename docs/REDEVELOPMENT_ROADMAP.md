# SortLens Redevelopment Roadmap

This roadmap defines the implementation contract across all 10 phases of the SortLens redevelopment.
Each phase has explicit objectives, prerequisites, deliverables, automated test requirements, acceptance gates, and exclusions.

---

## Phase 0 — Workspace and Baseline Verification (COMPLETED & VERIFIED)

* **Objective:** Establish an independent, modern development workspace; preserve historical algorithmic assets without altering the original repository; verify native C99 execution and calibration accuracy; configure frontend toolchain with initial tests.
* **Dependencies:** Original `sortlens/` repository (read-only), MinGW-w64 GCC, Node.js, npm, Git.
* **Deliverables:**
  * Sibling workspace `sortlens-rebuild/` with independent Git repository.
  * Verified identical copies of all C99 core sources, headers, tests, calibration tools, and reference documentation.
  * `docs/SOURCE_MANIFEST.md` with SHA-256 binary validation.
  * Successful compilation and execution of native test suite (`test_core.exe`) and calibration harness (`calibrate.exe`).
  * Modern frontend setup (React 19, TypeScript 7 strict, Vite 8, Zustand, Motion, Vitest, Testing Library).
  * Minimal placeholder application and automated rendering test.
  * `docs/decisions/ADR-0001-target-architecture.md`, `docs/REDEVELOPMENT_ROADMAP.md`, and `docs/PHASE0_REPORT.md`.
* **Mandatory Automated Tests:**
  1. Native C99 test suite (`6/6` passes).
  2. Native calibration accuracy benchmark (`>= 85%`, achieved `96.50%`).
  3. Frontend placeholder rendering and telemetry tests via Vitest.
  4. Strict TypeScript type check (`tsc --noEmit`).
  5. Vite static production build (`vite build`).
* **Acceptance Criteria:** Original repository completely clean and unmodified; all tests pass; build succeeds without errors.
* **Explicit Exclusions:** No sorting UI, no arena implementation, no canvas rendering, no WASM bridge binding, no backend services, no gamification.

---

## Phase 1 — Core and WebAssembly Integration (COMPLETED & VERIFIED)

* **Objective:** Bridge the verified C99 core to TypeScript via WebAssembly. Deliver a strictly typed, promise-based API adapter that wraps all C functions with runtime safety checks.
* **Dependencies:** Phase 0 completion; `src/core/wasm/core.js` artifact or Emscripten SDK (`emcc`) if recompilation is required.
* **Deliverables:**
  * Typed WASM loader and lifecycle manager (`src/core/wasm/loader.ts`).
  * Type-safe domain models for array shape analysis, sort traces, event queues, hash table structures, and search steps (`src/core/types.ts`).
  * TypeScript API wrapper (`src/core/wasm/adapter.ts`) replacing legacy `coreApi.js`.
  * Parity test suite verifying that WASM outputs match native C test suite results for identical inputs.
* **Mandatory Automated Tests:**
  1. WASM initialization and module ready promise resolution.
  2. Parity tests for all 5 sorting algorithms (comparisons, writes, sorted output).
  3. Mathematical invariant tests matching native assertions (Selection sort $n(n-1)/2$, Bubble sorted $n-1$, etc.).
  4. Hash table collision and chain traversal verification.
  5. Search step generation verification (Linear and Binary search).
* **Acceptance Criteria:** TypeScript unit tests invoke WASM functions directly and produce identical numbers to the native C baseline.
* **Explicit Exclusions:** UI components, Canvas rendering, state store wiring, playback controls.

---

## Phase 2 — Playback Engine (COMPLETED & VERIFIED)

* **Objective:** Implement a deterministic, decoupled playback engine capable of advancing, seeking, stepping, pausing, and reversing animation frames without triggering React re-renders.
* **Dependencies:** Phase 1 typed WASM adapter.
* **Deliverables:**
  * Type contracts and frame snapshot models (`src/engine/types.ts`).
  * Reversible delta replay engine with inverse delta calculation (`src/engine/frameReplay.ts`).
  * Sparse checkpointing store with bounded-time seeking (`src/engine/FrameStore.ts`).
  * Decoupled animation frame clock with tab-suspension protection (`src/engine/PlaybackClock.ts`).
  * Single-lane deterministic playback controller (`src/engine/TracePlayer.ts`).
  * 5-algorithm multi-lane race coordinator (`src/engine/RaceCoordinator.ts`).
  * Public barrel API (`src/engine/index.ts`).
  * Architecture and testing documentation (`docs/PLAYBACK_ENGINE_DESIGN.md`, `docs/PLAYBACK_ENGINE_TESTING.md`, `docs/PHASE2_REPORT.md`).
* **Mandatory Automated Tests (29 engine tests, 71 total):**
  1. Unit tests for all 8 trace opcodes forward and reverse with round-trip identity (`eventReplay.test.ts`).
  2. Sparse checkpoint boundary crossing, sequential stepping, and seek clamping (`frameStore.test.ts`).
  3. Timing accumulator, speed control, and tab-suspension capping (`playbackClock.test.ts`).
  4. Single-lane state machine, subscription notifications, seek, and auto-restart (`tracePlayer.test.ts`).
  5. 5-lane concurrency with live WASM traces, counter parity, and lockstep replay (`raceCoordinator.test.ts`).
  6. Sub-millisecond seek latency benchmark (< 5ms) and checkpoint memory bounds (< 50 KB) (`performance.test.ts`).
* **Acceptance Criteria:** Playback engine scrubs bidirectionally through all 5 algorithms without state corruption, memory bloat, or counter desynchronization.
* **Explicit Exclusions:** Canvas visual styling, lane layouts, final UI skins (deferred to Phase 4).

---

## Phase 3 — Design System and Application Shell (COMPLETED & VERIFIED)

* **Objective:** Build the engineering-lab visual foundation, dark graphite surfaces, typography, responsive grid, telemetry banners, and navigation workbench.
* **Dependencies:** Phase 0 CSS variables, Phase 1 WASM adapter, Phase 2 Playback Engine.
* **Deliverables:**
  * Design tokens in `src/styles/tokens.css` (graphite surfaces `#0c0d11` to `#252937`, borders, purposeful telemetry accents, accessible focus ring).
  * Global and component stylesheets (`src/styles/global.css`, `src/styles/components.css`, `src/styles/shell.css`).
  * Reusable UI primitives (`Button`, `IconButton`, `Badge`, `Panel`, `Tooltip`, `SectionHeading`, `EngineStatusBadge`, `CoreDiagnosticPanel`).
  * Application shell layout (`AppShell.tsx`, `AppHeader.tsx`, `PrimaryNavigation.tsx`, `WorkspaceFrame.tsx`).
  * Zustand UI state store (`src/state/appStore.ts`) decoupling navigation and dataset controls ($N \in [2, 100]$) from high-frequency playback ticks.
  * Honest navigation between the 5 syllabus modules with exact syllabus invariants.
  * Comprehensive documentation (`docs/DESIGN_SYSTEM.md`, `docs/APP_SHELL_ARCHITECTURE.md`, `docs/PHASE3_REPORT.md`).
* **Mandatory Automated Tests (19 Phase 3 tests, 90 total across 13 suites):**
  1. Component rendering tests for Shell, Dataset bar, and Telemetry cards (`AppShell.test.tsx`).
  2. UI component library unit tests (`UIComponents.test.tsx`).
  3. Zustand state store transitions and array-size clamping to `[2, 100]` (`appStore.test.ts`).
  4. Accessible keyboard navigation and mobile drawer toggle tests.
  5. Integration with live WebAssembly core (`App.test.tsx`).
* **Acceptance Criteria:** Responsive layout operates smoothly across desktop, tablet, and mobile; strictly follows lab-telemetry aesthetic; zero gamification elements; zero regression of Phase 1 or 2 tests.
* **Explicit Exclusions:** Sorting lane Canvas rendering (deferred to Phase 4).

---

## Phase 4 — Sorting Arena (COMPLETED & VERIFIED)

* **Objective:** Implement the multi-lane sorting arena with synchronized Canvas 2D renderers for all 5 algorithms, playback controls, dataset generators, and live telemetry instrumentation.
* **Dependencies:** Phase 2 Playback Engine, Phase 3 Design System.
* **Deliverables:**
  * High-performance Canvas 2D sorting lane component (`src/components/arena/CanvasLane.tsx`).
  * Pure geometry and layout calculator (`src/components/arena/canvas/calculateBarLayout.ts`) and pure canvas drawer (`src/components/arena/canvas/drawLane.ts`).
  * Event visualizers for `EV_COMPARE`, `EV_SWAP`, `EV_WRITE`, `EV_PIVOT`, `EV_RANGE`, and `EV_DONE`.
  * Multi-lane orchestrator rendering Bubble, Selection, Insertion, Quick, and Merge sorts concurrently (`src/components/arena/SortingArena.tsx`).
  * Dedicated Call Stack depth indicator for Quick and Merge sorts.
  * High-DPI (`devicePixelRatio`) canvas scaling and responsive container resizing.
  * Full playback toolbar (`src/components/arena/RaceToolbar.tsx`) with Play/Pause, Step Forward/Backward, Restart, timeline scrubber, and speed selector.
  * Dataset controls (`src/components/arena/DatasetControls.tsx`) with size slider ($N \in [2, 100]$), pattern generator chips, and custom array input validation.
  * Mulberry32 PRNG and dataset generator (`src/core/dataset/generator.ts`).
  * Full documentation (`docs/SORTING_ARENA_DESIGN.md`, `docs/ARENA_INTEGRATION.md`, `docs/PHASE4_REPORT.md`).
* **Mandatory Automated Tests (33 Phase 4 tests, 123 total across 17 suites):**
  1. Pure geometry layout and label suppression tests (`calculateBarLayout.test.ts`).
  2. PRNG determinism, pattern monotonicity, size bounds, and custom input parsing tests (`datasetGenerator.test.ts`).
  3. Interactive arena orchestration, controls, scrubber seeking, speed changes, and validation tests (`sortingArena.test.tsx`).
  4. 100% operation counter and sorted array parity tests against C core on final race frame (`telemetryParity.test.ts`).
* **Acceptance Criteria:** All five sorting lanes animate smoothly and in perfect synchrony; bar highlights accurately reflect compare/swap operations; call stack reflects recursion depth; zero regression across all 123 automated tests.
* **Explicit Exclusions:** Final prediction verdict modal (Phase 5), Search Lab (Phase 6).

---

## Phase 5 — Analysis and Results (COMPLETED & VERIFIED)

* **Objective:** Implement pre-run dataset shape analysis, closed-form empirical cost-model predictions, an interactive 11-bucket separate-chaining hash table visualization, post-run race scoreboard, and academic prediction verdicts.
* **Dependencies:** Phase 1 WASM analyzer, Phase 4 Sorting Arena.
* **Deliverables:**
  * Shape analysis dashboard (`src/components/analysis/ShapeAnalysisPanel.tsx`): Inversions ($I$), inversion ratio ($r$) with visual SVG gauge, max leftward displacement ($p$), distinct count, duplicate ratio ($d$), and syllabus notes.
  * 11-bucket separate chaining hash table visualization (`src/components/analysis/HashTableVisualization.tsx`): $h(k) = k \pmod{11}$, chain lengths, key chips, collision counter, and clustering warnings.
  * Cost-model prediction panel (`src/components/analysis/PredictionPanel.tsx`): Closed-form operation estimates across all 5 algorithms, C rationale explanation, and zero-leakage hypothesis toggle.
  * Dedicated full analysis view (`src/components/analysis/AnalysisView.tsx`) accessible via primary navigation.
  * Post-race scoreboard (`src/components/results/Scoreboard.tsx`): Zero outcome leakage before full race completion, verified final comparisons, writes, total operations, recursion depth, and honest tie rankings (`T-1`, `T-2`).
  * Empirical prediction verdict banner (`src/components/results/PredictionVerdict.tsx`): `PREDICTION CONFIRMED`, `PREDICTION MISSED`, `INCONCLUSIVE (TIE)`, or `VERDICT UNAVAILABLE` with academic honesty explanations.
  * Judging criterion reactive switching (`JUDGE_COMPARISONS`, `JUDGE_WRITES`, `JUDGE_TOTAL`).
  * Documentation (`docs/ANALYSIS_AND_PREDICTION.md`, `docs/RESULTS_AND_SCORING.md`, `docs/PHASE5_REPORT.md`).
* **Mandatory Automated Tests (24 Phase 5 tests, 148 total across 21 suites):**
  1. Shape metrics and 11-bucket hash table invariant tests (`tests/analysis/shapeAnalysis.test.ts`).
  2. Cost-model estimates, formula accuracy, and zero DOM leakage tests (`tests/analysis/predictionModel.test.tsx`).
  3. Scoreboard concealment, ranking, honest tie handling, and verdict banner tests (`tests/results/scoreboardAndVerdict.test.tsx`).
  4. Full end-to-end user workflow integration tests (`tests/integration/phase5Integration.test.tsx`).
* **Acceptance Criteria:** Analysis and prediction metrics strictly mirror verified C core calculations; zero DOM or attribute leakage before user reveal or race completion; all 148 automated tests pass.
* **Explicit Exclusions:** Search Lab, Scaling Lab (Phase 6).

---

## Phase 6 — Supporting Labs (COMPLETED & VERIFIED)

* **Objective:** Implement the Search Lab (Linear vs. Binary search comparison), Empirical Scaling Lab, and Viva Demo Mode.
* **Dependencies:** Phase 4 Arena, Phase 5 Analysis.
* **Deliverables:**
  * Search Lab (`src/components/search/SearchLab.tsx`, `SearchVisualizer.tsx`, `SearchStepPlayer.ts`): Target selector, quick targets, deterministic step player, verified C sorted search buffer synchronization, and algorithmic advantage takeaway.
  * Empirical Scaling Lab (`src/components/scaling/ScalingLab.tsx`, `ScalingChart.tsx`, `ScalingDataTable.tsx`, `ScalingBenchmark.ts`): Live C benchmarks across sizes $N \in [10, 100]$ (`recordTrace = false`), interactive SVG chart with solid empirical curves, dashed asymptotic references, dotted cost model predictions, log scale toggle, and accessible data table.
  * Dedicated Viva Demo Mode (`src/features/viva/VivaDemoController.ts`, `VivaDemoBar.tsx`, `VivaDemoView.tsx`): 10-stage scripted 92-second academic tour, floating demonstration bar, multi-subscriber controller, and comprehensive examiner study guide.
  * Lab styles (`src/styles/labs.css`) and workspace integration (`src/components/layout/WorkspaceFrame.tsx`).
  * Documentation (`docs/SEARCH_LAB.md`, `docs/SCALING_LAB.md`, `docs/VIVA_DEMO.md`, `docs/PHASE6_REPORT.md`).
* **Mandatory Automated Tests (18 Phase 6 tests, 166 total across 25 suites):**
  1. Search Lab linear and binary search steps, parity, and visualizer tests (`tests/search/searchLab.test.tsx`).
  2. Scaling benchmark engine, quadratic vs linearithmic growth, and chart UI tests (`tests/scaling/scalingLab.test.tsx`).
  3. Viva demo controller stage progression, pause/resume, and appStore sync tests (`tests/viva/vivaDemo.test.ts`).
  4. Full end-to-end multi-lab integration tests (`tests/integration/phase6Integration.test.tsx`).
* **Acceptance Criteria:** Search Lab accurately visualizes search step intervals with zero index desynchronization; Scaling Lab plots real C counts; Viva Demo Mode provides reliable scripted 10-stage tour; all 166 automated tests pass.
* **Explicit Exclusions:** LocalStorage persistence, release packaging (Phase 7 & 9).

---

## Phase 7 — Persistence and Polish (COMPLETED & VERIFIED)

* **Objective:** Add reliable local history persistence, accessible controls, keyboard shortcuts, and telemetry polish.
* **Dependencies:** Phases 1–6.
* **Deliverables:**
  * Schema-versioned persistence subsystem (`src/state/persistence/schema.ts`, `storage.ts`, `runHelper.ts`, `index.ts`) supporting preferences hydration and bounded 200-run telemetry history with automatic `QuotaExceededError` recovery.
  * System-wide keyboard shortcut hook and delegate registry (`src/hooks/useKeyboardShortcuts.ts`) supporting Space, Arrows, Home, 1-5 section jumps, ?, H, and Esc with strict form input suppression.
  * Accessible Keyboard Shortcuts Modal (`src/components/ui/KeyboardShortcutsModal.tsx`) and Telemetry History Modal (`src/components/history/HistoryModal.tsx`) with JSON export and clear confirmation.
  * LiveAnnouncer polite screen reader live region (`src/components/ui/LiveAnnouncer.tsx`, `src/state/announcer.ts`) and Canvas fallback text mirrors.
  * Documentation (`docs/PERSISTENCE.md`, `docs/KEYBOARD_SHORTCUTS.md`, `docs/ACCESSIBILITY_AUDIT.md`, `docs/PHASE7_REPORT.md`).
* **Mandatory Automated Tests (34 Phase 7 tests, 200 total across 30 suites):**
  1. Unit tests for preference persistence, history bounds (200 runs), quota recovery, and JSON export (`tests/persistence/storage.test.ts`).
  2. Keyboard shortcuts handling, numeric section jumps, and input field suppression (`tests/shortcuts/keyboardShortcuts.test.tsx`).
  3. History modal rendering, expandable lane breakdown table, and clear history flow (`tests/history/historyModal.test.tsx`).
  4. Accessibility live announcer, dialog semantics, and canvas fallback textual descriptions (`tests/accessibility/accessibility.test.tsx`).
  5. Full end-to-end integration across reload, run logging, modal interactions, and shortcut navigation (`tests/integration/phase7Integration.test.tsx`).
* **Acceptance Criteria:** Run history survives browser refresh; accessible keyboard navigation functions smoothly; all 200 automated tests pass; production build succeeds.
* **Explicit Exclusions:** Production deployment (Phase 9).


---

## Phase 8 — Regression and Acceptance Testing (COMPLETED & VERIFIED)

* **Objective:** Comprehensive end-to-end verification across edge cases, repeated runs, rapid seeking, and stress workloads.
* **Dependencies:** Phases 1–7 complete.
* **Deliverables:**
  * Automated regression suite covering edge cases: $n=0$, $n=1$, $n=2$, $n=100$, all-identical arrays, strictly reversed arrays, extreme duplicate arrays (`tests/regression/phase8Regression.test.tsx`).
  * Trace queue overflow stress test ($>30,000$ events) verifying safe degradation and history rejection.
  * Cross-runtime native C vs WASM parity audit (100% parity across test corpus).
  * 50 consecutive sorting runs verifying absence of coordinator degradation or memory leaks.
  * Search Lab target integer validation remediation.
  * Full-system acceptance matrix and regression audit documentation (`docs/PHASE8_ACCEPTANCE_MATRIX.md`, `docs/PHASE8_REGRESSION_REPORT.md`, `docs/PHASE8_REPORT.md`).
* **Mandatory Automated Tests (14 Phase 8 regression tests, 214 total across 31 suites):**
  1. Full suite of unit, integration, and E2E tests executing cleanly (31 test files, 214 tests, 100% pass rate).
  2. Zero memory leak assertion over 50 consecutive sorting runs.
  3. Edge case boundary validation for $N=0, 2, 100$, duplicates, and reversed arrays.
  4. Trace buffer overflow mitigation test.
  5. Native C99 test suite (`6/6`) and calibration benchmark (`96.50%` accuracy).
* **Acceptance Criteria:** 100% test pass rate; zero UI freezes; zero state desynchronization; verified production static preview.
* **Explicit Exclusions:** None.

---

## Phase 9 — Release Readiness (COMPLETED & VERIFIED)

* **Objective:** Package the application for static production hosting; verify build reproducibility; provide complete user, instructor, and viva defense documentation.
* **Dependencies:** Phase 8 sign-off.
* **Deliverables:**
  * Optimized production build artifact (`dist/`) and staged release package (`release/SortLens-static/`).
  * Compressed static distribution archive (`release/SortLens-static-v1.0.0.zip`).
  * Academic Viva Examination Guide with 35 authoritative Q&As (`release/ACADEMIC_VIVA_GUIDE.md`).
  * 11-stage Live Demonstration Runbook with recovery procedures (`release/VIVA_DEMONSTRATION_RUNBOOK.md`).
  * Release Notes (`release/RELEASE_NOTES.md`), Manifest with SHA-256 hashes (`release/RELEASE_MANIFEST.md`), and Static Hosting Guide (`release/RELEASE_README.md`).
  * Windows development and production batch scripts (`scripts/windows/run-dev.bat`, `build-release.bat`, `preview-release.bat`).
  * Real-browser automation suite exercising Workflows A through H via Edge CDP (`scripts/verify-browser-workflows.mjs`).
  * Release checklist and completion report (`docs/PHASE9_RELEASE_CHECKLIST.md`, `docs/PHASE9_REPORT.md`).
* **Mandatory Automated Tests:**
  1. Full automated Vitest suite (31 test files, 214 tests, 100% pass rate).
  2. Native C99 test suite (`6/6`) and calibration benchmark (`96.50%` accuracy).
  3. Native/WASM cross-runtime parity (100% exact match).
  4. Real-browser automation across all 8 workflows (100% pass in Microsoft Edge).
  5. Static production build and preview verification (`npm run build`, `npm run preview`).
* **Acceptance Criteria:** Application launches cleanly on static HTTP hosting; WebAssembly runtime initializes; all 8 browser workflows operate flawlessly; complete academic viva defense documentation delivered.
* **Explicit Exclusions:** None. Release complete.
