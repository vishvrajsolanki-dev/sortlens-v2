# SortLens Model Calibration and Empirical Accuracy

This document records the exact mathematical cost model and real empirical evaluation run on 1,000 synthetic arrays across five canonical patterns and sizes $n \in [10, 100]$.

## 1. Cost Model Formulation

Rather than a static heuristic rule table, SortLens models the expected operation cost of each syllabus algorithm from the measured dataset shape:
- $n$: array size
- $I$: total inversions measured via $O(n \log n)$ merge-counter
- $p$: `max_left_greater` (maximum count of larger elements preceding any item)
- $r = \frac{I}{n(n-1)/2}$: inversion ratio ($0 \le r \le 1$)
- $m = 4r(1 - r)$: degree of mixing ($0$ for strictly sorted/reversed, $1$ when well-mixed)
- $d = \frac{n - \text{distinct}}{n - 1}$: duplicate ratio ($0 \le d \le 1$) via hash table

### Closed-Form & Fitted Formulas

1. **Selection Sort**:
   - Comparisons: $\frac{n(n - 1)}{2}$ (exact, independent of distribution)
   - Writes: $2(n - 1)$

2. **Bubble Sort (with early-exit flag)**:
   - Early exit terminates after passes $= \min(p + 1, n - 1)$.
   - Comparisons: $\sum_{i=0}^{\text{passes}-1} (n - 1 - i)$
   - Writes: $2 \times I$ (exact, each swap fixes 1 inversion)

3. **Insertion Sort (by shifting)**:
   - Comparisons: $I + (n - 1)$
   - Writes: $I + (n - 1)$

4. **Merge Sort (top-down)**:
   - Comparisons: interpolated between best case $\frac{n}{2}\log_2(n)$ (presorted runs) and average $n\log_2(n) - 1.25n$:
     $$\text{comparisons} = (1 - m) \cdot \left(\frac{n}{2}\log_2 n\right) + m \cdot (n\log_2 n - 1.25n)$$
   - Writes: $n \cdot \lceil \log_2 n \rceil$ (main array writes on merge copy-back)

5. **Quick Sort (Lomuto partition with last-element pivot)**:
   - When well-mixed and unique, Lomuto achieves $\approx 1.39 n \log_2 n$ comparisons.
   - Degrades to $\frac{n(n - 1)}{2}$ on sorted ($r=0$), reversed ($r=1$), or duplicate-heavy ($d \to 1$) arrays.
   - Effective mixing factor: $m_{\text{eff}} = m \times (1 - d)$.
   - Comparisons:
     $$\text{comparisons} = m_{\text{eff}} \cdot (1.39 n \log_2 n) + (1 - m_{\text{eff}}) \cdot \frac{n(n - 1)}{2}$$

---

## 2. Empirical Benchmark Results (`tools/calibrate.exe`)

Ran 1,000 synthetic arrays across sizes $n = 10 \dots 100$ (200 arrays per pattern) judging by **comparisons**:

| Pattern | Runs | Confirmed Winner | Accuracy |
| :--- | :--- | :--- | :--- |
| **Random** | 200 | 171 | **85.50%** |
| **Nearly sorted** | 200 | 200 | **100.00%** |
| **Reverse** | 200 | 200 | **100.00%** |
| **Sorted** | 200 | 200 | **100.00%** |
| **Few unique** | 200 | 194 | **97.00%** |
| **OVERALL** | **1,000** | **965** | **96.50%** |

### Benchmark Analysis
- **Target threshold**: $\ge 85\%$ overall.
- **Achieved overall**: **96.50%**.
- **Random arrays**: **85.50%** (up from 25.0% in legacy v1). The cost model correctly identifies when Lomuto pivot imbalances give Merge sort the advantage on smaller/medium random inputs.
