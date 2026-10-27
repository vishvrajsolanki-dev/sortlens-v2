import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getCoreClient } from '../../src/core/adapter/createCoreClient';
import type { CoreClient } from '../../src/core/adapter/types';
import { SortingArena } from '../../src/components/arena/SortingArena';

describe('Phase 5 End-to-End Integration — Shape, Prediction, Race, and Scoreboard', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  it('coordinates shape analysis, concealed prediction, race completion, and final scoreboard', async () => {
    render(<SortingArena client={client} />);

    // 1. Pre-run shape analysis is displayed
    await waitFor(() => {
      expect(screen.getByText(/dataset shape analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/inversions \(i\):/i)).toBeInTheDocument();
      expect(screen.getByText(/max leftward displacement \(p\):/i)).toBeInTheDocument();
      expect(screen.getByText(/separate-chaining hash table/i)).toBeInTheDocument();
    });

    // 2. Prediction is hidden by default (zero leakage)
    expect(screen.getByText(/hypothesize before revealing/i)).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: /final race results/i })).not.toBeInTheDocument();

    // 3. Reveal prediction
    const revealBtn = screen.getAllByRole('button', { name: /reveal model prediction/i })[0]!;
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(screen.getByText(/PREDICTED WINNER/i)).toBeInTheDocument();
      expect(screen.getByText(/MODEL RATIONALE:/i)).toBeInTheDocument();
      expect(screen.getByRole('table', { name: /pre-run algorithm cost estimates/i })).toBeInTheDocument();
    });

    // 4. Verify scoreboard remains completely hidden while race is active
    expect(screen.queryByRole('table', { name: /final race results/i })).not.toBeInTheDocument();

    // 5. Seek to completion (scrub to max step)
    const scrubber = screen.getByRole('slider', { name: /shared race timeline position/i });
    const maxVal = scrubber.getAttribute('max') || '100';
    fireEvent.change(scrubber, { target: { value: maxVal } });

    // 6. Scoreboard and Verdict are revealed upon completion
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /final race results/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /empirical prediction verification verdict/i })).toBeInTheDocument();
    });

    // 7. Restart hides scoreboard and verdict again
    const restartBtn = screen.getByRole('button', { name: /restart playback to step 0/i });
    fireEvent.click(restartBtn);

    await waitFor(() => {
      expect(screen.queryByRole('table', { name: /final race results/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: /empirical prediction verification verdict/i })).not.toBeInTheDocument();
    });
  });

  it('invalid custom input preserves previous valid dataset analysis', async () => {
    render(<SortingArena client={client} />);

    await waitFor(() => {
      expect(screen.getByText(/dataset shape analysis/i)).toBeInTheDocument();
    });

    // Select custom pattern
    const customRadio = screen.getByRole('radio', { name: /custom/i });
    fireEvent.click(customRadio);

    // Enter out-of-range value (100 is > 99)
    const customInput = screen.getByPlaceholderText(/e\.g\. 42/i);
    fireEvent.change(customInput, { target: { value: '100, 20, 30' } });

    const generateBtn = screen.getByRole('button', { name: /generate & stage race/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/must be between 1 and 99/i)).toBeInTheDocument();
      // Analysis remains active with previous valid data
      expect(screen.getByText(/dataset shape analysis/i)).toBeInTheDocument();
    });
  });
});
