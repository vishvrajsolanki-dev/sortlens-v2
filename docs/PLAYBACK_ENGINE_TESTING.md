# SortLens Rebuild — Phase 2 Playback Engine Verification & Testing

## 1. Test Architecture Overview

Phase 2 testing verifies that algorithm event streams recorded by the C99 WebAssembly core are converted into exact, reversible visual states and synchronized across the 5 sorting lanes without timing drift, memory degradation, or operation-counter divergence.

The test suite consists of 6 dedicated suites covering 29 new tests across the engine layer, complementing the 39 tests in the core and diagnostic layers:

```
src/engine/test/
├── eventReplay.test.ts      (9 tests)  — Discrete event transitions & bidirectional reversibility
├── frameStore.test.ts       (5 tests)  — Sparse checkpointing, sequential stepping & timeline seeking
├── playbackClock.test.ts    (6 tests)  — Timing accumulator, speed control & tab-suspension protection
├── tracePlayer.test.ts      (5 tests)  — Single-lane player state machine & listener notifications
├── raceCoordinator.test.ts  (5 tests)  — 5-lane concurrency with live WASM traces & lockstep replay
└── performance.test.ts      (2 tests)  — Latency benchmarks (< 5ms seek) & checkpoint memory bounds
```

---

## 2. Test Suites and Coverage Breakdown

### 2.1 Event Reversal and Delta Transitions (`eventReplay.test.ts`)
- **Initial State Isolation**: Verifies that modifying active replay arrays does not mutate source datasets.
- **`EV_COMPARE` (1)**: Validates incrementing comparisons on forward step and decrementing on reverse step; verifies zero array mutations.
- **`EV_SWAP` (2)**: Validates swapping indices `a` and `b`, adding 2 writes on forward step, and restoring original positions with write counter reduction on reverse step.
- **`EV_WRITE` (3)**: Validates using payload field `c` (`old_val`) to execute exact O(1) backwards restoration without array snapshots.
- **`EV_PIVOT` (4) & `EV_RANGE` (5)**: Validates active pivot and subarray range boundary markers forward and backward.
- **`EV_PUSH` (6) & `EV_POP` (7)**: Validates call-stack frame tracking forward and backward. Verifies `EV_POP` payload `[a, b]` restores the popped stack frame in reverse.
- **`EV_DONE` (8)**: Validates completion flag toggling.
- **Bidirectional Invariant**: A 8-step sequence of mixed events applied forward and reversed in inverse order produces bitwise identical state to step 0.

### 2.2 Sparse Checkpoints and Frame Navigation (`frameStore.test.ts`)
- **Step 0 Invariant**: Frame 0 always presents the initial unmutated array with 0 comparisons and 0 writes.
- **Sequential Forward Progression**: Stepping forward incrementally reaches the terminal frame and stops without out-of-bounds errors.
- **Sequential Reverse Progression**: Stepping backward from completion to step 0 restores the initial array and counters identically.
- **Checkpoint Crossing**: Verified against a 120-event sequence across a 20-step checkpoint interval; random seeks match sequential stepping bitwise.
- **Out-of-Bounds Clamping**: Negative seeks clamp to step 0; targets beyond `totalSteps` clamp to terminal step.

### 2.3 Timing Accumulator and Scheduler (`playbackClock.test.ts`)
- **Mock Scheduler Injection**: Isolates tests from wall-clock variance using `MockScheduler`.
- **Proportional Ticking**: Accurately computes ticks based on accumulated delta time and speed setting.
- **Tab-Suspension Shield**: Simulates a 5,000ms background tab delay and verifies clamping to `maxCatchupMs` (100ms) to prevent simulation freezes or surges.
- **Duplicate Play Idempotency**: Multiple `play()` invocations do not duplicate timer handles.
- **Resource Disposal**: `dispose()` halts all scheduling and purges callbacks.

### 2.4 Single-Lane State Machine (`tracePlayer.test.ts`)
- **Lifecycle Transitions**: `idle` $\rightarrow$ `playing` $\rightarrow$ `paused` $\rightarrow$ `completed`.
- **Immediate Notification**: Subscribers receive the current frame immediately upon registration.
- **Step Navigation**: Manual `stepForward()`, `stepBackward()`, `seek()`, and `restart()`.
- **Auto-Restart on Play**: Invoking `play()` when already completed automatically resets to step 0.

### 2.5 Multi-Lane Race Coordination (`raceCoordinator.test.ts`)
- **End-to-End WASM Integration**: Loads the real C99 WebAssembly core via `getCoreClient()`, runs all 5 syllabus algorithms on a test corpus, and records traces into `RaceCoordinator`.
- **Lanes Tested**:
  1. Bubble Sort (`ALGO_BUBBLE = 0`)
  2. Selection Sort (`ALGO_SELECTION = 1`)
  3. Insertion Sort (`ALGO_INSERTION = 2`)
  4. Quick Sort (`ALGO_QUICK = 3`)
  5. Merge Sort (`ALGO_MERGE = 4`)
- **Independent Completion**: Fast algorithms complete early and park in their sorted state with final telemetry preserved while slower algorithms continue.
- **Native Counter Parity**: At completion, each lane's visual telemetry counters (`comparisons`, `writes`) match the native C core counters exactly.
- **Synchronized Seeking**: `seekProgress(ratio)` navigates all 5 lanes to their proportional or clamped steps in lockstep.

### 2.6 Performance and Memory Benchmarks (`performance.test.ts`)
- **Sub-Millisecond Seek Latency**: 100 random seeks across a 2,000-event trace executed in an average latency well below the 5ms target (typically < 0.2ms per seek).
- **Strict Checkpoint Bounding**: A 1,500-event session with $K = 50$ yields exactly 31 checkpoints, ensuring total memory overhead remains under 50 KB.
