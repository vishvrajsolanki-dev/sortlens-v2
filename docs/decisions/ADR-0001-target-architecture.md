# ADR-0001: Target Architecture for SortLens Rebuild

**Status:** Approved  
**Date:** 2026-10-21  
**Author:** Senior Software Architect  
**Scope:** SortLens Rebuild Project  

---

## 1. Context & Problem Statement

SortLens is an educational engineering tool designed to analyze and visualize the empirical runtime complexity of five classical sorting algorithms (Bubble, Selection, Insertion, Lomuto Quick Sort, and Top-Down Merge Sort) as well as two search algorithms (Linear and Binary Search).

The legacy implementation suffered from:
1. Architectural conflation between algorithm execution and visual rendering in vanilla JavaScript.
2. Fragile state synchronization between playback controls, animations, and telemetry counters.
3. Distracting gamification mechanics (XP counters, streaks, cartoon mascot, confetti) that undermined its role as an academic telemetry laboratory.
4. Lack of strict type safety and modular isolation.

We require a modern, robust, maintainable architecture that preserves the academic rigor and verified algorithmic C99 core while delivering a responsive, high-performance browser interface.

---

## 2. Architectural Decisions

### Decision 1: Browser-Based Application
* **Choice:** Client-side web application running entirely in modern web browsers.
* **Rationale:** Maximizes accessibility for students, evaluators, and viva demonstrations. Eliminates installation friction and cloud deployment costs.
* **Hosting:** Static website hosting (e.g., GitHub Pages, Cloudflare Pages, Vercel static output, or any local static HTTP file server). Double-clicking `index.html` via `file://` protocol is explicitly unsupported due to browser WebAssembly and ES Module security boundaries; a local dev server or static web server is required.

### Decision 2: React 19 and TypeScript 7
* **Choice:** React 19 for component composition and TypeScript in strict mode for static typing.
* **Rationale:** Strict TypeScript provides end-to-end type safety across domain models, telemetry metrics, and WebAssembly boundary envelopes. Eliminates entire classes of null pointer and type-mismatch bugs.
* **Policy:** Zero tolerance for arbitrary `any` types in application code without documented C-interop boundary justification.

### Decision 3: Vite Toolchain
* **Choice:** Vite for development and production bundling.
* **Rationale:** Sub-second hot module replacement (HMR), standards-compliant ES module handling, fast Rollup-based production builds, and native Vitest integration.

### Decision 4: C99 / WebAssembly Core as the Single Authority
* **Choice:** Retain the verified C99 algorithmic engine compiled to WebAssembly via Emscripten.
* **Rationale:** The C99 codebase implements syllabus-exact algorithms (Course 102040304), rigorous counting rules, an array-based circular trace queue, an 11-bucket separate chaining hash table, an array-based call stack, and an empirical cost model. The C core is the sole source of algorithmic truth. The frontend never simulates sorting logic independently.

### Decision 5: Zustand for Application State Management
* **Choice:** Zustand for decoupled, slice-based state management.
* **Rationale:** Provides lightweight, un-opinionated state without context-provider wrapper hell or Redux boilerplate. Critical for separating high-frequency animation loops from React component render lifecycles.

### Decision 6: Canvas 2D for the Five Synchronized Sorting Lanes
* **Choice:** HTML5 Canvas 2D context for rendering sorting array elements, comparisons, swaps, writes, pivots, and active partition boundaries across all five lanes.
* **Rationale:** DOM-based bar elements (100 bars × 5 lanes = 500 DOM nodes updated 60 times/sec) cause layout thrashing, style recalculations, and dropped frames. Canvas 2D handles tens of thousands of primitive draws per frame effortlessly within a single `requestAnimationFrame` callback.

### Decision 7: Motion for React and Scoped CSS for Interface Shell
* **Choice:** Motion for React for structural dialogs, panels, and tab transitions, combined with clean custom CSS variables for dark graphite surfaces.
* **Rationale:** Maintains a disciplined, laboratory-grade visual design without bloating the bundle with heavy third-party UI component libraries.

### Decision 8: Decoupled Playback Engine Architecture
* **Choice:** The playback engine (ticker, frame buffer scrubbing, seek, pause, play, step forward/backward) must execute in a dedicated engine module independent of React renders.
* **Critical Constraint:** Animating at 60 FPS must **never** trigger full React component tree re-renders. 
  The architecture enforces strict separation of concerns across state domains:
  1. *Configuration & Dataset State:* Static array input, pattern, size, judge-by metric (React/Zustand).
  2. *Playback Control State:* Play/pause status, playback speed, loop toggle (Zustand reactive).
  3. *Frame Visual State:* Current frame index, active bars, highlighted indices (Transferred directly to Canvas renderer via ref / subscriber, bypassing React state).
  4. *Analysis Results:* Inversion counts, shape ratios, hash table buckets, model predictions (React state, computed once on dataset generation).
  5. *Race Results:* Final rank, actual comparisons/writes, prediction confirmation (React state, evaluated at race completion).
  6. *Persistent History:* Local storage cache of completed runs (Zustand persist slice).

### Decision 9: No Mandatory Backend or Database Server
* **Choice:** Pure client-side application.
* **Rationale:** The legacy Flask/SQLite backend added operational complexity without functional necessity. All shape analyses, predictions, sorts, and search routines run deterministically in C/WASM in milliseconds. History can be saved to browser `localStorage` where useful.

### Decision 10: Elimination of Gamification Features
* **Choice:** Completely remove XP points, streak counters, cartoon mascot, audio fanfare, and full-screen confetti.
* **Rationale:** SortLens is an engineering lab and telemetry analyzer. Gamification degraded the professional credibility of the tool during academic defense and viva presentations.

### Decision 11: Source Repository Immutability
* **Choice:** The original repository (`sortlens/`) remains strictly read-only and untouched. All rebuild activities occur in `sortlens-rebuild/`.
* **Rationale:** Protects historical baseline assets, commits, and configurations against regression or accidental corruption.

---

## 3. Unresolved Risks & Mitigations

| Risk | Severity | Mitigation Strategy | Planned Phase |
| :--- | :--- | :--- | :--- |
| **Trace Queue Overflow on Large Arrays** | High | `MAX_EVENTS` is currently 30,000 in C core. Worst-case Bubble sort on $n=100$ reversed array generates ~10,000 events. If exceeded, the C core sets `overflow=1`. Phase 1 must verify overflow boundaries and Phase 2 must provide graceful truncation or chunked capture. | Phase 1 & 2 |
| **WASM Loading Asynchrony & SSR/Vite Integration** | Medium | Emscripten's `-s SINGLE_FILE=1` bundle initializes asynchronously. A typed WebAssembly loader with explicit ready-state promises will wrap the module before exposing it to UI state. | Phase 1 |
| **Reverse Playback Frame Reconstruction** | Medium | The C trace queue logs forward delta events (`EV_COMPARE`, `EV_SWAP`, `EV_WRITE`). Stepping backward requires either computing inverse mutations or caching sparse snapshot checkpoints. | Phase 2 |
| **Canvas DPI Scaling on High-Density Displays** | Low | Implement device-pixel-ratio (`window.devicePixelRatio`) scaling for backing canvas buffers to guarantee crisp 1px borders and sharp telemetry numbers. | Phase 4 |

---

## 4. Verification & Validation Status

These architectural decisions represent the target blueprint for the rebuild. Performance claims, Canvas FPS stability, and memory footprints will be validated empirically against automated benchmarks in subsequent phases.
