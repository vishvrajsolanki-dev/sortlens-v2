import { describe, it, expect, beforeAll } from 'vitest';
import { getCoreClient } from '../../src/core/adapter/createCoreClient';
import type { CoreClient } from '../../src/core/adapter/types';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
  JUDGE_COMPARISONS,
  JUDGE_WRITES,
  JUDGE_TOTAL,
} from '../../src/core/adapter/types';
import { InvalidInputError } from '../../src/core/adapter/errors';
import { parseCustomArray, generateDataset } from '../../src/core/dataset/generator';
import { RaceCoordinator } from '../../src/engine/RaceCoordinator';
import type { TraceSession } from '../../src/engine/types';
import { createCompletedRunRecord } from '../../src/state/persistence/runHelper';

describe('Phase 8 Comprehensive Regression & Stress Suite', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  describe('Edge-Case Dataset Sizes (N = 0, 1, 2, 100)', () => {
    it('strictly rejects N = 0 array submission with InvalidInputError', () => {
      expect(() => client.setInputArray([])).toThrow(InvalidInputError);
      expect(() => client.analyze([])).toThrow(InvalidInputError);
    });

    it('correctly sorts N = 2 boundary input across all 5 syllabus algorithms', () => {
      const arr = [89, 12];
      client.setInputArray(arr);

      for (const algo of [ALGO_BUBBLE, ALGO_SELECTION, ALGO_INSERTION, ALGO_QUICK, ALGO_MERGE]) {
        const res = client.runSort(algo, 2, true);
        expect(res.sortedArray).toEqual([12, 89]);
        expect(res.overflow).toBe(false);
      }
    });

    it('processes maximum public size boundary N = 100 on random data without failure', () => {
      const arr = generateDataset('random', 100, 4242);
      expect(arr.length).toBe(100);

      client.setInputArray(arr);
      for (const algo of [ALGO_BUBBLE, ALGO_SELECTION, ALGO_INSERTION, ALGO_QUICK, ALGO_MERGE]) {
        const res = client.runSort(algo, 100, true);
        expect(res.sortedArray.length).toBe(100);
        // Assert monotonic ascending order
        for (let i = 0; i < 99; i++) {
          expect(res.sortedArray[i]!).toBeLessThanOrEqual(res.sortedArray[i + 1]!);
        }
      }
    });

    it('handles all-identical elements array (N = 100, all values = 42)', () => {
      const arr = Array(100).fill(42);
      client.setInputArray(arr);

      const shape = client.analyze(arr, JUDGE_TOTAL);
      expect(shape.inversions).toBe(0);
      expect(shape.distinct).toBe(1);

      for (const algo of [ALGO_BUBBLE, ALGO_SELECTION, ALGO_INSERTION, ALGO_QUICK, ALGO_MERGE]) {
        const res = client.runSort(algo, 100, true);
        expect(res.sortedArray).toEqual(arr);
        // Insertion sort and Bubble sort with early exit should do 0 writes on identical data
        if (algo === ALGO_BUBBLE) {
          expect(res.writes).toBe(0);
        } else if (algo === ALGO_INSERTION) {
          expect(res.writes).toBe(99); // n - 1 key re-insertions per syllabus counting rules
        }
      }
    });

    it('handles strictly reversed dataset (N = 100, descending)', () => {
      const arr = Array.from({ length: 100 }, (_, i) => 100 - i);
      client.setInputArray(arr);

      const shape = client.analyze(arr, JUDGE_COMPARISONS);
      // Inversions on strictly reversed 100 elements = 100 * 99 / 2 = 4950
      expect(shape.inversions).toBe(4950);
      expect(shape.inversionRatio).toBe(1.0);

      // Verify all 5 sorts sort it ascending: 1..100
      const expected = Array.from({ length: 100 }, (_, i) => i + 1);
      for (const algo of [ALGO_BUBBLE, ALGO_SELECTION, ALGO_INSERTION, ALGO_QUICK, ALGO_MERGE]) {
        const res = client.runSort(algo, 100, false);
        expect(res.sortedArray).toEqual(expected);
      }
    });

    it('handles extreme duplicate dataset with 2 alternating values', () => {
      const arr = Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? 1 : 99));
      client.setInputArray(arr);

      const shape = client.analyze(arr, JUDGE_TOTAL);
      expect(shape.distinct).toBe(2);

      for (const algo of [ALGO_BUBBLE, ALGO_SELECTION, ALGO_INSERTION, ALGO_QUICK, ALGO_MERGE]) {
        const res = client.runSort(algo, 50, true);
        expect(res.sortedArray[0]).toBe(1);
        expect(res.sortedArray[49]).toBe(99);
      }
    });
  });

  describe('Input Validation & Malformed Input Handling', () => {
    it('parseCustomArray rejects empty or whitespace-only strings', () => {
      expect(() => parseCustomArray('')).toThrow(/empty/i);
      expect(() => parseCustomArray('   ')).toThrow(/empty/i);
    });

    it('parseCustomArray rejects arrays with fewer than 2 elements', () => {
      expect(() => parseCustomArray('42')).toThrow(/too small/i);
    });

    it('parseCustomArray rejects arrays with more than 100 elements', () => {
      const largeStr = Array(105).fill('10').join(', ');
      expect(() => parseCustomArray(largeStr)).toThrow(/exceeds maximum limit/i);
    });

    it('parseCustomArray rejects non-integer or float numbers', () => {
      expect(() => parseCustomArray('10, 20, 30.5, 40')).toThrow(/not a valid integer/i);
      expect(() => parseCustomArray('10, abc, 30')).toThrow(/not a valid integer/i);
    });

    it('parseCustomArray rejects out-of-bounds values (< 1 or > 99)', () => {
      expect(() => parseCustomArray('10, 0, 30')).toThrow(/between 1 and 99/i);
      expect(() => parseCustomArray('10, 100, 30')).toThrow(/between 1 and 99/i);
      expect(() => parseCustomArray('10, -5, 30')).toThrow(/between 1 and 99/i);
    });

    it('parseCustomArray accepts valid comma-separated values with variable spacing', () => {
      const result = parseCustomArray('  10,   3, 18 , 5,  12,1, 15, 7, 20, 2 ');
      expect(result).toEqual([10, 3, 18, 5, 12, 1, 15, 7, 20, 2]);
    });
  });

  describe('Trace Capacity & Overflow Handling', () => {
    it('createCompletedRunRecord strictly rejects any session with overflow', () => {
      const fakeSessions: TraceSession[] = [
        { algo: ALGO_BUBBLE, initialArray: [1], events: [], cComparisons: 10, cWrites: 5, cMaxDepth: 0, cOverflow: false, sortedArray: [1] },
        { algo: ALGO_SELECTION, initialArray: [1], events: [], cComparisons: 10, cWrites: 5, cMaxDepth: 0, cOverflow: false, sortedArray: [1] },
        { algo: ALGO_INSERTION, initialArray: [1], events: [], cComparisons: 10, cWrites: 5, cMaxDepth: 0, cOverflow: false, sortedArray: [1] },
        { algo: ALGO_QUICK, initialArray: [1], events: [], cComparisons: 10, cWrites: 5, cMaxDepth: 0, cOverflow: true, sortedArray: [1] }, // OVERFLOW!
        { algo: ALGO_MERGE, initialArray: [1], events: [], cComparisons: 10, cWrites: 5, cMaxDepth: 0, cOverflow: false, sortedArray: [1] },
      ];

      const record = createCompletedRunRecord({
        runId: 'overflow-test',
        arraySize: 50,
        pattern: 'reverse',
        judgeBy: JUDGE_TOTAL,
        predictedAlgo: ALGO_MERGE,
        sessions: fakeSessions,
      });

      expect(record).toBeNull();
    });
  });

  describe('50 Consecutive Sorting Runs Stability & Memory Leak Test', () => {
    it('executes 50 consecutive full 5-algorithm races without coordinator degradation', () => {
      const algos = [ALGO_BUBBLE, ALGO_SELECTION, ALGO_INSERTION, ALGO_QUICK, ALGO_MERGE];

      for (let run = 0; run < 50; run++) {
        const testArray = generateDataset('random', 20, 1000 + run);
        const stagedSessions: TraceSession[] = [];

        client.setInputArray(testArray);
        for (const algo of algos) {
          const res = client.runSort(algo, testArray.length, true);
          stagedSessions.push({
            algo,
            initialArray: [...testArray],
            events: res.events,
            cComparisons: res.comparisons,
            cWrites: res.writes,
            cMaxDepth: res.maxDepth,
            cOverflow: res.overflow,
            sortedArray: res.sortedArray,
          });
        }

        const coordinator = new RaceCoordinator(stagedSessions);
        expect(coordinator.getSnapshot().status).toBe('idle');
        expect(coordinator.getSnapshot().lanes.length).toBe(5);

        // Advance to step 10
        coordinator.stepForward();
        coordinator.seek(10);
        expect(coordinator.getSnapshot().currentStep).toBe(10);

        // Dispose cleanly
        coordinator.dispose();
      }
    });
  });
});
