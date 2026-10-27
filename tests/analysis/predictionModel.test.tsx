import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getCoreClient } from '../../src/core/adapter/createCoreClient';
import type { CoreClient } from '../../src/core/adapter/types';
import {
  ALGO_INSERTION,
  ALGO_MERGE,
  ALGO_SELECTION,
  ALGO_BUBBLE,
  ALGO_QUICK,
  ALGORITHM_NAMES,
  JUDGE_COMPARISONS,
  JUDGE_WRITES,
  JUDGE_TOTAL,
} from '../../src/core/adapter/types';
import { PredictionPanel } from '../../src/components/analysis/PredictionPanel';
import { generateDataset } from '../../src/core/dataset/generator';

describe('Empirical Cost Model Prediction & Reveal Protection', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  it('guarantees predicted algorithm matches minimum estimate across all 5 algorithms', () => {
    const arr = generateDataset('random', 20, 123);
    const analysis = client.analyze(arr, JUDGE_COMPARISONS);

    expect(analysis.estimates).toHaveLength(5);
    const minEstimate = Math.min(...analysis.estimates);
    const expectedAlgo = analysis.estimates.indexOf(minEstimate);

    expect(analysis.predictedAlgo).toBe(expectedAlgo);
  });

  it('predicts Insertion Sort on nearly sorted array judging by comparisons', () => {
    const nearlySorted = generateDataset('nearly_sorted', 30, 42);
    const analysis = client.analyze(nearlySorted, JUDGE_COMPARISONS);

    expect(analysis.predictedAlgo).toBe(ALGO_INSERTION);
    expect(analysis.reason).toMatch(/insertion/i);
  });

  it('predicts Selection Sort or Insertion Sort judging by writes on reverse array', () => {
    const reversed = generateDataset('reverse', 20, 99);
    const analysisWrites = client.analyze(reversed, JUDGE_WRITES);

    // On reverse array: Selection sort does exactly 2(n-1) = 38 writes, which is far lower than Bubble (2*I) or Insertion (I+n-1)
    expect(analysisWrites.predictedAlgo).toBe(ALGO_SELECTION);
    expect(analysisWrites.estimates[ALGO_SELECTION]).toBe(2 * (20 - 1));
  });

  it('updates estimates when judging by total operations', () => {
    const arr = [10, 20, 30, 40, 50];
    const compAnalysis = client.analyze(arr, JUDGE_COMPARISONS);
    const writeAnalysis = client.analyze(arr, JUDGE_WRITES);
    const totalAnalysis = client.analyze(arr, JUDGE_TOTAL);

    for (let i = 0; i < 5; i++) {
      expect(totalAnalysis.estimates[i]).toBe(
        compAnalysis.estimates[i]! + writeAnalysis.estimates[i]!
      );
    }
  });

  it('strictly conceals predicted algorithm when isRevealed is false (zero leakage)', () => {
    const arr = [50, 20, 80, 10, 40];
    const analysis = client.analyze(arr, JUDGE_COMPARISONS);
    const predictedName = ALGORITHM_NAMES[analysis.predictedAlgo];

    const { container } = render(
      <PredictionPanel
        analysis={analysis}
        judgeBy={JUDGE_COMPARISONS}
        isRevealed={false}
        onToggleReveal={() => {}}
      />
    );

    // The predicted algorithm name must NOT appear in the rendered document or attributes
    expect(screen.queryByText(predictedName)).not.toBeInTheDocument();
    expect(screen.queryByText(/PREDICTED WINNER/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Verify raw HTML does not leak the name
    expect(container.innerHTML).not.toContain(predictedName);

    // Prompts student to hypothesize first
    expect(screen.getByText(/hypothesize before revealing/i)).toBeInTheDocument();
  });

  it('reveals predicted winner, estimates table, and C rationale when isRevealed is true', () => {
    const arr = [50, 20, 80, 10, 40];
    const analysis = client.analyze(arr, JUDGE_COMPARISONS);
    const predictedName = ALGORITHM_NAMES[analysis.predictedAlgo];

    let revealed = false;
    const toggle = () => {
      revealed = !revealed;
    };

    const { rerender } = render(
      <PredictionPanel
        analysis={analysis}
        judgeBy={JUDGE_COMPARISONS}
        isRevealed={revealed}
        onToggleReveal={toggle}
      />
    );

    // Click reveal button
    const revealBtn = screen.getAllByRole('button', { name: /reveal model prediction/i })[0]!;
    fireEvent.click(revealBtn);
    expect(revealed).toBe(true);

    // Rerender with revealed=true
    rerender(
      <PredictionPanel
        analysis={analysis}
        judgeBy={JUDGE_COMPARISONS}
        isRevealed={true}
        onToggleReveal={toggle}
      />
    );

    // Now predicted winner is visible
    expect(screen.getAllByText(predictedName).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/PREDICTED WINNER/i)).toBeInTheDocument();
    expect(screen.getByText(analysis.reason)).toBeInTheDocument();

    // Table with all 5 algorithms is rendered
    const table = screen.getByRole('table', { name: /pre-run algorithm cost estimates/i });
    expect(table).toBeInTheDocument();
    expect(screen.getByText('Selection Sort')).toBeInTheDocument();
    expect(screen.getAllByText('Merge Sort (Top-down)').length).toBeGreaterThanOrEqual(1);
  });
});
