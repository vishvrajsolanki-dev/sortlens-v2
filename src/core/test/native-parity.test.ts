import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getCoreClient } from '../adapter/createCoreClient';
import type { CoreClient, AlgorithmId } from '../adapter/types';
import { SEARCH_LINEAR, SEARCH_BINARY } from '../adapter/types';

interface ParityRun {
  algo: number;
  comparisons: number;
  writes: number;
  maxDepth: number;
  overflow: number;
  eventCount: number;
  sorted: number[];
}

interface ParityCase {
  name: string;
  n: number;
  input: number[];
  analysis: {
    inversions: number;
    inversionRatio: number;
    duplicateRatio: number;
    distinct: number;
    collisions: number;
    maxLeftGreater: number;
    predicted: number;
    reason: string;
    estimates: number[];
  };
  runs: ParityRun[];
  search: {
    targetPresent: number;
    targetAbsent: number;
    linear: {
      present: { index: number; comparisons: number; steps: number };
      absent: { index: number; comparisons: number; steps: number };
    };
    binary: {
      present: { index: number; comparisons: number; steps: number };
      absent: { index: number; comparisons: number; steps: number };
    };
  };
}

interface ParityData {
  cases: ParityCase[];
}

describe('Native C99 vs WebAssembly Parity Verification', () => {
  let client: CoreClient;
  let parityData: ParityData;

  beforeAll(async () => {
    client = await getCoreClient();
    const baselinePath = path.resolve(import.meta.dirname, '../../../tests/c/native_baseline.json');
    if (!fs.existsSync(baselinePath)) {
      throw new Error(`Native baseline JSON not found at ${baselinePath}. Run parity_harness first.`);
    }
    const raw = fs.readFileSync(baselinePath, 'utf8');
    parityData = JSON.parse(raw);
  });

  it('contains at least 8 valid native baseline test cases', () => {
    expect(parityData.cases.length).toBeGreaterThanOrEqual(8);
  });

  it('verifies exact parity across all 8 test cases and all 5 algorithms', () => {
    for (const testCase of parityData.cases) {
      // 1. Run Shape Analysis through WASM
      const wasmAnalysis = client.analyze(testCase.input);

      // Exact parity on integer metrics
      expect(
        wasmAnalysis.inversions,
        `Inversions mismatch on case ${testCase.name}`
      ).toBe(testCase.analysis.inversions);

      expect(
        wasmAnalysis.distinct,
        `Distinct mismatch on case ${testCase.name}`
      ).toBe(testCase.analysis.distinct);

      expect(
        wasmAnalysis.collisions,
        `Collisions mismatch on case ${testCase.name}`
      ).toBe(testCase.analysis.collisions);

      expect(
        wasmAnalysis.maxLeftGreater,
        `MaxLeftGreater mismatch on case ${testCase.name}`
      ).toBe(testCase.analysis.maxLeftGreater);

      expect(
        wasmAnalysis.predictedAlgo,
        `Predicted algorithm mismatch on case ${testCase.name}`
      ).toBe(testCase.analysis.predicted);

      expect(
        wasmAnalysis.estimates,
        `Estimates mismatch on case ${testCase.name}`
      ).toEqual(testCase.analysis.estimates);

      expect(wasmAnalysis.inversionRatio).toBeCloseTo(testCase.analysis.inversionRatio, 2);
      expect(wasmAnalysis.duplicateRatio).toBeCloseTo(testCase.analysis.duplicateRatio, 2);

      // 2. Run All 5 Sorting Algorithms through WASM
      for (const expectedRun of testCase.runs) {
        client.setInputArray(testCase.input);
        const wasmRun = client.runSort(expectedRun.algo as AlgorithmId, testCase.n, true);

        // Exact sorted array match
        expect(
          wasmRun.sortedArray,
          `Sorted array mismatch for algo ${expectedRun.algo} on case ${testCase.name}`
        ).toEqual(expectedRun.sorted);

        // Exact comparisons match
        expect(
          wasmRun.comparisons,
          `Comparisons mismatch for algo ${expectedRun.algo} on case ${testCase.name}`
        ).toBe(expectedRun.comparisons);

        // Exact writes match
        expect(
          wasmRun.writes,
          `Writes mismatch for algo ${expectedRun.algo} on case ${testCase.name}`
        ).toBe(expectedRun.writes);

        // Exact max recursion depth match
        expect(
          wasmRun.maxDepth,
          `Max depth mismatch for algo ${expectedRun.algo} on case ${testCase.name}`
        ).toBe(expectedRun.maxDepth);

        // Exact event count match
        expect(
          wasmRun.eventCount,
          `Event count mismatch for algo ${expectedRun.algo} on case ${testCase.name}`
        ).toBe(expectedRun.eventCount);

        // Overflow flag match
        expect(
          wasmRun.overflow ? 1 : 0,
          `Overflow flag mismatch for algo ${expectedRun.algo} on case ${testCase.name}`
        ).toBe(expectedRun.overflow);
      }

      // 3. Search Lab Parity
      const sorted = client.prepareSearch(testCase.input);

      // Linear search present
      const linPres = client.search(SEARCH_LINEAR, testCase.search.targetPresent, sorted.length);
      expect(linPres.foundIndex).toBe(testCase.search.linear.present.index);
      expect(linPres.comparisons).toBe(testCase.search.linear.present.comparisons);
      expect(linPres.steps.length).toBe(testCase.search.linear.present.steps);

      // Linear search absent
      const linAbs = client.search(SEARCH_LINEAR, testCase.search.targetAbsent, sorted.length);
      expect(linAbs.foundIndex).toBe(testCase.search.linear.absent.index);
      expect(linAbs.comparisons).toBe(testCase.search.linear.absent.comparisons);

      // Binary search present
      const binPres = client.search(SEARCH_BINARY, testCase.search.targetPresent, sorted.length);
      expect(binPres.foundIndex).toBe(testCase.search.binary.present.index);
      expect(binPres.comparisons).toBe(testCase.search.binary.present.comparisons);
      expect(binPres.steps.length).toBe(testCase.search.binary.present.steps);

      // Binary search absent
      const binAbs = client.search(SEARCH_BINARY, testCase.search.targetAbsent, sorted.length);
      expect(binAbs.foundIndex).toBe(testCase.search.binary.absent.index);
      expect(binAbs.comparisons).toBe(testCase.search.binary.absent.comparisons);
    }
  });
});
