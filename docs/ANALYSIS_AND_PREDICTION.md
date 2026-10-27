# Dataset Shape Analysis and Empirical Cost Model Predictions

## 1. Overview and Pedagogical Purpose

SortLens provides academic dataset shape analysis and empirical cost-model predictions to help students connect theoretical asymptotic complexity ($O(n^2)$, $O(n \log n)$) with actual runtime operations. Before observing an animation, students are presented with structural metrics of the input array and challenged to form an educated hypothesis about which algorithm will be cheapest under the chosen judging criterion.

All shape analysis metrics and cost-model predictions are computed authoritatively by the C99 algorithmic engine compiled to WebAssembly.

---

## 2. Dataset Shape Metrics

Given an input array $A$ of size $n \in [2, 100]$ with integer values $V \in [1, 99]$:

### 2.1 Inversion Count ($I$) and Inversion Ratio ($r$)
* **Inversion Count ($I$):**
  $$I = \sum_{0 \le i < j < n} [A[i] > A[j]]$$
* **Maximum Possible Inversions ($I_{\max}$):**
  $$I_{\max} = \frac{n(n - 1)}{2}$$
* **Inversion Ratio ($r$):**
  $$r = \frac{I}{I_{\max}} \in [0.0, 1.0]$$
* **Pedagogical Meaning:** Measures the disorder of the array.
  - $r = 0.0$: Monotonically sorted array. Insertion Sort and Bubble Sort with early exit finish in $O(n)$ time.
  - $r = 1.0$: Monotonically descending array (worst-case for Insertion Sort and Lomuto Quick Sort).
  - $r \approx 0.1$: Nearly sorted array, where adaptive algorithms excel.

### 2.2 Maximum Leftward Greater Displacement ($p$)
* **Definition:**
  $$p = \max_{0 \le i < n} |\{ j < i \mid A[j] > A[i] \}|$$
* **Pedagogical Meaning:** The maximum distance any element must travel leftward to reach its sorted position. Directly lower-bounds the inner loop iterations required by Insertion Sort.

### 2.3 Distinct Count and Duplicate Ratio ($d$)
* **Distinct Count ($k$):** The number of unique values in the dataset.
* **Duplicate Ratio ($d$):**
  $$d = 1.0 - \frac{k}{n}$$
* **Pedagogical Meaning:** High duplicate density ($d > 0.6$) tests algorithm stability and reveals how partitioning schemes (such as Lomuto) handle identical values.

---

## 3. Separate-Chaining Hash Table ($h(k) = k \pmod{11}$)

To connect array distributions to hash table data structures in syllabus curricula, SortLens visualizes an 11-bucket separate-chaining hash table:

* **Hash Function:** Division method $h(k) = k \pmod{11}$.
* **Bucket Capacity & Insertion Policy:**
  - Implemented in `hashtable.c`.
  - Only distinct keys are inserted into bucket chains (`ht_insert` checks `curr->value == val`).
  - Hash collisions occur when two distinct keys share the same bucket hash ($k_1 \pmod{11} = k_2 \pmod{11}$ with $k_1 \ne k_2$).
  - Total collisions equal:
    $$\text{Collisions} = \sum_{b=0}^{10} \max(0, \text{length}(b) - 1)$$
* **UI Presentation:** Displays an interactive bucket list with chain length indicators, distinct keys chips, and an alert when bucket chains exceed 4 elements (indicating non-uniform clustering).

---

## 4. Closed-Form Cost Model Predictions

The C99 engine evaluates closed-form cost formulas to estimate the number of operations each algorithm will perform:

| Algorithm | Comparisons Formula | Writes Formula |
| :--- | :--- | :--- |
| **Bubble Sort** | $n(n - 1)/2$ (or early exit if sorted) | $3I$ (swaps $\times$ 3 writes) |
| **Selection Sort** | $n(n - 1)/2$ (invariant) | $2(n - 1)$ (or 0 if already in place) |
| **Insertion Sort** | $I + (n - 1 - [A \text{ sorted}])$ | $I + 2(n - 1)$ |
| **Lomuto Quick Sort** | Dependent on pivot choices ($O(n \log n)$ to $O(n^2)$) | Dependent on partition swaps |
| **Top-Down Merge Sort**| $\approx n \lceil \log_2 n \rceil$ | $2n \lceil \log_2 n \rceil$ (auxiliary buffer writes) |

### Judging Criteria
Users can judge the race on three distinct criteria:
1. **Comparisons (`JUDGE_COMPARISONS`):** Evaluates element ordering probes.
2. **Writes (`JUDGE_WRITES`):** Evaluates memory/array mutation cost.
3. **Total Operations (`JUDGE_TOTAL`):** Combined sum of comparisons and writes.

---

## 5. Concealment and Anti-Leakage Protocol

To preserve educational rigor, SortLens implements strict anti-leakage guarantees:
1. **Hidden by Default:** The predicted winner and cost-model estimate table are concealed until the student clicks **"⚡ Reveal Model Prediction"**.
2. **Zero DOM Leakage:** While concealed, the predicted algorithm name and ranking do NOT exist in the DOM (neither in text, attributes, nor hidden spans).
3. **Design System Tokens:** The empirical prediction signal uses Amber (`#f59e0b`, `--sl-color-accent-amber`) exclusively. Canvas pivot rendering is assigned Violet (`#8b5cf6`, `--sl-color-accent-violet`) to prevent color channel collision.
