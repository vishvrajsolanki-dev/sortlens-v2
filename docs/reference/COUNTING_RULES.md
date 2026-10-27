# SortLens Counting Rules

SortLens instruments five classical sorting algorithms to measure runtime complexity empirically.
These counting rules are identical to the original v1 engine and form the ground truth for all predictions and animations.

## 1. Comparisons (`comparisons`)

Counts strictly comparisons between actual data values in the array:
- Bubble Sort: `arr[j] > arr[j + 1]`
- Selection Sort: `arr[j] < arr[min_idx]`
- Insertion Sort: `arr[j] > key`
- Quick Sort: `arr[j] <= pivot` (Lomuto partition)
- Merge Sort: `arr[i] <= arr[j]` (merging left and right runs)

**Excluded from counting:**
- Loop counter comparisons (e.g., `i < n`, `j >= 0`).
- Array bounds and base case checks (e.g., `low < high`).
- Pointer comparisons.

---

## 2. Writes (`writes`)

Counts strictly assignments modifying elements of the main array being sorted (`arr[idx] = value`):
- **Bubble Sort**: 2 writes per swap of adjacent elements.
- **Selection Sort**: 2 writes per swap (`arr[i]` and `arr[min_idx]`) when `min_idx != i`.
- **Insertion Sort**: 1 write per shifted element (`arr[j + 1] = arr[j]`), plus 1 write for inserting the `key` (`arr[j + 1] = key`).
- **Quick Sort**: 2 writes per swap during partitioning when `i != j`, plus 2 writes placing the pivot when `i + 1 != high`.
- **Merge Sort**: 1 write per element copied back from the auxiliary buffer into the main array (`arr[k] = temp[k]`).

**Excluded from counting:**
- Writes to local variables, indices, loop variables, and temporary swap variables (`int temp = arr[i]`).
- Writes into the auxiliary merge buffer (`temp[k++] = arr[i++]`).

---

## 3. Closed-Form Mathematical Invariants

These invariants hold true unconditionally and are validated in the automated test suite:

1. **Selection Sort Comparisons**:
   $$\text{comparisons} = \frac{n(n - 1)}{2} \quad \text{for all inputs of size } n$$
2. **Bubble Sort on Already Sorted Array**:
   $$\text{comparisons} = n - 1, \quad \text{writes} = 0$$
3. **Bubble Sort Writes**:
   $$\text{writes} = 2 \times I \quad (I = \text{number of inversions})$$
4. **Insertion Sort on Already Sorted Array**:
   $$\text{comparisons} = n - 1, \quad \text{writes} = n - 1$$
5. **Insertion Sort on Strictly Reversed Array**:
   $$\text{comparisons} = \frac{n(n - 1)}{2}, \quad \text{writes} = \frac{n(n - 1)}{2} + (n - 1)$$
