import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getCoreClient } from '../../src/core/adapter/createCoreClient';
import type { CoreClient } from '../../src/core/adapter/types';
import { SortingArena } from '../../src/components/arena/SortingArena';

describe('SortingArena — Full 5-Lane Orchestration Component', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  it('renders waiting state when client is null', () => {
    render(<SortingArena client={null} />);
    expect(
      screen.getByText(/waiting for webassembly algorithmic engine/i)
    ).toBeInTheDocument();
  });

  it('automatically stages 5 sorting lanes upon mounting with ready client', async () => {
    render(<SortingArena client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Bubble Sort')).toBeInTheDocument();
      expect(screen.getByText('Selection Sort')).toBeInTheDocument();
      expect(screen.getByText('Insertion Sort')).toBeInTheDocument();
      expect(screen.getByText('Quick Sort (Lomuto)')).toBeInTheDocument();
      expect(screen.getByText('Merge Sort (Top-down)')).toBeInTheDocument();
    });

    // Check all 5 lanes have canvas representations
    const canvases = screen.getAllByRole('img');
    expect(canvases.length).toBe(5);

    // Initial step should be 0
    expect(screen.getByText(/Step 0 \//i)).toBeInTheDocument();
  });

  it('supports step-forward, step-backward, play, pause, and restart', async () => {
    render(<SortingArena client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Bubble Sort')).toBeInTheDocument();
    });

    const stepForwardBtn = screen.getByRole('button', { name: /step forward one event/i });
    const stepBackwardBtn = screen.getByRole('button', { name: /step backward one event/i });
    const playBtn = screen.getByRole('button', { name: /play race/i });
    const restartBtn = screen.getByRole('button', { name: /restart playback to step 0/i });

    // Step forward by 1
    fireEvent.click(stepForwardBtn);
    await waitFor(() => {
      expect(screen.getByText(/Step 1 \//i)).toBeInTheDocument();
    });

    // Step forward again to step 2
    fireEvent.click(stepForwardBtn);
    await waitFor(() => {
      expect(screen.getByText(/Step 2 \//i)).toBeInTheDocument();
    });

    // Step backward to step 1
    fireEvent.click(stepBackwardBtn);
    await waitFor(() => {
      expect(screen.getByText(/Step 1 \//i)).toBeInTheDocument();
    });

    // Restart resets step to 0
    fireEvent.click(restartBtn);
    await waitFor(() => {
      expect(screen.getByText(/Step 0 \//i)).toBeInTheDocument();
    });

    // Play starts playback
    fireEvent.click(playBtn);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause race/i })).toBeInTheDocument();
    });

    // Pause playback
    const pauseBtn = screen.getByRole('button', { name: /pause race/i });
    fireEvent.click(pauseBtn);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play race/i })).toBeInTheDocument();
    });
  });

  it('supports timeline scrub seeking', async () => {
    render(<SortingArena client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Bubble Sort')).toBeInTheDocument();
    });

    const scrubber = screen.getByRole('slider', { name: /shared race timeline position/i });
    expect(scrubber).toBeInTheDocument();

    // Seek to step 10
    fireEvent.change(scrubber, { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getByText(/Step 10 \//i)).toBeInTheDocument();
    });
  });

  it('allows changing speed multiplier', async () => {
    render(<SortingArena client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Bubble Sort')).toBeInTheDocument();
    });

    const speedSelect = screen.getByLabelText(/playback simulation speed/i);
    expect(speedSelect).toBeInTheDocument();

    fireEvent.change(speedSelect, { target: { value: '120' } });
    expect((speedSelect as HTMLSelectElement).value).toBe('120');
  });

  it('stages new race when selecting custom input and clicking Generate', async () => {
    render(<SortingArena client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Bubble Sort')).toBeInTheDocument();
    });

    // Switch pattern to Custom (role="radio")
    const customPatternRadio = screen.getByRole('radio', { name: /custom/i });
    fireEvent.click(customPatternRadio);

    const customInput = screen.getByPlaceholderText(/e\.g\. 42/i);
    expect(customInput).toBeInTheDocument();

    fireEvent.change(customInput, { target: { value: '50, 20, 80, 10, 40' } });

    const generateBtn = screen.getByRole('button', { name: /generate & stage race/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      // Step counter resets to 0 with new maxSteps
      expect(screen.getByText(/Step 0 \//i)).toBeInTheDocument();
    });
  });

  it('displays validation error if custom array input is invalid', async () => {
    render(<SortingArena client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Bubble Sort')).toBeInTheDocument();
    });

    const customPatternRadio = screen.getByRole('radio', { name: /custom/i });
    fireEvent.click(customPatternRadio);

    const customInput = screen.getByPlaceholderText(/e\.g\. 42/i);
    fireEvent.change(customInput, { target: { value: '9999, -5' } });

    const generateBtn = screen.getByRole('button', { name: /generate & stage race/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/must be between 1 and 99/i)).toBeInTheDocument();
    });
  });
});
