import type { DatasetPattern } from '../../state/appStore';

/**
 * Fast, deterministic 32-bit pseudo-random number generator (Mulberry32).
 */
export function createRng(seed = 123456789): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an integer dataset of size N (constrained to [2, 100], values [1, 99])
 * based on the selected pedagogical pattern.
 */
export function generateDataset(
  pattern: DatasetPattern,
  size: number,
  seed = Date.now()
): number[] {
  const n = Math.max(2, Math.min(100, Math.floor(size)));
  const rng = createRng(seed);

  switch (pattern) {
    case 'sorted': {
      // Monotonically non-decreasing values
      const step = 98 / (n + 1);
      return Array.from({ length: n }, (_, i) => Math.max(1, Math.min(99, Math.round((i + 1) * step))));
    }

    case 'reverse': {
      // Monotonically non-increasing values
      const step = 98 / (n + 1);
      return Array.from({ length: n }, (_, i) => Math.max(1, Math.min(99, Math.round(99 - i * step))));
    }

    case 'nearly_sorted': {
      // Mostly sorted with ~10% adjacent inversions
      const step = 98 / (n + 1);
      const arr = Array.from({ length: n }, (_, i) => Math.max(1, Math.min(99, Math.round((i + 1) * step))));
      const swapCount = Math.max(1, Math.floor(n * 0.1));
      for (let s = 0; s < swapCount; s++) {
        const idx = Math.floor(rng() * (n - 1));
        const temp = arr[idx]!;
        arr[idx] = arr[idx + 1]!;
        arr[idx + 1] = temp;
      }
      return arr;
    }

    case 'few_unique': {
      // High duplicate density: 3 to 4 distinct values
      const uniquePool = [15, 38, 62, 85];
      return Array.from({ length: n }, () => {
        const pick = Math.floor(rng() * uniquePool.length);
        return uniquePool[pick]!;
      });
    }

    case 'random':
    default: {
      // Uniform pseudo-random integers in [1, 99]
      return Array.from({ length: n }, () => Math.floor(rng() * 95) + 3);
    }
  }
}

/**
 * Parses and validates a user-provided comma-separated string of integers.
 * Enforces public application bounds: 2 <= N <= 100, integers only, values in [1, 99].
 */
export function parseCustomArray(input: string): number[] {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Custom array input cannot be empty.');
  }

  const tokens = trimmed
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (tokens.length < 2) {
    throw new Error(`Array size (${tokens.length}) is too small. Minimum size is 2 elements.`);
  }

  if (tokens.length > 100) {
    throw new Error(`Array size (${tokens.length}) exceeds maximum limit of 100 elements.`);
  }

  const result: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const val = Number(token);
    if (!Number.isInteger(val)) {
      throw new Error(`Item at position ${i + 1} ("${token}") is not a valid integer.`);
    }
    if (val < 1 || val > 99) {
      throw new Error(`Item at position ${i + 1} (${val}) must be between 1 and 99.`);
    }
    result.push(val);
  }

  return result;
}
