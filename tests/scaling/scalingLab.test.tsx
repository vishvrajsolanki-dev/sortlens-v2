import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getCoreClient } from '../../src/core/adapter/createCoreClient';
import type { CoreClient } from '../../src/core/adapter/types';
import {
  ALGO_SELECTION,
  ALGO_MERGE,
  JUDGE_COMPARISONS,
  JUDGE_WRITES,
} from '../../src/core/adapter/types';
import { runScalingBenchmark } from '../../src/components/scaling/ScalingBenchmark';
import { ScalingLab } from '../../src/components/scaling/ScalingLab';

describe('Scaling Lab Suite — Empirical Algorithm Benchmarks & Complexity Curves', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  describe('Empirical Benchmark Engine Execution', () => {
    it('executes real C sorting runs across multiple sizes and records measurements', async () => {
      const testSizes = [10, 20, 30];
      const result = await runScalingBenchmark(client, {
        pattern: 'random',
        judgeBy: JUDGE_COMPARISONS,
        seed: 42,
        sizes: testSizes,
      });

      expect(result.status).toBe('complete');
      expect(result.sizes).toEqual(testSizes);
      expect(result.validCount).toBe(3 * 5); // 3 sizes × 5 algorithms = 15 measurements
      expect(result.points).toHaveLength(15);

      // Verify Selection Sort comparisons invariant: n(n-1)/2
      const sel10 = result.points.find((p) => p.n === 10 && p.algo === ALGO_SELECTION);
      const sel20 = result.points.find((p) => p.n === 20 && p.algo === ALGO_SELECTION);
      const sel30 = result.points.find((p) => p.n === 30 && p.algo === ALGO_SELECTION);

      expect(sel10?.comparisons).toBe((10 * 9) / 2); // 45
      expect(sel20?.comparisons).toBe((20 * 19) / 2); // 190
      expect(sel30?.comparisons).toBe((30 * 29) / 2); // 435
    });

    it('produces identical measurements when executed with identical seed and pattern', async () => {
      const run1 = await runScalingBenchmark(client, {
        pattern: 'nearly',
        judgeBy: JUDGE_WRITES,
        seed: 777,
        sizes: [10, 20],
      });

      const run2 = await runScalingBenchmark(client, {
        pattern: 'nearly',
        judgeBy: JUDGE_WRITES,
        seed: 777,
        sizes: [10, 20],
      });

      expect(run1.points).toEqual(run2.points);
    });

    it('demonstrates that Merge Sort exhibits linearithmic growth compared to quadratic Bubble sort', async () => {
      const result = await runScalingBenchmark(client, {
        pattern: 'reverse',
        judgeBy: JUDGE_COMPARISONS,
        seed: 123,
        sizes: [10, 50],
      });

      const bubble10 = result.points.find((p) => p.n === 10 && p.algo === 0)!;
      const bubble50 = result.points.find((p) => p.n === 50 && p.algo === 0)!;
      const merge10 = result.points.find((p) => p.n === 10 && p.algo === ALGO_MERGE)!;
      const merge50 = result.points.find((p) => p.n === 50 && p.algo === ALGO_MERGE)!;

      // On reverse array: Bubble sort is strictly quadratic n(n-1)/2
      expect(bubble10.comparisons).toBe((10 * 9) / 2); // 45
      expect(bubble50.comparisons).toBe((50 * 49) / 2); // 1225
      // Bubble comparisons grew by factor of ~27.2 (approx (50/10)^2 = 25)
      expect(bubble50.comparisons / bubble10.comparisons).toBeGreaterThan(25);

      // Merge sort comparisons grow much more slowly (50 log 50 / 10 log 10 ≈ 8.5)
      expect(merge50.comparisons / merge10.comparisons).toBeLessThan(15);
    });
  });

  describe('ScalingLab Component Interactive UI', () => {
    it('renders configuration panel, SVG chart, and metadata card upon mount', async () => {
      render(<ScalingLab client={client} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Empirical Complexity Scaling Lab — O\(n²\) vs\. O\(n log n\)/i)
        ).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /empirical algorithm scaling chart/i })).toBeInTheDocument();
        expect(screen.getByText(/BENCHMARK EXPERIMENT METADATA:/i)).toBeInTheDocument();
      });

      // Toggles are present
      expect(screen.getByLabelText(/Show Theoretical Asymptotics/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Show C Cost Model Predictions/i)).toBeInTheDocument();
    });

    it('switches between Chart View and Accessible Data Table View', async () => {
      render(<ScalingLab client={client} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /data table/i })).toBeInTheDocument();
      });

      const tableTab = screen.getByRole('tab', { name: /data table/i });
      fireEvent.click(tableTab);

      await waitFor(() => {
        expect(
          screen.getByRole('table', { name: /empirical measurements data table/i })
        ).toBeInTheDocument();
        expect(screen.getByText('Bubble Sort')).toBeInTheDocument();
        expect(screen.getByText('Quick (Lomuto)')).toBeInTheDocument();
      });
    });
  });
});
