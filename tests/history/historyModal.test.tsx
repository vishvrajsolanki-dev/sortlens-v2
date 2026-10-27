import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { HistoryModal } from '../../src/components/history/HistoryModal';
import { saveCompletedRun, clearHistory } from '../../src/state/persistence';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
  JUDGE_TOTAL,
} from '../../src/core/adapter/types';

describe('HistoryModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
    clearHistory();
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<HistoryModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty state message when no completed runs exist', () => {
    render(<HistoryModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/race telemetry history/i)).toBeInTheDocument();
    expect(screen.getByText(/no completed runs logged/i)).toBeInTheDocument();
  });

  it('displays recorded runs with winner and prediction hit badge', () => {
    saveCompletedRun({
      id: 'run-alpha',
      timestamp: 1700000000000,
      arraySize: 25,
      pattern: 'random',
      judgeBy: JUDGE_TOTAL,
      winnerAlgo: ALGO_MERGE,
      winnerCost: 142,
      predictedAlgo: ALGO_MERGE,
      predictionCorrect: true,
      lanes: [
        { algo: ALGO_BUBBLE, comparisons: 200, writes: 100, totalOps: 300, maxDepth: 0, rank: 5, tie: false },
        { algo: ALGO_SELECTION, comparisons: 200, writes: 24, totalOps: 224, maxDepth: 0, rank: 4, tie: false },
        { algo: ALGO_INSERTION, comparisons: 100, writes: 100, totalOps: 200, maxDepth: 0, rank: 3, tie: false },
        { algo: ALGO_QUICK, comparisons: 90, writes: 60, totalOps: 150, maxDepth: 6, rank: 2, tie: false },
        { algo: ALGO_MERGE, comparisons: 80, writes: 62, totalOps: 142, maxDepth: 5, rank: 1, tie: false },
      ],
    });

    render(<HistoryModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText(/1 \/ 200 runs/i)).toBeInTheDocument();
    expect(screen.getByText(/N=25 • random/i)).toBeInTheDocument();
    expect(screen.getByText(/Merge Sort/i)).toBeInTheDocument();
    expect(screen.getByText(/PREDICTION HIT/i)).toBeInTheDocument();
  });

  it('expands run details upon click to display the 5-lane breakdown table', () => {
    saveCompletedRun({
      id: 'run-expand-test',
      timestamp: Date.now(),
      arraySize: 10,
      pattern: 'sorted',
      judgeBy: JUDGE_TOTAL,
      winnerAlgo: ALGO_INSERTION,
      winnerCost: 9,
      predictedAlgo: ALGO_INSERTION,
      predictionCorrect: true,
      lanes: [
        { algo: ALGO_INSERTION, comparisons: 9, writes: 0, totalOps: 9, maxDepth: 0, rank: 1, tie: false },
        { algo: ALGO_BUBBLE, comparisons: 9, writes: 0, totalOps: 9, maxDepth: 0, rank: 1, tie: true },
        { algo: ALGO_QUICK, comparisons: 20, writes: 10, totalOps: 30, maxDepth: 9, rank: 3, tie: false },
        { algo: ALGO_MERGE, comparisons: 22, writes: 15, totalOps: 37, maxDepth: 4, rank: 4, tie: false },
        { algo: ALGO_SELECTION, comparisons: 45, writes: 0, totalOps: 45, maxDepth: 0, rank: 5, tie: false },
      ],
    });

    render(<HistoryModal isOpen={true} onClose={() => {}} />);

    const runCard = screen.getByTestId('history-item-run-expand-test');
    const clickableRow = runCard.querySelector('[role="button"]')!;

    // Initially table not visible
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(clickableRow);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText(/Comparisons/i)).toBeInTheDocument();
    expect(screen.getByText(/Writes/i)).toBeInTheDocument();
  });

  it('handles clearing history with confirmation flow', () => {
    saveCompletedRun({
      id: 'run-to-delete',
      timestamp: Date.now(),
      arraySize: 15,
      pattern: 'reverse',
      judgeBy: JUDGE_TOTAL,
      winnerAlgo: ALGO_MERGE,
      winnerCost: 80,
      predictedAlgo: null,
      predictionCorrect: null,
      lanes: [
        { algo: ALGO_BUBBLE, comparisons: 105, writes: 105, totalOps: 210, maxDepth: 0, rank: 5, tie: false },
        { algo: ALGO_SELECTION, comparisons: 105, writes: 14, totalOps: 119, maxDepth: 0, rank: 4, tie: false },
        { algo: ALGO_INSERTION, comparisons: 105, writes: 105, totalOps: 210, maxDepth: 0, rank: 5, tie: true },
        { algo: ALGO_QUICK, comparisons: 60, writes: 30, totalOps: 90, maxDepth: 5, rank: 2, tie: false },
        { algo: ALGO_MERGE, comparisons: 50, writes: 30, totalOps: 80, maxDepth: 4, rank: 1, tie: false },
      ],
    });

    render(<HistoryModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText(/N=15 • reverse/i)).toBeInTheDocument();

    const clearBtn = screen.getByText(/Clear History/i);
    fireEvent.click(clearBtn);

    // Button should now ask for confirmation
    const confirmBtn = screen.getByText(/Confirm Clear All/i);
    expect(confirmBtn).toBeInTheDocument();

    // Confirm click
    fireEvent.click(confirmBtn);

    // Should now show empty state
    expect(screen.getByText(/no completed runs logged/i)).toBeInTheDocument();
  });

  it('triggers JSON export download via blob', () => {
    saveCompletedRun({
      id: 'run-export-test',
      timestamp: Date.now(),
      arraySize: 20,
      pattern: 'random',
      judgeBy: JUDGE_TOTAL,
      winnerAlgo: ALGO_MERGE,
      winnerCost: 100,
      predictedAlgo: ALGO_MERGE,
      predictionCorrect: true,
      lanes: [
        { algo: ALGO_BUBBLE, comparisons: 190, writes: 95, totalOps: 285, maxDepth: 0, rank: 5, tie: false },
        { algo: ALGO_SELECTION, comparisons: 190, writes: 19, totalOps: 209, maxDepth: 0, rank: 4, tie: false },
        { algo: ALGO_INSERTION, comparisons: 95, writes: 95, totalOps: 190, maxDepth: 0, rank: 3, tie: false },
        { algo: ALGO_QUICK, comparisons: 80, writes: 50, totalOps: 130, maxDepth: 5, rank: 2, tie: false },
        { algo: ALGO_MERGE, comparisons: 70, writes: 30, totalOps: 100, maxDepth: 4, rank: 1, tie: false },
      ],
    });

    const createObjectURLSpy = vi.fn().mockReturnValue('blob:test-url');
    const revokeObjectURLSpy = vi.fn();
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    render(<HistoryModal isOpen={true} onClose={() => {}} />);

    const exportBtn = screen.getByText(/Export JSON/i);
    fireEvent.click(exportBtn);

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
  });
});
