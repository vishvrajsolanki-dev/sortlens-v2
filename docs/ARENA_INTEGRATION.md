# SortLens Rebuild — Arena Integration & Deterministic Data Flow

## 1. End-to-End Execution & Telemetry Pipeline

The Sorting Arena integrates the C99 WebAssembly core with the deterministic playback engine and React UI through a strictly unidirectional flow:

```
[User triggers "Generate & Stage Race"]
                   │
                   ▼
       Dataset Generator (Mulberry32)
       Enforces N ∈ [2, 100], V ∈ [1, 999]
                   │
                   ▼
  CoreClient WASM Execution (All 5 Algorithms)
  ┌───────────────┬───────────────┬───────────────┬───────────────┬───────────────┐
  │  Bubble Sort  │Selection Sort │Insertion Sort │  Quick Sort   │  Merge Sort   │
  │  res.events   │  res.events   │  res.events   │  res.events   │  res.events   │
  └───────┬───────┴───────┬───────┴───────┬───────┴───────┬───────┴───────┬───────┘
          │               │               │               │               │
          └───────────────┼───────────────┼───────────────┼───────────────┘
                          ▼
              Builds 5 TraceSessions
                          │
                          ▼
           Instantiates RaceCoordinator
     (Holds 5 TracePlayers & PlaybackClock)
                          │
                          ▼
            RaceCoordinator.subscribe()
                          │
             Publishes RaceSnapshot
                          │
                          ▼
        SortingArena State Updates & UI Render
       ┌──────────────────┬──────────────────┐
       │   RaceToolbar    │ DatasetControls  │
       └──────────────────┴──────────────────┘
                          │
           5 Synchronized CanvasLanes
       ┌───────────┬───────────┬───────────┐
       │drawLane() │drawLane() │drawLane() │ ...
       └───────────┴───────────┴───────────┘
```

---

## 2. RaceCoordinator Coordination Contract

1. **Shared Timeline Synchronization**:
   The `RaceCoordinator` determines the master timeline length as:
   $$S_{max} = \max_{k \in [0, 4]} (\text{totalSteps}_k)$$
   When the master clock reaches step $S \le S_{max}$:
   - Any algorithm that completed at step $T_k < S$ remains clamped at its final completed state with green highlight (`isDone: true`).
   - Algorithms still active at step $S$ display their exact active subarray range, pivot, active indices, and current comparison/write counters.

2. **Reversible Stepping & Seeking**:
   - Backward step: `coordinator.stepBackward()` decrements clock and reconstructs state from closest checkpoint ($k \times 16$).
   - Direct Scrub: `coordinator.seek(step)` performs $O(1)$ checkpoint lookup and at most 15 forward event applications.
   - Restart: `coordinator.restart()` instantly resets all lanes to Step 0 (initial input array, 0 comparisons, 0 writes).

---

## 3. Telemetry Invariant Verification

Each lane card (`CanvasLane.tsx`) renders three live telemetry counters:
- **Comparisons**: Measured strictly from C core operations. At completion, `frame.comparisons == session.cComparisons`.
- **Writes**: Measured strictly from C core memory writes. At completion, `frame.writes == session.cWrites`.
- **Stack Depth**: Rendered specifically for Lomuto Quick Sort and Top-down Merge Sort, reflecting actual recursion call depth.

When an algorithm encounters the trace capacity ceiling, an `OVERFLOW` warning badge is immediately surfaced to inform the user that event recording truncated before natural termination.
