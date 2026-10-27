# SortLens Rebuild — 5-Lane Sorting Arena Graphics & Interaction Architecture

## 1. Overview & Objective
The Sorting Arena is the central real-time visualization surface of SortLens. It provides simultaneous, synchronized comparative execution across the five syllabus sorting algorithms operating on the exact same input dataset:
1. **Bubble Sort** (optimized with early exit)
2. **Selection Sort** (single write per scan)
3. **Insertion Sort** (adaptive leftward shift)
4. **Lomuto Quick Sort** (in-place partitioning with pivot as last element)
5. **Top-down Merge Sort** (divide-and-conquer auxiliary merge)

All frames, highlights, and operation counters are deterministically driven by the authoritative C99/WebAssembly engine traces via the `RaceCoordinator` playback clock.

---

## 2. High-Frequency Rendering Architecture

### 2.1 The React / Canvas 2D Boundary
In educational visualization interfaces, re-rendering an entire React virtual DOM tree at 60–1000 events/second creates garbage collection stalls, dropped frames, and input latency. SortLens achieves smooth 60fps rendering through strict architectural separation:

```
+-----------------------------------------------------------+
|                   RaceCoordinator (Engine)                |
|            Internal tick / scrubber seek (60-1000 Hz)     |
+-----------------------------+-----------------------------+
                              |
                     RaceSnapshot update
                              v
+-----------------------------------------------------------+
|               SortingArena (React Container)              |
|        Distributes PlaybackFrame to each CanvasLane       |
+-----------------------------+-----------------------------+
                              |
                     Direct Canvas 2D Effect
                              v
+-----------------------------------------------------------+
|                   drawLane (Pure Canvas 2D)               |
|      - High-DPI DPR scaling (window.devicePixelRatio)     |
|      - Pure geometry bar layout computation               |
|      - Zero layout thrashing or React VDOM reconciliation |
+-----------------------------------------------------------+
```

### 2.2 Device Pixel Ratio (DPR) Scaling
Retina and high-density screens cause standard Canvas elements to appear blurry if rendered at 1:1 CSS pixels.
`CanvasLane` and `drawLane` automatically query `window.devicePixelRatio`:
- The backing canvas buffer is scaled: `canvas.width = cssWidth * dpr`, `canvas.height = cssHeight * dpr`.
- The 2D rendering context is normalized: `ctx.scale(dpr, dpr)`.
- All drawing coordinates operate strictly in CSS logical units, ensuring crisp 1px borders, crisp fonts, and ultra-sharp bars across all displays.

---

## 3. Pure Geometry & Layout Engine (`calculateBarLayout`)

The layout calculator (`calculateBarLayout.ts`) is a pure, side-effect-free function that converts an immutable `PlaybackFrame` into a list of bar coordinates, dimensions, and fill styles:

```ts
export function calculateBarLayout(
  frame: PlaybackFrame,
  canvasWidth: number,
  canvasHeight: number,
  globalMaxVal?: number
): LaneLayoutResult
```

### 3.1 Bar Geometry Rules
1. **Horizontal Containment**:
   $$w_{available} = W_{canvas} - 2 \times \text{paddingX}$$
   $$gap = \begin{cases} 1\text{px} & \text{if } N > 50 \\ 2\text{px} & \text{if } N > 25 \\ 3\text{px} & \text{otherwise} \end{cases}$$
   $$w_{bar} = \max\left(1, \frac{w_{available} - gap \cdot (N - 1)}{N}\right)$$
   Bars are strictly contiguous with no overlaps: $x_i = \text{paddingX} + i \cdot (w_{bar} + gap)$.

2. **Vertical Height Scaling**:
   The vertical scale is normalized across all 5 lanes using the dataset's global maximum value ($V_{max}$):
   $$h_i = \max\left(2, \text{round}\left(\frac{v_i}{V_{max}} \cdot (H_{canvas} - 2 \times \text{paddingY} - H_{labels})\right)\right)$$
   $$y_i = H_{canvas} - \text{paddingY} - h_i$$

3. **Label Suppression Invariant**:
   Value labels are drawn inside or above bars only when $N \le 25$, $w_{bar} \ge 16\text{px}$, and canvas height allows. For dense datasets ($N > 25$), numeric labels are automatically suppressed to prevent unreadable visual clutter.

---

## 4. Semantic Color System

Colors are aligned with the SortLens dark graphite telemetry aesthetic:

| Visual State | Hex Token | Semantic Meaning |
|---|---|---|
| **Inactive / Default** | `#374151` | Quiescent array element |
| **Active Subarray Range** | `#4338ca` | Merge or Quick sort recursion partition window |
| **Comparison** | `#06b6d4` (Cyan) | Elements currently evaluated by `EV_COMPARE` |
| **Write / Swap** | `#f43f5e` (Rose) | Elements modified by `EV_WRITE` or `EV_SWAP` |
| **Pivot** | `#f59e0b` (Amber) | Partitioning pivot in Lomuto Quick Sort |
| **Sorted / Completed** | `#10b981` (Emerald) | Final sorted state or verified completion |
| **Overflow Alert** | `#f43f5e` (Rose) | Trace step limit reached |

---

## 5. Playback & Telemetry Controls

The race toolbar (`RaceToolbar.tsx`) provides complete telemetry and playback manipulation:
- **Play / Pause**: Toggles animation loop in `PlaybackClock`.
- **Step Forward / Backward**: Deterministically advances or rewinds the race by exactly 1 event across all 5 lanes in lockstep.
- **Restart**: Instant rewind to Step 0 ($O(1)$ via snapshot restoration).
- **Timeline Scrubber**: Real-time seeking from step $0$ to $\max(steps)$ using indexed checkpoints.
- **Simulation Speed Selector**: Speeds of `[1, 5, 20, 60, 120, 300, 600, 1000]` events/sec.

---

## 6. Dataset Generator & Custom Input Validation

The dataset generator (`generator.ts`) supports five pedagogical patterns:
- **Random**: Uniform pseudo-random distribution generated by the Mulberry32 PRNG.
- **Nearly Sorted**: Monotonically sorted with $\sim 10\%$ adjacent inversions.
- **Reverse**: Monotonically descending array (worst-case for Bubble & Lomuto Quick Sort).
- **Sorted**: Monotonically ascending array (best-case for Insertion Sort).
- **Few Unique**: 3–4 discrete values (high duplicate density, tests stability and duplicate handling).

**Custom Input Validation Constraints**:
- Array size: $N \in [2, 100]$.
- Element values: $V \in [1, 999]$.
- Rejects non-integers, empty strings, and out-of-range values with user-facing alerts.
