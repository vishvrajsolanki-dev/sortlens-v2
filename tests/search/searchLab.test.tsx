import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getCoreClient } from '../../src/core/adapter/createCoreClient';
import type { CoreClient } from '../../src/core/adapter/types';
import { SEARCH_LINEAR, SEARCH_BINARY } from '../../src/core/adapter/types';
import { SearchStepPlayer } from '../../src/components/search/SearchStepPlayer';
import { SearchLab } from '../../src/components/search/SearchLab';

describe('Search Lab Suite — C99 Search Invariants & Interactive Workbench', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  describe('C Core Search Engine Parity & Invariants', () => {
    it('executes linear search and records steps correctly', () => {
      const arr = [10, 25, 42, 60, 88];
      const sorted = client.prepareSearch(arr);
      expect(sorted).toEqual([10, 25, 42, 60, 88]);

      // Target found at index 2 (42)
      const res = client.search(SEARCH_LINEAR, 42, sorted.length);
      expect(res.foundIndex).toBe(2);
      expect(res.comparisons).toBe(3); // 10, 25, 42
      expect(res.steps).toHaveLength(3);
      expect(res.steps[0]!.index).toBe(0);
      expect(res.steps[1]!.index).toBe(1);
      expect(res.steps[2]!.index).toBe(2);
    });

    it('executes binary search with logarithmic steps on sorted buffer', () => {
      // 7 elements: [5, 15, 25, 35, 45, 55, 65]
      const arr = [65, 5, 45, 15, 55, 25, 35];
      const sorted = client.prepareSearch(arr);
      expect(sorted).toEqual([5, 15, 25, 35, 45, 55, 65]);

      // Target = 55 (at index 5)
      // Step 1: low=0, high=6, mid=3 (value 35 < 55) -> low=4
      // Step 2: low=4, high=6, mid=5 (value 55 == 55) -> FOUND
      const res = client.search(SEARCH_BINARY, 55, sorted.length);
      expect(res.foundIndex).toBe(5);
      expect(res.comparisons).toBe(2);
      expect(res.steps).toHaveLength(2);

      expect(res.steps[0]!.low).toBe(0);
      expect(res.steps[0]!.high).toBe(6);
      expect(res.steps[0]!.index).toBe(3);

      expect(res.steps[1]!.low).toBe(4);
      expect(res.steps[1]!.high).toBe(6);
      expect(res.steps[1]!.index).toBe(5);
    });

    it('returns foundIndex = -1 when target is absent', () => {
      const arr = [10, 20, 30, 40, 50];
      const sorted = client.prepareSearch(arr);

      const linRes = client.search(SEARCH_LINEAR, 99, sorted.length);
      expect(linRes.foundIndex).toBe(-1);
      expect(linRes.comparisons).toBe(5); // Scanned all 5 elements

      const binRes = client.search(SEARCH_BINARY, 99, sorted.length);
      expect(binRes.foundIndex).toBe(-1);
      // ceil(log2(5 + 1)) = 3 comparisons
      expect(binRes.comparisons).toBeLessThanOrEqual(3);
    });

    it('handles duplicate targets according to C implementation contract', () => {
      const arr = [10, 20, 20, 20, 30];
      const sorted = client.prepareSearch(arr);

      const linRes = client.search(SEARCH_LINEAR, 20, sorted.length);
      const binRes = client.search(SEARCH_BINARY, 20, sorted.length);

      // Linear search strictly returns the first matching index (1)
      expect(linRes.foundIndex).toBe(1);

      // Binary search lands on midpoint index (2) and returns immediately
      expect(binRes.foundIndex).toBe(2);
      expect(sorted[binRes.foundIndex]).toBe(20);
    });

    it('handles boundary extremes (first and last elements)', () => {
      const arr = [2, 14, 33, 56, 78, 92];
      const sorted = client.prepareSearch(arr);

      // First element
      const firstRes = client.search(SEARCH_BINARY, 2, sorted.length);
      expect(firstRes.foundIndex).toBe(0);

      // Last element
      const lastRes = client.search(SEARCH_BINARY, 92, sorted.length);
      expect(lastRes.foundIndex).toBe(sorted.length - 1);
    });
  });

  describe('SearchStepPlayer Deterministic State Machine', () => {
    it('manages steps, single-stepping, seeking, and restart cleanly', () => {
      let activeStep = -1;
      const player = new SearchStepPlayer({
        totalSteps: 5,
        onStepChange: (idx) => {
          activeStep = idx;
        },
      });

      expect(player.getStep()).toBe(0);
      expect(player.getTotalSteps()).toBe(5);

      // Step forward
      expect(player.stepForward()).toBe(true);
      expect(player.getStep()).toBe(1);
      expect(activeStep).toBe(1);

      // Step backward
      expect(player.stepBackward()).toBe(true);
      expect(player.getStep()).toBe(0);
      expect(activeStep).toBe(0);

      // Cannot step backward past 0
      expect(player.stepBackward()).toBe(false);

      // Seek to step 3
      player.seek(3);
      expect(player.getStep()).toBe(3);

      // Seek with clamp
      player.seek(99);
      expect(player.getStep()).toBe(4);

      // Restart
      player.restart();
      expect(player.getStep()).toBe(0);

      player.destroy();
    });
  });

  describe('SearchLab Component Interactive UI', () => {
    it('renders search workbench, inputs, and side-by-side search visualizers', async () => {
      render(<SearchLab client={client} initialArray={[12, 45, 78, 23, 56]} />);

      await waitFor(() => {
        expect(screen.getByText(/Search Laboratory — Linear vs. Binary Search/i)).toBeInTheDocument();
        expect(screen.getByText(/ARRAY SYNCHRONIZATION GUARANTEE/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: /^Linear Search$/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: /^Binary Search$/i })).toBeInTheDocument();
      });

      // Target input is present
      const targetInput = screen.getByLabelText(/target search value/i);
      expect(targetInput).toBeInTheDocument();

      // Playback toolbar buttons
      expect(screen.getByRole('button', { name: /play search animation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /step forward one comparison/i })).toBeInTheDocument();
    });

    it('rejects invalid target values with user alert', async () => {
      render(<SearchLab client={client} initialArray={[10, 20, 30]} />);

      const targetInput = screen.getByLabelText(/target search value/i);
      fireEvent.change(targetInput, { target: { value: '150' } }); // > 99

      const setTargetBtn = screen.getByRole('button', { name: /set target/i });
      fireEvent.click(setTargetBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/must be an integer between 1 and 99/i);
      });
    });

    it('steps through search and displays final comparative takeaway banner upon completion', async () => {
      render(<SearchLab client={client} initialArray={[15, 30, 45, 60, 75]} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 3, name: /^Linear Search$/i })).toBeInTheDocument();
      });

      // Seek to end using timeline scrubber
      const scrubber = screen.getByRole('slider', { name: /search timeline scrubber/i });
      const maxVal = scrubber.getAttribute('max') || '5';
      fireEvent.change(scrubber, { target: { value: maxVal } });

      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: /comparative search analysis takeaway/i })
        ).toBeInTheDocument();
        expect(screen.getByText(/ALGORITHMIC EFFICIENCY COMPARISON/i)).toBeInTheDocument();
        expect(screen.getByText(/SEARCH ADVANTAGE:/i)).toBeInTheDocument();
      });
    });
  });
});
