import type { AlgorithmId, JudgeMetric } from '../../core/adapter/types';
import type { DatasetPattern, NavigationSection } from '../appStore';

export const STORAGE_VERSION = 1;
export const PREFERENCES_STORAGE_KEY = 'sortlens_preferences_v1';
export const HISTORY_STORAGE_KEY = 'sortlens_history_v1';
export const MAX_HISTORY_RECORDS = 200;

export interface StoredPreferences {
  version: number;
  arraySize: number;
  datasetPattern: DatasetPattern;
  judgeBy: JudgeMetric;
  playbackSpeed: number;
  activeSection: NavigationSection;
  sidebarCollapsed: boolean;
}

export interface LaneRunSummary {
  algo: AlgorithmId;
  comparisons: number;
  writes: number;
  totalOps: number;
  maxDepth: number;
  rank: number;
  tie: boolean;
}

export interface CompletedRunRecord {
  id: string;
  timestamp: number; // Date.now()
  arraySize: number;
  pattern: DatasetPattern;
  judgeBy: JudgeMetric;
  winnerAlgo: AlgorithmId;
  winnerCost: number;
  predictedAlgo: AlgorithmId | null;
  predictionCorrect: boolean | null;
  lanes: LaneRunSummary[];
}

export interface StoredHistory {
  version: number;
  records: CompletedRunRecord[];
}

export const DEFAULT_PREFERENCES: StoredPreferences = {
  version: STORAGE_VERSION,
  arraySize: 30,
  datasetPattern: 'random',
  judgeBy: 2, // JUDGE_TOTAL
  playbackSpeed: 60,
  activeSection: 'arena',
  sidebarCollapsed: false,
};
