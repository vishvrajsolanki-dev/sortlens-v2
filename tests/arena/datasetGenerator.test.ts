import { describe, it, expect } from 'vitest';
import {
  createRng,
  generateDataset,
  parseCustomArray,
} from '../../src/core/dataset/generator';

describe('datasetGenerator — PRNG, Synthetic Patterns & Input Validation', () => {
  describe('createRng (Mulberry32 PRNG)', () => {
    it('produces deterministic output given identical seeds', () => {
      const rng1 = createRng(42);
      const rng2 = createRng(42);

      const seq1 = Array.from({ length: 10 }, () => rng1());
      const seq2 = Array.from({ length: 10 }, () => rng2());

      expect(seq1).toEqual(seq2);
    });

    it('produces distinct sequences for different seeds', () => {
      const rng1 = createRng(100);
      const rng2 = createRng(200);

      const val1 = rng1();
      const val2 = rng2();

      expect(val1).not.toBe(val2);
    });

    it('generates values bounded in [0, 1)', () => {
      const rng = createRng(999);
      for (let i = 0; i < 100; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('generateDataset', () => {
    it('clamps size within bounds [2, 100]', () => {
      const tooSmall = generateDataset('random', 0, 123);
      expect(tooSmall).toHaveLength(2);

      const tooLarge = generateDataset('random', 250, 123);
      expect(tooLarge).toHaveLength(100);
    });

    it('generates monotonically non-decreasing array for "sorted" pattern', () => {
      const arr = generateDataset('sorted', 20, 123);
      expect(arr).toHaveLength(20);
      for (let i = 0; i < arr.length - 1; i++) {
        expect(arr[i]).toBeLessThanOrEqual(arr[i + 1]!);
      }
    });

    it('generates monotonically non-increasing array for "reverse" pattern', () => {
      const arr = generateDataset('reverse', 20, 123);
      expect(arr).toHaveLength(20);
      for (let i = 0; i < arr.length - 1; i++) {
        expect(arr[i]).toBeGreaterThanOrEqual(arr[i + 1]!);
      }
    });

    it('generates array with restricted distinct values for "few_unique" pattern', () => {
      const arr = generateDataset('few_unique', 30, 42);
      expect(arr).toHaveLength(30);
      const uniqueVals = new Set(arr);
      expect(uniqueVals.size).toBeLessThanOrEqual(4);
      for (const val of arr) {
        expect([15, 38, 62, 85]).toContain(val);
      }
    });

    it('generates array bounded in [1, 99] for "random" pattern', () => {
      const arr = generateDataset('random', 40, 777);
      expect(arr).toHaveLength(40);
      for (const val of arr) {
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(99);
      }
    });

    it('generates nearly sorted array with mostly preserved ordering', () => {
      const arr = generateDataset('nearly_sorted', 30, 888);
      expect(arr).toHaveLength(30);
      // Count inversions: should be significantly lower than a reversed array
      let inversions = 0;
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (arr[i]! > arr[j]!) inversions++;
        }
      }
      // Maximum possible inversions for N=30 is 30*29/2 = 435.
      // Nearly sorted should have very few inversions (typically < 30).
      expect(inversions).toBeLessThan(35);
    });
  });

  describe('parseCustomArray', () => {
    it('correctly parses valid comma-separated integer input', () => {
      const result = parseCustomArray('10, 25, 3, 99, 80');
      expect(result).toEqual([10, 25, 3, 99, 80]);
    });

    it('handles extra whitespace and trailing commas', () => {
      const result = parseCustomArray('   5 ,  12 , 44 , 99 , ');
      expect(result).toEqual([5, 12, 44, 99]);
    });

    it('throws error for empty or whitespace-only input', () => {
      expect(() => parseCustomArray('')).toThrow('cannot be empty');
      expect(() => parseCustomArray('   ')).toThrow('cannot be empty');
    });

    it('throws error if array has fewer than 2 elements', () => {
      expect(() => parseCustomArray('42')).toThrow('too small. Minimum size is 2');
    });

    it('throws error if array exceeds 100 elements', () => {
      const elements = Array.from({ length: 101 }, (_, i) => String((i % 99) + 1)).join(', ');
      expect(() => parseCustomArray(elements)).toThrow('exceeds maximum limit of 100');
    });

    it('accepts exact boundary lengths N=2 and N=100', () => {
      expect(parseCustomArray('1, 99')).toEqual([1, 99]);
      const hundred = Array.from({ length: 100 }, (_, i) => String((i % 99) + 1)).join(', ');
      expect(parseCustomArray(hundred)).toHaveLength(100);
    });

    it('throws error on non-integer input or characters', () => {
      expect(() => parseCustomArray('10, 20, 3.14, 40')).toThrow('not a valid integer');
      expect(() => parseCustomArray('10, abc, 30')).toThrow('not a valid integer');
    });

    it('strictly tests value boundary regression: rejects 0 and 100, accepts 1 and 99', () => {
      // Rejects below minimum (< 1)
      expect(() => parseCustomArray('10, 0, 30')).toThrow('must be between 1 and 99');
      expect(() => parseCustomArray('10, -5, 30')).toThrow('must be between 1 and 99');

      // Rejects above maximum (> 99)
      expect(() => parseCustomArray('10, 100, 30')).toThrow('must be between 1 and 99');
      expect(() => parseCustomArray('10, 999, 30')).toThrow('must be between 1 and 99');

      // Accepts exact boundaries 1 and 99
      expect(parseCustomArray('1, 99')).toEqual([1, 99]);
    });
  });
});
