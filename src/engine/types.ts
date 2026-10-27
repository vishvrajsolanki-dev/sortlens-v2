import type { AlgorithmId, TraceEvent } from '../core/adapter/types';
export type { AlgorithmId, TraceEvent };

export type HighlightType =
  | 'none'
  | 'compare'
  | 'swap'
  | 'write'
  | 'pivot'
  | 'range'
  | 'push'
  | 'pop'
  | 'done';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'completed' | 'error';

/**
 * Immutable snapshot of visual & telemetry state at a given event boundary.
 * Step 0 represents initial state before any event is applied.
 * Step k represents state immediately after event k-1 has been applied.
 */
export interface PlaybackFrame {
  stepIndex: number;
  totalSteps: number;
  array: readonly number[];
  comparisons: number;
  writes: number;
  stackDepth: number;
  activeIndices: readonly number[];
  highlightType: HighlightType;
  pivotIndex: number;
  range: readonly [number, number];
  latestEvent: TraceEvent | null;
  isComplete: boolean;
  overflow: boolean;
}

/**
 * Complete immutable trace session output from core execution.
 */
export interface TraceSession {
  algo: AlgorithmId;
  initialArray: readonly number[];
  events: readonly TraceEvent[];
  cComparisons: number;
  cWrites: number;
  cMaxDepth: number;
  cOverflow: boolean;
  sortedArray: readonly number[];
}

/**
 * Checkpoint data structure for bounded O(1) seeking.
 */
export interface FrameCheckpoint {
  stepIndex: number;
  array: number[];
  comparisons: number;
  writes: number;
  stackDepth: number;
  stack: Array<[number, number]>;
  pivotIndex: number;
  range: [number, number];
}

/**
 * Mutable state used internally during step-by-step event replay.
 */
export interface MutableReplayState {
  array: number[];
  comparisons: number;
  writes: number;
  stackDepth: number;
  stack: Array<[number, number]>;
  pivotIndex: number;
  range: [number, number];
  activeIndices: number[];
  highlightType: HighlightType;
  latestEvent: TraceEvent | null;
  isComplete: boolean;
}

/**
 * Pluggable scheduler abstraction (enables requestAnimationFrame in browser, fake clocks in tests).
 */
export interface ClockScheduler {
  now(): number;
  requestFrame(callback: (timestamp: number) => void): number;
  cancelFrame(handle: number): void;
}

/**
 * Multi-lane race state snapshot for the 5-algorithm arena.
 */
export interface RaceSnapshot {
  status: PlaybackStatus;
  progress: number;
  currentStep: number;
  maxSteps: number;
  isAllDone: boolean;
  lanes: ReadonlyArray<{
    algo: AlgorithmId;
    frame: PlaybackFrame;
    isDone: boolean;
  }>;
}

export type FrameListener = (frame: PlaybackFrame) => void;
export type RaceListener = (snapshot: RaceSnapshot) => void;
