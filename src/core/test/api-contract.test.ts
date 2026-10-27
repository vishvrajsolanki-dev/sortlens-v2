import { describe, it, expect, beforeAll } from 'vitest';
import { getCoreClient } from '../adapter/createCoreClient';
import type { CoreClient, AlgorithmId } from '../adapter/types';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
  SEARCH_LINEAR,
  SEARCH_BINARY,
  EV_DONE,
} from '../adapter/types';
import { InvalidInputError } from '../adapter/errors';

describe('Core API Contract & Boundary Invariants', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  describe('Input Boundary Validation', () => {
    it('rejects empty arrays or arrays exceeding 100 elements', () => {
      expect(() => client.analyze([])).toThrow(InvalidInputError);
      const oversized = new Array(101).fill(5);
      expect(() => client.analyze(oversized)).toThrow(InvalidInputError);
    });

    it('rejects floating point or non-integer elements', () => {
      expect(() => client.analyze([1, 2.5, 3])).toThrow(InvalidInputError);
      expect(() => client.analyze([10, NaN, 20])).toThrow(InvalidInputError);
    });

    it('rejects invalid algorithm identifiers', () => {
      // @ts-expect-error testing invalid ID
      expect(() => client.runSort(99)).toThrow(InvalidInputError);
      // @ts-expect-error testing invalid negative ID
      expect(() => client.runSort(-1)).toThrow(InvalidInputError);
    });

    it('rejects invalid search kinds', () => {
      // @ts-expect-error testing invalid search kind
      expect(() => client.search(5, 10)).toThrow(InvalidInputError);
    });
  });

  describe('Shape Analysis & Prediction', () => {
    it('accurately computes invariants for strictly sorted array', () => {
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8];
      const analysis = client.analyze(sorted);

      expect(analysis.inversions).toBe(0);
      expect(analysis.inversionRatio).toBe(0);
      expect(analysis.maxLeftGreater).toBe(0);
      expect(analysis.distinct).toBe(8);
      expect(analysis.duplicateRatio).toBe(0);
      expect(analysis.reason).toContain('early-exit');
    });

    it('accurately computes invariants for strictly reversed array', () => {
      const n = 8;
      const reversed = [8, 7, 6, 5, 4, 3, 2, 1];
      const analysis = client.analyze(reversed);

      const expectedInversions = (n * (n - 1)) / 2; // 28
      expect(analysis.inversions).toBe(expectedInversions);
      expect(analysis.inversionRatio).toBe(1.0);
      expect(analysis.maxLeftGreater).toBe(n - 1);
      expect(analysis.distinct).toBe(8);
    });

    it('inspects 11-bucket hash table structure correctly', () => {
      const arr = [11, 22, 33, 5, 16]; // 11, 22, 33 all hash to bucket 0 (val % 11)
      client.analyze(arr);
      const ht = client.getHashTableData();

      expect(ht.size).toBe(11);
      expect(ht.buckets).toHaveLength(11);
      expect(ht.buckets[0]).toContain(11);
      expect(ht.buckets[0]).toContain(22);
      expect(ht.buckets[0]).toContain(33);
      expect(ht.collisionCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Sorting Invariants Across All Five Algorithms', () => {
    const algorithms: Array<{ id: AlgorithmId; name: string }> = [
      { id: ALGO_BUBBLE, name: 'Bubble Sort' },
      { id: ALGO_SELECTION, name: 'Selection Sort' },
      { id: ALGO_INSERTION, name: 'Insertion Sort' },
      { id: ALGO_QUICK, name: 'Quick Sort' },
      { id: ALGO_MERGE, name: 'Merge Sort' },
    ];

    const testPatterns = [
      { name: 'Random', data: [9, 3, 7, 1, 8, 2, 6, 5] },
      { name: 'Sorted', data: [1, 2, 3, 4, 5, 6, 7, 8] },
      { name: 'Reversed', data: [8, 7, 6, 5, 4, 3, 2, 1] },
      { name: 'Duplicates', data: [4, 2, 4, 1, 4, 2, 1, 4] },
    ];

    for (const algo of algorithms) {
      for (const pattern of testPatterns) {
        it(`${algo.name} correctly sorts ${pattern.name} pattern and preserves multiset`, () => {
          client.setInputArray(pattern.data);
          const result = client.runSort(algo.id, pattern.data.length, true);

          // Invariant 1: Output length matches input length
          expect(result.sortedArray).toHaveLength(pattern.data.length);

          // Invariant 2: Output is monotonically non-decreasing
          for (let i = 0; i < result.sortedArray.length - 1; i++) {
            const curr = result.sortedArray[i];
            const next = result.sortedArray[i + 1];
            expect(curr).toBeDefined();
            expect(next).toBeDefined();
            expect(curr!).toBeLessThanOrEqual(next!);
          }

          // Invariant 3: Output is a permutation of input
          const sortedInput = [...pattern.data].sort((a, b) => a - b);
          expect(result.sortedArray).toEqual(sortedInput);

          // Invariant 4: Nonnegative operation counters
          expect(result.comparisons).toBeGreaterThanOrEqual(0);
          expect(result.writes).toBeGreaterThanOrEqual(0);

          // Invariant 5: Non-empty trace ending with EV_DONE
          expect(result.events.length).toBeGreaterThan(0);
          const lastEvent = result.events[result.events.length - 1];
          expect(lastEvent?.type).toBe(EV_DONE);

          // Invariant 6: Overflow is false for n=8
          expect(result.overflow).toBe(false);
        });
      }
    }

    it('verifies Selection sort comparisons = n(n-1)/2 on any pattern', () => {
      const n = 10;
      const arr = [10, 3, 18, 5, 12, 1, 15, 7, 20, 2];
      client.setInputArray(arr);
      const res = client.runSort(ALGO_SELECTION, n, false);
      expect(res.comparisons).toBe((n * (n - 1)) / 2);
    });

    it('verifies Bubble sort on sorted data does n-1 comparisons and 0 writes', () => {
      const n = 10;
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      client.setInputArray(sorted);
      const res = client.runSort(ALGO_BUBBLE, n, false);
      expect(res.comparisons).toBe(n - 1);
      expect(res.writes).toBe(0);
    });

    it('verifies Insertion sort on reversed array does n(n-1)/2 comparisons', () => {
      const n = 10;
      const rev = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      client.setInputArray(rev);
      const res = client.runSort(ALGO_INSERTION, n, false);
      expect(res.comparisons).toBe((n * (n - 1)) / 2);
    });
  });

  describe('Search Lab Invariants', () => {
    it('performs linear search and binary search accurately on prepared array', () => {
      const arr = [50, 10, 40, 20, 30];
      const sorted = client.prepareSearch(arr);
      expect(sorted).toEqual([10, 20, 30, 40, 50]);

      // Target present: 40 -> index 3
      const linFound = client.search(SEARCH_LINEAR, 40, sorted.length);
      expect(linFound.foundIndex).toBe(3);
      expect(linFound.comparisons).toBe(4);
      expect(linFound.steps).toHaveLength(4);

      const binFound = client.search(SEARCH_BINARY, 40, sorted.length);
      expect(binFound.foundIndex).toBe(3);
      expect(binFound.comparisons).toBeGreaterThan(0);
      expect(binFound.comparisons).toBeLessThanOrEqual(3);

      // Target missing: 25 -> -1
      const linMiss = client.search(SEARCH_LINEAR, 25, sorted.length);
      expect(linMiss.foundIndex).toBe(-1);
      expect(linMiss.comparisons).toBe(sorted.length);

      const binMiss = client.search(SEARCH_BINARY, 25, sorted.length);
      expect(binMiss.foundIndex).toBe(-1);
    });
  });
});
