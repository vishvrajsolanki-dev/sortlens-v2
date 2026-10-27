import type { JudgeMetric, AlgorithmId } from '../../core/adapter/types';

export type BenchmarkPattern = 'random' | 'nearly' | 'reverse' | 'sorted' | 'few_unique';

export interface ScalingDataPoint {
  n: number;
  algo: AlgorithmId;
  comparisons: number;
  writes: number;
  total: number;
  estimate: number;
  inversions: number;
  inversionRatio: number;
}

export interface ScalingBenchmarkResult {
  sessionId: string;
  timestamp: string;
  seed: number;
  pattern: BenchmarkPattern;
  judgeBy: JudgeMetric;
  sizes: number[];
  points: ScalingDataPoint[];
  validCount: number;
  status: 'complete' | 'error';
  errorMessage?: string;
}

export interface BenchmarkOptions {
  sizes?: number[];
  pattern: BenchmarkPattern;
  seed: number;
  judgeBy: JudgeMetric;
}
