import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../src/state/appStore';
import { JUDGE_WRITES, JUDGE_TOTAL } from '../../src/core/adapter/types';

describe('Zustand AppStore - UI State and Input Constraints', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useAppStore.setState({
      activeSection: 'arena',
      sidebarCollapsed: false,
      mobileNavOpen: false,
      runtimeStatus: 'uninitialized',
      runtimeError: null,
      arraySize: 30,
      datasetPattern: 'random',
      judgeBy: JUDGE_TOTAL,
    });
  });

  it('initializes with default state values', () => {
    const state = useAppStore.getState();
    expect(state.activeSection).toBe('arena');
    expect(state.sidebarCollapsed).toBe(false);
    expect(state.mobileNavOpen).toBe(false);
    expect(state.runtimeStatus).toBe('uninitialized');
    expect(state.arraySize).toBe(30);
    expect(state.datasetPattern).toBe('random');
  });

  it('switches navigation sections and auto-dismisses mobile nav', () => {
    useAppStore.getState().setMobileNavOpen(true);
    expect(useAppStore.getState().mobileNavOpen).toBe(true);

    useAppStore.getState().setActiveSection('analysis');
    expect(useAppStore.getState().activeSection).toBe('analysis');
    expect(useAppStore.getState().mobileNavOpen).toBe(false);
  });

  it('toggles and sets sidebar collapse state', () => {
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarCollapsed).toBe(true);

    useAppStore.getState().setSidebarCollapsed(false);
    expect(useAppStore.getState().sidebarCollapsed).toBe(false);
  });

  it('strictly clamps array size to application range [2, 100]', () => {
    // Sub-minimum clamping: values < 2 must clamp to 2
    useAppStore.getState().setArraySize(1);
    expect(useAppStore.getState().arraySize).toBe(2);

    useAppStore.getState().setArraySize(-10);
    expect(useAppStore.getState().arraySize).toBe(2);

    // Super-maximum clamping: values > 100 must clamp to 100
    useAppStore.getState().setArraySize(150);
    expect(useAppStore.getState().arraySize).toBe(100);

    // Valid in-range value
    useAppStore.getState().setArraySize(64);
    expect(useAppStore.getState().arraySize).toBe(64);

    // Float truncation
    useAppStore.getState().setArraySize(45.8);
    expect(useAppStore.getState().arraySize).toBe(45);
  });

  it('updates runtime status and tracks error messages', () => {
    useAppStore.getState().setRuntimeStatus('initializing');
    expect(useAppStore.getState().runtimeStatus).toBe('initializing');
    expect(useAppStore.getState().runtimeError).toBeNull();

    useAppStore.getState().setRuntimeStatus('error', 'WASM Compilation Failed');
    expect(useAppStore.getState().runtimeStatus).toBe('error');
    expect(useAppStore.getState().runtimeError).toBe('WASM Compilation Failed');

    useAppStore.getState().setRuntimeStatus('ready');
    expect(useAppStore.getState().runtimeStatus).toBe('ready');
    expect(useAppStore.getState().runtimeError).toBeNull();
  });

  it('updates dataset pattern and judge-by metric', () => {
    useAppStore.getState().setDatasetPattern('nearly_sorted');
    expect(useAppStore.getState().datasetPattern).toBe('nearly_sorted');

    useAppStore.getState().setJudgeBy(JUDGE_WRITES);
    expect(useAppStore.getState().judgeBy).toBe(JUDGE_WRITES);
  });
});
