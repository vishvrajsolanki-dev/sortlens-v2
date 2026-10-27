import type { NavigationSection } from '../../state/appStore';

export interface VivaStage {
  id: string;
  stageNumber: number;
  title: string;
  subtitle: string;
  syllabusUnit: string;
  targetSection: NavigationSection;
  durationSeconds: number;
  narrativeText: string;
  bulletPoints: string[];
}

export type VivaDemoStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface VivaDemoState {
  status: VivaDemoStatus;
  currentStageIndex: number;
  secondsRemaining: number;
  totalStages: number;
}
