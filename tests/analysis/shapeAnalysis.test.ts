import { describe, it, expect, beforeAll } from 'vitest';
import { getCoreClient } from '../../src/core/adapter/createCoreClient';
import type { CoreClient } from '../../src/core/adapter/types';
import { JUDGE_COMPARISONS } from '../../src/core/adapter/types';
import { generateDataset } from '../../src/core/dataset/generator';

describe('Shape Analysis & Hash Table Invariants (C99 WebAssembly Core)', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  it('correctly analyzes minimum supported array size N=2 (boundary condition)', () => {
    // Inverted pair
    const invAnalysis = client.analyze([50, 10], JUDGE_COMPARISONS);
    expect(invAnalysis.inversions).toBe(1);
    expect(invAnalysis.inversionRatio).toBe(1.0);
    expect(invAnalysis.maxLeftGreater).toBe(1);
    expect(invAnalysis.distinct).toBe(2);
    expect(invAnalysis.duplicateRatio).toBe(0.0);

    // Sorted pair
    const sortedAnalysis = client.analyze([10, 50], JUDGE_COMPARISONS);
    expect(sortedAnalysis.inversions).toBe(0);
    expect(sortedAnalysis.inversionRatio).toBe(0.0);
    expect(sortedAnalysis.maxLeftGreater).toBe(0);
    expect(sortedAnalysis.distinct).toBe(2);
  });

  it('correctly analyzes maximum supported array size N=100 (boundary condition)', () => {
    const arr = generateDataset('random', 100, 777);
    expect(arr).toHaveLength(100);

    const analysis = client.analyze(arr, JUDGE_COMPARISONS);
    expect(analysis.inversions).toBeGreaterThan(0);
    expect(analysis.inversionRatio).toBeGreaterThan(0);
    expect(analysis.inversionRatio).toBeLessThanOrEqual(1.0);
    expect(analysis.distinct).toBeGreaterThan(0);
    expect(analysis.distinct).toBeLessThanOrEqual(100);
  });

  it('verifies mathematical invariants for monotonically sorted arrays (r=0, I=0, p=0)', () => {
    const sorted = [5, 12, 19, 28, 35, 42, 59, 71, 88, 95];
    const analysis = client.analyze(sorted, JUDGE_COMPARISONS);

    expect(analysis.inversions).toBe(0);
    expect(analysis.inversionRatio).toBe(0.0);
    expect(analysis.maxLeftGreater).toBe(0);
    expect(analysis.distinct).toBe(10);
    expect(analysis.duplicateRatio).toBe(0.0);
  });

  it('verifies mathematical invariants for strictly reversed arrays (r=1.0, I=n(n-1)/2, p=n-1)', () => {
    const n = 15;
    const reversed = Array.from({ length: n }, (_, i) => 99 - i * 5);
    const totalPairs = (n * (n - 1)) / 2;

    const analysis = client.analyze(reversed, JUDGE_COMPARISONS);

    expect(analysis.inversions).toBe(totalPairs);
    expect(analysis.inversionRatio).toBe(1.0);
    expect(analysis.maxLeftGreater).toBe(n - 1);
    expect(analysis.distinct).toBe(n);
  });

  it('validates inversion count and max_left_greater against independent ground truth', () => {
    const arr = [42, 17, 88, 3, 99, 12, 55, 30, 71, 9];
    const n = arr.length;

    // Independent O(n^2) brute-force inversion calculation
    let groundTruthInversions = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (arr[i]! > arr[j]!) {
          groundTruthInversions++;
        }
      }
    }

    // Independent max_left_greater calculation
    let groundTruthP = 0;
    for (let i = 0; i < n; i++) {
      let leftGreater = 0;
      for (let j = 0; j < i; j++) {
        if (arr[j]! > arr[i]!) leftGreater++;
      }
      if (leftGreater > groundTruthP) {
        groundTruthP = leftGreater;
      }
    }

    const analysis = client.analyze(arr, JUDGE_COMPARISONS);
    expect(analysis.inversions).toBe(groundTruthInversions);
    expect(analysis.maxLeftGreater).toBe(groundTruthP);
  });

  it('verifies 11-bucket separate chaining hash table distribution and bucket membership', () => {
    const arr = [11, 22, 33, 15, 26, 37, 5, 16, 27, 8, 19];
    client.analyze(arr, JUDGE_COMPARISONS);
    const ht = client.getHashTableData();

    expect(ht.size).toBe(11);
    expect(ht.buckets).toHaveLength(11);

    // Verify division hashing invariant: each item in bucket b satisfies item % 11 == b
    for (let b = 0; b < 11; b++) {
      const chain = ht.buckets[b]!;
      for (const val of chain) {
        expect(val % 11).toBe(b);
      }
    }

    // Verify distinct count and collisions
    const uniqueCount = new Set(arr).size;
    expect(ht.distinctCount).toBe(uniqueCount);
    const expectedCollisions = ht.buckets.reduce(
      (acc, chain) => acc + (chain.length > 0 ? chain.length - 1 : 0),
      0
    );
    expect(ht.collisionCount).toBe(expectedCollisions);
  });
});
