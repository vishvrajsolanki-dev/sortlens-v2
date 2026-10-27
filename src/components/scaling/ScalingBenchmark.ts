import type { CoreClient, AlgorithmId } from '../../core/adapter/types';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
} from '../../core/adapter/types';
import type { DatasetPattern } from '../../state/appStore';
import { generateDataset } from '../../core/dataset/generator';
import type { BenchmarkOptions, ScalingBenchmarkResult, ScalingDataPoint } from './types';

export const DEFAULT_SIZES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const ALL_ALGOS: AlgorithmId[] = [
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
];

function isSorted(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i]! < arr[i - 1]!) return false;
  }
  return true;
}

export async function runScalingBenchmark(
  client: CoreClient,
  options: BenchmarkOptions
): Promise<ScalingBenchmarkResult> {
  if (!client.isReady()) {
    throw new Error('CoreClient is not initialized.');
  }

  const sizes = options.sizes && options.sizes.length > 0 ? options.sizes : DEFAULT_SIZES;
  const points: ScalingDataPoint[] = [];
  const sessionId = `bench_${Date.now()}_${options.seed}`;
  const timestamp = new Date().toISOString();

  // Map benchmark pattern to dataset generator pattern
  const generatorPattern: DatasetPattern =
    options.pattern === 'nearly'
      ? 'nearly_sorted'
      : options.pattern;

  for (const n of sizes) {
    if (n < 2 || n > 100) continue;

    // 1. Generate deterministic dataset
    const dataset = generateDataset(generatorPattern, n, options.seed);

    // 2. Perform shape analysis and retrieve cost model estimates
    const analysis = client.analyze(dataset, options.judgeBy);

    // 3. Execute all 5 algorithms in C core with recordTrace = false (maximum native execution speed)
    for (const algo of ALL_ALGOS) {
      const result = client.runSort(algo, n, false);

      // Validate output integrity
      if (!isSorted(result.sortedArray)) {
        throw new Error(`Integrity check failed: algorithm ${algo} did not produce a sorted array at size ${n}`);
      }

      const comparisons = Number(result.comparisons);
      const writes = Number(result.writes);
      const total = comparisons + writes;
      const estimate = Number(analysis.estimates[algo] ?? 0);

      points.push({
        n,
        algo,
        comparisons,
        writes,
        total,
        estimate,
        inversions: Number(analysis.inversions),
        inversionRatio: analysis.inversionRatio,
      });
    }
  }

  return {
    sessionId,
    timestamp,
    seed: options.seed,
    pattern: options.pattern,
    judgeBy: options.judgeBy,
    sizes,
    points,
    validCount: points.length,
    status: 'complete',
  };
}
