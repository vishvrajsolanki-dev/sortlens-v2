# Trace Contract: SortLens Circular Event Queue

This document specifies the exact format, invariants, capacity, and replay semantics of the trace queue defined in `src/core/c/sortlens.h` and `src/core/c/trace.c`.

---

## 1. Trace Queue Architecture

SortLens records algorithmic progress through an array-based circular event queue (`TraceQueue`, Practical 5 compliance).
* **Buffer Capacity:** `MAX_EVENTS = 30000` (fixed-size array `events[30000]`).
* **Storage Representation:** Each event is a 5-tuple of 32-bit signed integers:
  ```c
  typedef struct {
      int type; // Event type ID (1..8)
      int a;    // Payload field A
      int b;    // Payload field B
      int c;    // Payload field C
      int d;    // Payload field D
  } TraceEvent;
  ```
* **State Variables:**
  * `front`: Queue read head (initialized to `0`).
  * `rear`: Queue write tail (initialized to `0`).
  * `count`: Total recorded events ($0 \le \text{count} \le 30000$).
  * `overflow`: Flag set to `1` if an event was dropped due to `count >= MAX_EVENTS`.
  * `recording`: Flag (`1` = capture events; `0` = skip event logging to measure pure algorithmic performance).

---

## 2. Event Type Specification

| Event Type ID | Constant Name | Payload Field `a` | Payload Field `b` | Payload Field `c` | Payload Field `d` | Operational Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `EV_COMPARE` | Index 1 (`j` or `i`) | Index 2 (`j+1` or `mid` or `high`) | Value at Index 1 | Value at Index 2 | Comparison between two array elements. |
| **2** | `EV_SWAP` | Index 1 | Index 2 | `0` | `0` | In-place swap of `arr[a]` and `arr[b]`. |
| **3** | `EV_WRITE` | Target index | New value assigned | Overwritten old value | `0` | Assignment directly modifying `arr[a] = b`. |
| **4** | `EV_PIVOT` | Pivot index (`high`) | Pivot value | `0` | `0` | Selection of partition pivot (Lomuto). |
| **5** | `EV_RANGE` | Subarray `low` | Subarray `high` | `0` | `0` | Active sorting window boundary. |
| **6** | `EV_PUSH` | Subarray `low` | Subarray `high` | `0` | `0` | Recursion frame pushed onto call stack. |
| **7** | `EV_POP` | Subarray `low` | Subarray `high` | `0` | `0` | Recursion frame popped from call stack. |
| **8** | `EV_DONE` | `0` | `0` | `0` | `0` | Algorithm completed execution. |

---

## 3. Algorithm-Specific Event Sequences

### Bubble Sort (`ALGO_BUBBLE = 0`)
* Iterates adjacent pairs: emits `EV_COMPARE(j, j + 1, arr[j], arr[j + 1])`.
* If out of order: emits `EV_SWAP(j, j + 1, 0, 0)`.
* Terminates early if pass had zero swaps. Emits `EV_DONE(0, 0, 0, 0)`.

### Selection Sort (`ALGO_SELECTION = 1`)
* Scans for minimum: emits `EV_COMPARE(j, min_idx, arr[j], arr[j], arr[min_idx])`.
* If `min_idx != i`: emits `EV_SWAP(i, min_idx, 0, 0)`.
* Emits `EV_DONE(0, 0, 0, 0)`.

### Insertion Sort (`ALGO_INSERTION = 2`)
* Compares predecessor with key: emits `EV_COMPARE(j, i, arr[j], key)`.
* Shifting elements right: emits `EV_WRITE(j + 1, arr[j], old_val, 0)`.
* Inserting key into vacant position: emits `EV_WRITE(j + 1, key, old_dest, 0)`.
* Emits `EV_DONE(0, 0, 0, 0)`.

### Lomuto Quick Sort (`ALGO_QUICK = 3`)
* On subsegment `[low, high]`: emits `EV_PUSH(low, high)`, `EV_RANGE(low, high)`, `EV_PIVOT(high, pivot)`.
* Scanning items: emits `EV_COMPARE(j, high, arr[j], pivot)`.
* Partition swaps: emits `EV_SWAP(i, j, 0, 0)`.
* Final pivot placement: emits `EV_SWAP(i + 1, high, 0, 0)`.
* On segment return: emits `EV_POP(low, high)`.
* Emits `EV_DONE(0, 0, 0, 0)`.

### Merge Sort (`ALGO_MERGE = 4`)
* On subsegment divide: emits `EV_PUSH(low, high)`.
* In merge step: emits `EV_RANGE(low, high)`.
* Comparing runs: emits `EV_COMPARE(i, j, arr[i], arr[j])`. Elements placed into auxiliary buffer `temp_buf` are **not** emitted as writes.
* Copying back from auxiliary buffer into main array: emits `EV_WRITE(k, temp_buf[k], old_val, 0)`.
* On subsegment return: emits `EV_POP(low, high)`.
* Emits `EV_DONE(0, 0, 0, 0)`.

---

## 4. Deterministic Forward Replay Invariant

Replaying trace events sequentially onto a clone of the initial array $A_0$ is guaranteed to yield the exact sorted result:
```typescript
function replayTrace(initial: number[], events: TraceEvent[]): number[] {
  const arr = [...initial];
  for (const ev of events) {
    if (ev.type === EV_SWAP) {
      const temp = arr[ev.a];
      arr[ev.a] = arr[ev.b];
      arr[ev.b] = temp;
    } else if (ev.type === EV_WRITE) {
      arr[ev.a] = ev.b;
    }
  }
  return arr;
}
```
* Every comparison event `EV_COMPARE` directly increments the cumulative comparison counter by 1.
* Every swap event `EV_SWAP` increments the main array write counter by 2.
* Every write event `EV_WRITE` increments the main array write counter by 1.
* At the final frame `EV_DONE`, the cumulative counts strictly equal `sl_comparisons(algo)` and `sl_writes(algo)`.

---

## 5. Reverse Playback & Backward Stepping Semantics

Forward trace events only describe mutations forward. To step backward deterministically without re-executing from frame 0:
* **Swap (`EV_SWAP`):** Swaps are self-inverting. Reversing `EV_SWAP(a, b)` simply applies `EV_SWAP(a, b)` again.
* **Write (`EV_WRITE`):** The C implementation logs `old_val` in payload field `c`. To invert `EV_WRITE(a, new_val, old_val, 0)`, the engine assigns `arr[a] = c (old_val)`.
* This enables $O(1)$ bidirectional seeking and frame stepping in the playback engine.

---

## 6. Capacity Limits & Overflow Handling

* The buffer holds up to `MAX_EVENTS = 30000` events.
* For $n \le 100$, maximum possible events occur in reverse-sorted arrays under Bubble Sort ($n(n-1)/2 \approx 4,950$ comparisons + $4,950$ swaps $\approx 9,900$ events) and Insertion Sort ($\approx 9,900$ events). Both are well within the $30,000$ limit.
* If `count >= MAX_EVENTS`, the C core sets `overflow = 1` and rejects subsequent events.
* The TypeScript adapter checks `sl_overflow(algo)` and surfaces `overflow: true`, alerting the playback engine that the visual trace was truncated while preserving exact comparison/write counters.
