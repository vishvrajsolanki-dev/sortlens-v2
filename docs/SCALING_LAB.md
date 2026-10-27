# Empirical Complexity Scaling Laboratory Documentation

## 1. Overview and Methodology

The Empirical Scaling Lab provides empirical, measured operational complexity curves across increasing input sizes $N \in [10, 100]$. It maps directly to Course 102040304 Data Structures (Unit 1: Time and Space Complexity Benchmarks).

Rather than rendering theoretical asymptotic equations as "measured" charts, SortLens runs the actual C99 WebAssembly algorithms at each tested array size and records exact operation counters.

---

## 2. Benchmark Architecture

### 2.1 Execution Contract
* **Sizes Tested:** $N \in [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]$.
* **Dataset Patterns:**
  1. `random`: Uniform pseudo-random distribution via Mulberry32 PRNG.
  2. `nearly_sorted`: ~10% adjacent inversions (demonstrates adaptive algorithm speedups).
  3. `reverse`: Monotonically descending order ($n(n-1)/2$ inversions, worst case for Insertion and Lomuto Quick).
  4. `sorted`: Monotonically ascending order (best case for Bubble and Insertion, worst case for Lomuto Quick).
  5. `few_unique`: High duplicate density with repeated keys.
* **Trace Mode:** Executed with `recordTrace = false` (`_sl_run(algo, n, 0)`). This bypasses animation queue allocation, executing sorting runs at maximum native WebAssembly speed while accurately tracking comparison and write counters.

### 2.2 Counting Definitions
* **Comparisons:** Element-to-element relational tests performed by the algorithm.
* **Writes:** Array element modifications (swaps count as 3 writes in Bubble/Selection/Quick, auxiliary copies count as 2 writes in Merge Sort).
* **Total Operations:** Arithmetic sum $\text{Comparisons} + \text{Writes}$.

---

## 3. Disentangling Empirical Counts, Cost Models, and Asymptotic Theory

SortLens strictly distinguishes between three layers of analysis:

1. **Empirical Measurements (Solid Curves with Markers):**
   - Actual operation counts produced by running the C core implementation on the deterministic dataset.
2. **C Cost-Model Predictions (Dotted Curves with Diamonds):**
   - Pre-run closed-form mathematical estimates produced by `analyze_shape` in C core.
3. **Theoretical Asymptotic References (Dashed Lines):**
   - Normalized curves representing pure mathematical complexity classes ($O(n^2)$ and $O(n \log_2 n)$).

---

## 4. Key Empirical Insights Revealed

* **Lomuto Pivot Degradation:** On `sorted` and `reverse` patterns, Lomuto Quick Sort quadratic comparisons ($n(n-1)/2$) curve sharply upwards, empirically proving its vulnerability to non-random pivots.
* **Insertion Sort Adaptivity:** On `nearly_sorted` data, Insertion Sort comparisons remain nearly linear ($O(n + I)$), outperforming Merge Sort for small to medium $N$.
* **Merge Sort Consistency:** Merge Sort maintains consistent $O(n \log n)$ comparison counts regardless of input pattern, though its write count reflects auxiliary buffer copy overhead.
