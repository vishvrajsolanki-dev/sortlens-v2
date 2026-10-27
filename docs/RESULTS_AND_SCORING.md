# Scoreboard, Operation Telemetry, and Prediction Verdicts

## 1. Overview and Engineering Standards

SortLens delivers an academic telemetry and scoreboard system for the five-algorithm sorting arena. It presents exact, verified operation counts from the C99/WebAssembly engine after all lanes complete execution.

In strict adherence to project specifications:
* **Zero Gamification:** No confetti, badges, XP, streaks, level-ups, or sound effects.
* **Zero Outcome Leakage:** Results and scoreboards remain completely hidden from the DOM until all five lanes have reached verified termination.
* **Honest Tie Handling:** Identical operation scores receive shared ranks (e.g. `T-1`, `T-3`), avoiding arbitrary tie-breaking.

---

## 2. Race Completion and Reveal Gate

The Scoreboard and Prediction Verdict components enforce strict lifecycle gating:

```tsx
if (!isComplete) {
  return null; // Zero DOM leakage before verified completion
}
```

A race is verified complete only when:
1. Every lane's `TracePlayer` has reached step index `totalSteps - 1`.
2. The shared coordinator reports `isComplete === true`.
3. The reconstructed array in every lane matches the verified sorted state.

---

## 3. Scoreboard Metrics

The scoreboard renders an accessible data table (`role="table"`, `aria-label="Final Race Results"`) displaying:

| Column | Description |
| :--- | :--- |
| **Rank** | Integer rank (1 to 5) or tied rank (`T-1`, `T-2`, etc.). |
| **Algorithm** | Full algorithm name with a visual indicator if it was the predicted winner (`★ PREDICTED`). |
| **Comparisons** | Authoritative count of element-to-element comparisons from the C engine. |
| **Writes** | Authoritative count of array writes (swaps, copies, auxiliary mutations) from the C engine. |
| **Total Ops** | Arithmetic sum ($\text{Comparisons} + \text{Writes}$). |
| **Call Stack** | Maximum recursion depth reached during execution (e.g., `4 frames` for Lomuto Quick Sort, `3 frames` for Merge Sort, `-` for iterative algorithms). |
| **Status** | `COMPLETED` (emerald badge) or `TRACE OVERFLOW` (amber/rose alert). |

---

## 4. Empirical Prediction Verdicts

Upon race completion, SortLens compares the pre-run cost-model prediction with the actual race winner under the selected judging criterion.

### 4.1 Verdict Categories

1. **`PREDICTION CONFIRMED` (Emerald Banner):**
   - The predicted algorithm achieved Rank 1 uniquely.
   - Explains how the dataset's structural characteristics matched the model's assumptions.
2. **`PREDICTION MISSED` (Amber Banner):**
   - A different algorithm outperformed the model's prediction.
   - Explicitly explains the discrepancy (e.g., pivot positioning in Lomuto Quick Sort or constant factors in Merge Sort auxiliary copying).
3. **`INCONCLUSIVE (TIE)` (Neutral Banner):**
   - Two or more algorithms tied for Rank 1 with identical operation counts.
   - Notes that empirical criteria cannot distinguish between the tied algorithms on this dataset.
4. **`VERDICT UNAVAILABLE` (Amber Alert Banner):**
   - One or more lanes hit the C trace recording capacity limit (`MAX_EVENTS = 30,000`).
   - Verdict is suppressed to maintain academic honesty, as full execution counts cannot be certified.

---

## 5. Judging Metric Reactivity

The scoreboard dynamically re-ranks all lanes whenever the user toggles the judging criterion:
* When toggled to **Comparisons**, algorithms with minimal element inspections rank first (e.g., Insertion Sort on nearly sorted inputs).
* When toggled to **Writes**, algorithms with minimal memory writes rank first (e.g., Selection Sort with exactly $2(n - 1)$ writes on reverse inputs).
* When toggled to **Total Operations**, algorithms balancing comparisons and writes rank first.
