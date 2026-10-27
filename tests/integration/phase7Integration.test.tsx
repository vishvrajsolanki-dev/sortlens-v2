import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getCoreClient } from '../../src/core/adapter/createCoreClient';
import type { CoreClient } from '../../src/core/adapter/types';
import { AppShell } from '../../src/components/layout/AppShell';
import { SortingArena } from '../../src/components/arena/SortingArena';
import { useAppStore } from '../../src/state/appStore';
import {
  loadPreferences,
  loadHistory,
  clearHistory,
} from '../../src/state/persistence';
import { JUDGE_TOTAL } from '../../src/core/adapter/types';

describe('Phase 7 End-to-End Integration — Persistence, Keyboard Shortcuts, History, and Accessibility', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  beforeEach(() => {
    localStorage.clear();
    clearHistory();
    useAppStore.setState({
      activeSection: 'arena',
      sidebarCollapsed: false,
      mobileNavOpen: false,
      runtimeStatus: 'ready',
      arraySize: 20,
      datasetPattern: 'random',
      judgeBy: JUDGE_TOTAL,
    });
  });

  it('hydrates and persists user preferences seamlessly', () => {
    // 1. Initial defaults
    expect(loadPreferences().arraySize).toBe(30);

    // 2. Mutate through AppStore actions
    useAppStore.getState().setArraySize(42);
    useAppStore.getState().setDatasetPattern('nearly_sorted');
    useAppStore.getState().setSidebarCollapsed(true);

    // 3. Verify immediate persistence in storage
    const loaded = loadPreferences();
    expect(loaded.arraySize).toBe(42);
    expect(loaded.datasetPattern).toBe('nearly_sorted');
    expect(loaded.sidebarCollapsed).toBe(true);
  });

  it('records a completed race run into history idempotently upon race finish', async () => {
    expect(loadHistory().length).toBe(0);

    render(<SortingArena client={client} />);

    // Wait for staging to complete
    await waitFor(() => {
      expect(screen.getByRole('slider', { name: /shared race timeline position/i })).toBeInTheDocument();
    });

    const scrubber = screen.getByRole('slider', { name: /shared race timeline position/i });
    const maxVal = scrubber.getAttribute('max') || '100';

    // Scrub race directly to completion
    fireEvent.change(scrubber, { target: { value: maxVal } });

    await waitFor(() => {
      expect(screen.getByRole('table', { name: /final race results/i })).toBeInTheDocument();
    });

    // Check history was recorded
    const history = loadHistory();
    expect(history.length).toBe(1);
    expect(history[0]!.arraySize).toBe(20);
    expect(history[0]!.lanes.length).toBe(5);
    expect(history[0]!.winnerCost).toBeGreaterThan(0);

    // Idempotency check: scrubbing back and forth must NOT duplicate history
    fireEvent.change(scrubber, { target: { value: '0' } });
    fireEvent.change(scrubber, { target: { value: maxVal } });

    expect(loadHistory().length).toBe(1);
  });

  it('coordinates keyboard navigation and modal interactions in AppShell', async () => {
    render(<AppShell client={client} />);

    // 1. Module navigation via number keys 1-5
    expect(useAppStore.getState().activeSection).toBe('arena');

    fireEvent.keyDown(window, { key: '2' });
    expect(useAppStore.getState().activeSection).toBe('analysis');

    fireEvent.keyDown(window, { key: '3' });
    expect(useAppStore.getState().activeSection).toBe('search');

    fireEvent.keyDown(window, { key: '4' });
    expect(useAppStore.getState().activeSection).toBe('scaling');

    fireEvent.keyDown(window, { key: '5' });
    expect(useAppStore.getState().activeSection).toBe('viva');

    fireEvent.keyDown(window, { key: '1' });
    expect(useAppStore.getState().activeSection).toBe('arena');

    // 2. Open shortcuts modal via ?
    expect(screen.queryByTestId('shortcuts-modal-container')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByTestId('shortcuts-modal-container')).toBeInTheDocument();

    // 3. Dismiss modal with Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('shortcuts-modal-container')).not.toBeInTheDocument();

    // 4. Open history modal via H key
    expect(screen.queryByTestId('history-modal-container')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'h' });
    expect(screen.getByTestId('history-modal-container')).toBeInTheDocument();

    // 5. Dismiss history modal with Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('history-modal-container')).not.toBeInTheDocument();
  });
});
