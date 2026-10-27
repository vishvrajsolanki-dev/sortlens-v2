import { create } from 'zustand';
import type { JudgeMetric } from '../core/adapter/types';
import { JUDGE_TOTAL } from '../core/adapter/types';
import { loadPreferences, savePreferences, resetPreferences } from './persistence';

export type NavigationSection = 'arena' | 'analysis' | 'search' | 'scaling' | 'viva';

export type RuntimeStatus = 'uninitialized' | 'initializing' | 'ready' | 'error';

export type DatasetPattern = 'random' | 'sorted' | 'nearly_sorted' | 'reverse' | 'few_unique' | 'custom';

export interface AppState {
  // Navigation & Shell
  activeSection: NavigationSection;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;

  // Runtime Core Status
  runtimeStatus: RuntimeStatus;
  runtimeError: string | null;

  // Global Dataset Parameters (Application range [2, 100])
  arraySize: number;
  datasetPattern: DatasetPattern;
  judgeBy: JudgeMetric;

  // Actions
  setActiveSection: (section: NavigationSection) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setRuntimeStatus: (status: RuntimeStatus, error?: string | null) => void;
  setArraySize: (size: number) => void;
  setDatasetPattern: (pattern: DatasetPattern) => void;
  setJudgeBy: (metric: JudgeMetric) => void;
  resetToDefaults: () => void;
}

// Hydrate from localStorage once at module initialization
const initialPrefs = loadPreferences();

export const useAppStore = create<AppState>((set) => ({
  activeSection: initialPrefs.activeSection || 'arena',
  sidebarCollapsed: initialPrefs.sidebarCollapsed ?? false,
  mobileNavOpen: false,

  runtimeStatus: 'uninitialized',
  runtimeError: null,

  arraySize: initialPrefs.arraySize ?? 30,
  datasetPattern: initialPrefs.datasetPattern ?? 'random',
  judgeBy: initialPrefs.judgeBy ?? JUDGE_TOTAL,

  setActiveSection: (section) => {
    savePreferences({ activeSection: section });
    set({ activeSection: section, mobileNavOpen: false });
  },

  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      savePreferences({ sidebarCollapsed: next });
      return { sidebarCollapsed: next };
    }),

  setSidebarCollapsed: (collapsed) => {
    savePreferences({ sidebarCollapsed: collapsed });
    set({ sidebarCollapsed: collapsed });
  },

  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  setRuntimeStatus: (status, error = null) => set({ runtimeStatus: status, runtimeError: error }),

  setArraySize: (size) => {
    const clamped = Math.max(2, Math.min(100, Math.floor(size)));
    savePreferences({ arraySize: clamped });
    set({ arraySize: clamped });
  },

  setDatasetPattern: (pattern) => {
    savePreferences({ datasetPattern: pattern });
    set({ datasetPattern: pattern });
  },

  setJudgeBy: (metric) => {
    savePreferences({ judgeBy: metric });
    set({ judgeBy: metric });
  },

  resetToDefaults: () => {
    const defaults = resetPreferences();
    set({
      activeSection: defaults.activeSection,
      sidebarCollapsed: defaults.sidebarCollapsed,
      arraySize: defaults.arraySize,
      datasetPattern: defaults.datasetPattern,
      judgeBy: defaults.judgeBy,
    });
  },
}));
