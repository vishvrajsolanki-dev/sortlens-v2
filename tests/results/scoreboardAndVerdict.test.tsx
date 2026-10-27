import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Scoreboard } from '../../src/components/results/Scoreboard';
import { PredictionVerdict } from '../../src/components/results/PredictionVerdict';
import type { TraceSession } from '../../src/engine/types';
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

function createMockSession(overrides: Partial<TraceSession> & { algo: number }): TraceSession {
  return {
    initialArray: [1, 2, 3],
    events: [],
    cComparisons: 10,
    cWrites: 5,
    cMaxDepth: 1,
    cOverflow: false,
    sortedArray: [1, 2, 3],
    ...overrides,
  };
}

describe('Scoreboard & PredictionVerdict Component Suite', () => {
  const dummySessions: TraceSession[] = [
    createMockSession({ algo: ALGO_BUBBLE, cComparisons: 45, cWrites: 30, cMaxDepth: 0 }),
    createMockSession({ algo: ALGO_SELECTION, cComparisons: 45, cWrites: 18, cMaxDepth: 0 }),
    createMockSession({ algo: ALGO_INSERTION, cComparisons: 15, cWrites: 15, cMaxDepth: 0 }),
    createMockSession({ algo: ALGO_QUICK, cComparisons: 32, cWrites: 24, cMaxDepth: 4 }),
    createMockSession({ algo: ALGO_MERGE, cComparisons: 28, cWrites: 40, cMaxDepth: 3 }),
  ];

  describe('Scoreboard', () => {
    it('is completely hidden when isComplete is false (zero outcome leakage)', () => {
      const { container } = render(
        <Scoreboard
          sessions={dummySessions}
          judgeBy={JUDGE_COMPARISONS}
          predictedAlgo={ALGO_INSERTION}
          isComplete={false}
        />
      );
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('renders results table with correct rankings when isComplete is true', () => {
      render(
        <Scoreboard
          sessions={dummySessions}
          judgeBy={JUDGE_COMPARISONS}
          predictedAlgo={ALGO_INSERTION}
          isComplete={true}
        />
      );

      expect(screen.getByRole('table', { name: /final race results/i })).toBeInTheDocument();

      // Insertion sort has lowest comparisons (15) -> Rank 1
      expect(screen.getByText('Insertion Sort')).toBeInTheDocument();
      expect(screen.getByText('★ PREDICTED')).toBeInTheDocument();

      // Quick sort has 4 frames stack depth, Selection has '-'
      expect(screen.getByText('4 frames')).toBeInTheDocument();
    });

    it('accurately detects and displays honest ties (e.g. T-1)', () => {
      // Create a tie for Rank 1 between Bubble and Insertion (both 10 comparisons)
      const tiedSessions: TraceSession[] = [
        createMockSession({ algo: ALGO_BUBBLE, cComparisons: 10, cWrites: 10 }),
        createMockSession({ algo: ALGO_INSERTION, cComparisons: 10, cWrites: 10 }),
        createMockSession({ algo: ALGO_SELECTION, cComparisons: 20, cWrites: 20 }),
      ];

      render(
        <Scoreboard
          sessions={tiedSessions}
          judgeBy={JUDGE_COMPARISONS}
          predictedAlgo={ALGO_BUBBLE}
          isComplete={true}
        />
      );

      // Both should show 'T-1' rank badge
      const tieBadges = screen.getAllByText('T-1');
      expect(tieBadges).toHaveLength(2);
    });

    it('ranks by writes when judgeBy is JUDGE_WRITES', () => {
      render(
        <Scoreboard
          sessions={dummySessions}
          judgeBy={JUDGE_WRITES}
          predictedAlgo={ALGO_INSERTION}
          isComplete={true}
        />
      );

      // By writes: Insertion is 15 (Rank 1), Selection is 18 (Rank 2)
      expect(screen.getByText(/verified final operation counts ranked by writes/i)).toBeInTheDocument();
    });

    it('displays overflow alert when a lane exceeds trace capacity', () => {
      const overflowSessions: TraceSession[] = [
        createMockSession({ algo: ALGO_BUBBLE, cOverflow: true }),
      ];

      render(
        <Scoreboard
          sessions={overflowSessions}
          judgeBy={JUDGE_COMPARISONS}
          predictedAlgo={ALGO_BUBBLE}
          isComplete={true}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent(/reached maximum trace recording limit/i);
    });
  });

  describe('PredictionVerdict', () => {
    it('is completely hidden when isComplete is false', () => {
      const { container } = render(
        <PredictionVerdict
          sessions={dummySessions}
          predictedAlgo={ALGO_INSERTION}
          judgeBy={JUDGE_COMPARISONS}
          isComplete={false}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('generates CONFIRMED verdict when predicted algorithm uniquely wins', () => {
      // Insertion sort is lowest with 15 comparisons, matching prediction
      render(
        <PredictionVerdict
          sessions={dummySessions}
          predictedAlgo={ALGO_INSERTION}
          judgeBy={JUDGE_COMPARISONS}
          isComplete={true}
        />
      );

      expect(screen.getByText(/^PREDICTION CONFIRMED$/i)).toBeInTheDocument();
      expect(screen.getByText(/model prediction confirmed: insertion sort won/i)).toBeInTheDocument();
    });

    it('generates MISSED verdict when a different algorithm wins', () => {
      // Model predicted Quick Sort, but Insertion sort won
      render(
        <PredictionVerdict
          sessions={dummySessions}
          predictedAlgo={ALGO_QUICK}
          judgeBy={JUDGE_COMPARISONS}
          isComplete={true}
        />
      );

      expect(screen.getByText(/^PREDICTION MISSED$/i)).toBeInTheDocument();
      expect(screen.getByText(/model prediction missed: insertion sort won/i)).toBeInTheDocument();
    });

    it('generates INCONCLUSIVE verdict when multiple algorithms tie for Rank 1', () => {
      const tiedSessions: TraceSession[] = [
        createMockSession({ algo: ALGO_BUBBLE, cComparisons: 10 }),
        createMockSession({ algo: ALGO_INSERTION, cComparisons: 10 }),
        createMockSession({ algo: ALGO_MERGE, cComparisons: 30 }),
      ];

      render(
        <PredictionVerdict
          sessions={tiedSessions}
          predictedAlgo={ALGO_BUBBLE}
          judgeBy={JUDGE_COMPARISONS}
          isComplete={true}
        />
      );

      expect(screen.getByText(/INCONCLUSIVE \(TIE\)/i)).toBeInTheDocument();
      expect(screen.getByText(/tied race outcome/i)).toBeInTheDocument();
    });

    it('generates UNAVAILABLE verdict when any session has overflow', () => {
      const overflowSessions: TraceSession[] = [
        createMockSession({ algo: ALGO_BUBBLE, cOverflow: true }),
      ];

      render(
        <PredictionVerdict
          sessions={overflowSessions}
          predictedAlgo={ALGO_BUBBLE}
          judgeBy={JUDGE_COMPARISONS}
          isComplete={true}
        />
      );

      expect(screen.getByText(/VERDICT UNAVAILABLE/i)).toBeInTheDocument();
      expect(screen.getByText(/execution overflow detected/i)).toBeInTheDocument();
    });
  });
});
