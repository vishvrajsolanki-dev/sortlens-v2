import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  useKeyboardShortcuts,
  registerPlaybackDelegate,
  type PlaybackDelegate,
} from '../../src/hooks/useKeyboardShortcuts';
import { useAppStore } from '../../src/state/appStore';

// Test harness component
const TestShortcutsHarness: React.FC<{
  onToggleShortcutsModal?: () => void;
  onToggleHistoryModal?: () => void;
  onCloseModals?: () => void;
  isAnyModalOpen?: boolean;
}> = (props) => {
  useKeyboardShortcuts(props);
  return (
    <div>
      <input data-testid="test-input" placeholder="Type here..." />
      <textarea data-testid="test-textarea" />
      <select data-testid="test-select">
        <option value="1">Option 1</option>
      </select>
      <div data-testid="content-editable" contentEditable />
      <button data-testid="test-button">Regular Button</button>
    </div>
  );
};

describe('Keyboard Navigation & Shortcut System', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeSection: 'arena',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers playback delegate methods on Space, Arrows, and Home', () => {
    const mockDelegate: PlaybackDelegate = {
      togglePlay: vi.fn(),
      stepForward: vi.fn(),
      stepBackward: vi.fn(),
      restart: vi.fn(),
    };

    const unregister = registerPlaybackDelegate(mockDelegate);
    render(<TestShortcutsHarness />);

    // Space -> togglePlay
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    expect(mockDelegate.togglePlay).toHaveBeenCalledTimes(1);

    // ArrowRight -> stepForward
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockDelegate.stepForward).toHaveBeenCalledTimes(1);

    // ArrowLeft -> stepBackward
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(mockDelegate.stepBackward).toHaveBeenCalledTimes(1);

    // Home -> restart
    fireEvent.keyDown(window, { key: 'Home' });
    expect(mockDelegate.restart).toHaveBeenCalledTimes(1);

    unregister();

    // After unregister, events should not invoke delegate
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    expect(mockDelegate.togglePlay).toHaveBeenCalledTimes(1);
  });

  it('switches navigation sections with numeric keys 1 through 5', () => {
    render(<TestShortcutsHarness />);

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
  });

  it('triggers shortcuts modal on ? and history modal on H', () => {
    const onToggleShortcuts = vi.fn();
    const onToggleHistory = vi.fn();

    render(
      <TestShortcutsHarness
        onToggleShortcutsModal={onToggleShortcuts}
        onToggleHistoryModal={onToggleHistory}
      />
    );

    fireEvent.keyDown(window, { key: '?' });
    expect(onToggleShortcuts).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'h' });
    expect(onToggleHistory).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'H' });
    expect(onToggleHistory).toHaveBeenCalledTimes(2);
  });

  it('strictly suppresses shortcuts when typing in inputs, textareas, and selects', () => {
    const mockDelegate: PlaybackDelegate = {
      togglePlay: vi.fn(),
      stepForward: vi.fn(),
    };
    const onToggleShortcuts = vi.fn();
    const unregister = registerPlaybackDelegate(mockDelegate);

    render(<TestShortcutsHarness onToggleShortcutsModal={onToggleShortcuts} />);

    const input = screen.getByTestId('test-input');
    const textarea = screen.getByTestId('test-textarea');
    const select = screen.getByTestId('test-select');

    // Inside input: Space, '2', '?' must NOT fire shortcuts
    fireEvent.keyDown(input, { code: 'Space', key: ' ' });
    expect(mockDelegate.togglePlay).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: '2' });
    expect(useAppStore.getState().activeSection).toBe('arena');

    fireEvent.keyDown(select, { key: '?' });
    expect(onToggleShortcuts).not.toHaveBeenCalled();

    unregister();
  });

  it('allows Escape to close open modals', () => {
    const onCloseModals = vi.fn();
    render(
      <TestShortcutsHarness
        onCloseModals={onCloseModals}
        isAnyModalOpen={true}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseModals).toHaveBeenCalledTimes(1);
  });
});
