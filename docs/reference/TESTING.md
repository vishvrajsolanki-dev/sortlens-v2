# TESTING.md

## Functional Tests

- `/api/analyze` with valid input returns all required fields (`array`, `inversion_ratio`, `duplicate_ratio`, `predicted_algo`, `reason`) with correct types
- `/api/race` with a valid array returns results for all five algorithms
- Invalid inputs (out-of-range size, malformed array) return HTTP 400, not a crash

## Engineering / Calculation Validation

This is the most important category — it's how you prove the core logic is actually correct, not just "runs without crashing."

| Case | Expected result | Why it's checkable by hand |
|---|---|---|
| Already-sorted array of size `n` | Insertion sort comparisons = exactly `n - 1` | Closed-form: insertion sort does one comparison per element on already-sorted input |
| Reverse-sorted array of size `n` | Selection sort comparisons = exactly `n(n-1)/2` | Closed-form: selection sort always scans the full remaining unsorted portion regardless of order |
| All-equal-value array | `duplicate_ratio` = exactly `1.0`, `inversion_ratio` = exactly `0.0` | No pair is out of order when all values are equal |
| Fully reverse-sorted array | `inversion_ratio` = exactly `1.0` | Every pair is out of order |
| Any array, any pattern | All five algorithms' final sorted output must be identical | They're sorting the same input — if outputs differ, one engine has a bug |

Run these by hand at least once per algorithm before trusting them on generated data, and keep them as permanent checks in `tests/test_core.py`.

## Edge Cases

- `n = 10` (minimum allowed size) runs without error
- `n = 70` (maximum allowed size) runs without error
- Array with all identical values
- Array that's already perfectly sorted going into the *race* step (not just the classifier)

## Input Validation

- Reject `size` outside 10–70 with HTTP 400
- Reject non-integer or malformed values in a user-supplied array (relevant if the optional CSV-upload feature is built)
- Reject an unrecognized `pattern` value

## Integration Tests

- Full round trip: call `/api/analyze`, then feed its `array` into `/api/race`, then confirm the frontend's "confirmed/missed" verdict logic matches what the raw comparison counts in the response actually say
- Confirm a logged run appears correctly in `/api/history` after a race completes

## How to Run

```bash
python tests/test_core.py
```

This script invokes the compiled `core/sortlens_core` binary directly (not through the Flask API) on a fixed set of arrays — the ones in the table above plus a few random ones — and asserts the expected values. Run it after any change to `core/sortlens.c` before touching anything else.
