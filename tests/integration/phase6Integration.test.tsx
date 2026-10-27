import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getCoreClient } from '../../src/core/adapter/createCoreClient';
import type { CoreClient } from '../../src/core/adapter/types';
import { WorkspaceFrame } from '../../src/components/layout/WorkspaceFrame';
import { useAppStore } from '../../src/state/appStore';
import { getVivaDemoController } from '../../src/features/viva/VivaDemoController';

describe('Phase 6 End-to-End Integration — Search Lab, Scaling Lab & Viva Demo Mode', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  it('integrates Search Lab, Scaling Lab, and Viva Demo Mode seamlessly in the workspace', async () => {
    const { rerender } = render(<WorkspaceFrame client={client} />);

    // 1. Initial view is the Sorting Arena
    expect(
      screen.getByText(/SortLens Rebuild — 5-Algorithm Sorting Arena/i)
    ).toBeInTheDocument();

    // 2. Switch to Search Lab
    useAppStore.getState().setActiveSection('search');
    rerender(<WorkspaceFrame client={client} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Search Laboratory — Linear vs\. Binary Search/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /^Linear Search$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /^Binary Search$/i })).toBeInTheDocument();
    });

    // 3. Switch to Scaling Lab
    useAppStore.getState().setActiveSection('scaling');
    rerender(<WorkspaceFrame client={client} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Empirical Complexity Scaling Lab — O\(n²\) vs\. O\(n log n\)/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /empirical algorithm scaling chart/i })).toBeInTheDocument();
    });

    // 4. Switch to Viva Demo View
    useAppStore.getState().setActiveSection('viva');
    rerender(<WorkspaceFrame client={client} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Automated Viva Demonstration & Examiner Study Guide/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /start automated 90-second viva tour/i })
      ).toBeInTheDocument();
    });

    // 5. Start Viva Demonstration -> triggers floating bar across the app
    const startBtn = screen.getByRole('button', {
      name: /start automated 90-second viva tour/i,
    });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('region', {
          name: /active viva demonstration navigation toolbar/i,
        })
      ).toBeInTheDocument();
      expect(screen.getByText(/VIVA TOUR ACTIVE/i)).toBeInTheDocument();
    });

    // 6. Stop Demonstration -> floating bar disappears cleanly
    const exitBtn = screen.getByRole('button', { name: /exit viva demonstration/i });
    fireEvent.click(exitBtn);

    await waitFor(() => {
      expect(
        screen.queryByRole('region', {
          name: /active viva demonstration navigation toolbar/i,
        })
      ).not.toBeInTheDocument();
    });

    // Clean up controller
    getVivaDemoController().stop();
  });
});
