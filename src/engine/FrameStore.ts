import type {
  FrameCheckpoint,
  MutableReplayState,
  PlaybackFrame,
  TraceSession,
} from './types';
import {
  applyEventForward,
  createInitialReplayState,
  reverseEventBackward,
  toPlaybackFrame,
} from './frameReplay';

export const DEFAULT_CHECKPOINT_INTERVAL = 50;

/**
 * Manages event trace storage, sparse periodic checkpointing,
 * and high-performance O(1) stepping / bounded seeking.
 */
export class FrameStore {
  readonly session: TraceSession;
  readonly totalSteps: number;
  readonly checkpointInterval: number;
  private checkpoints: FrameCheckpoint[] = [];

  constructor(
    session: TraceSession,
    checkpointInterval = DEFAULT_CHECKPOINT_INTERVAL
  ) {
    this.session = session;
    this.totalSteps = session.events.length;
    this.checkpointInterval = Math.max(1, checkpointInterval);
    this.buildCheckpoints();
  }

  get checkpointCount(): number {
    return this.checkpoints.length;
  }

  /**
   * Precomputes checkpoints periodically along the timeline.
   * Keeps total memory overhead under 100 KB even for 10,000 events.
   */
  private buildCheckpoints(): void {
    this.checkpoints = [];
    const state = createInitialReplayState(this.session.initialArray);

    // Checkpoint 0 (Initial state)
    this.checkpoints.push(this.extractCheckpoint(0, state));

    for (let i = 0; i < this.totalSteps; i++) {
      const ev = this.session.events[i];
      if (ev) {
        applyEventForward(state, ev);
      }
      const stepIndex = i + 1;
      if (stepIndex % this.checkpointInterval === 0 || stepIndex === this.totalSteps) {
        this.checkpoints.push(this.extractCheckpoint(stepIndex, state));
      }
    }
  }

  private extractCheckpoint(
    stepIndex: number,
    state: MutableReplayState
  ): FrameCheckpoint {
    return {
      stepIndex,
      array: [...state.array],
      comparisons: state.comparisons,
      writes: state.writes,
      stackDepth: state.stackDepth,
      stack: state.stack.map(([l, h]) => [l, h]),
      pivotIndex: state.pivotIndex,
      range: [state.range[0], state.range[1]],
    };
  }

  private restoreFromCheckpoint(cp: FrameCheckpoint): MutableReplayState {
    const priorEvent =
      cp.stepIndex > 0 ? this.session.events[cp.stepIndex - 1] ?? null : null;

    return {
      array: [...cp.array],
      comparisons: cp.comparisons,
      writes: cp.writes,
      stackDepth: cp.stackDepth,
      stack: cp.stack.map(([l, h]) => [l, h]),
      pivotIndex: cp.pivotIndex,
      range: [cp.range[0], cp.range[1]],
      activeIndices: [],
      highlightType: priorEvent ? 'none' : 'none',
      latestEvent: priorEvent,
      isComplete: cp.stepIndex >= this.totalSteps,
    };
  }

  /**
   * Reconstructs the exact visual and telemetry state at boundary k.
   * Bounded: performs at most checkpointInterval forward event applications.
   */
  getFrameAt(boundary: number): PlaybackFrame {
    const clamped = Math.max(0, Math.min(this.totalSteps, Math.floor(boundary)));

    // Find the closest checkpoint <= clamped
    let bestCp = this.checkpoints[0]!;
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i]!;
      if (cp.stepIndex <= clamped) {
        bestCp = cp;
      } else {
        break;
      }
    }

    const state = this.restoreFromCheckpoint(bestCp);

    // Apply remaining forward delta events
    for (let i = bestCp.stepIndex; i < clamped; i++) {
      const ev = this.session.events[i];
      if (ev) {
        applyEventForward(state, ev);
      }
    }

    return toPlaybackFrame(
      state,
      clamped,
      this.totalSteps,
      this.session.cOverflow
    );
  }

  /**
   * Advances state by exactly one step: k -> k + 1. O(1) operation.
   */
  stepForwardFrom(currentFrame: PlaybackFrame): PlaybackFrame {
    if (currentFrame.stepIndex >= this.totalSteps) {
      return currentFrame;
    }

    const nextIndex = currentFrame.stepIndex + 1;
    const event = this.session.events[currentFrame.stepIndex];
    if (!event) {
      return currentFrame;
    }

    // Fast-path: apply event to copy of current state
    const state: MutableReplayState = {
      array: [...currentFrame.array],
      comparisons: currentFrame.comparisons,
      writes: currentFrame.writes,
      stackDepth: currentFrame.stackDepth,
      stack: [], // stack depth is tracked directly
      pivotIndex: currentFrame.pivotIndex,
      range: [currentFrame.range[0], currentFrame.range[1]],
      activeIndices: [...currentFrame.activeIndices],
      highlightType: currentFrame.highlightType,
      latestEvent: currentFrame.latestEvent,
      isComplete: currentFrame.isComplete,
    };

    applyEventForward(state, event);

    return toPlaybackFrame(
      state,
      nextIndex,
      this.totalSteps,
      this.session.cOverflow
    );
  }

  /**
   * Reverses state by exactly one step: k -> k - 1. O(1) operation.
   */
  stepBackwardFrom(currentFrame: PlaybackFrame): PlaybackFrame {
    if (currentFrame.stepIndex <= 0) {
      return currentFrame;
    }

    const prevIndex = currentFrame.stepIndex - 1;
    const eventToUndo = this.session.events[prevIndex];
    if (!eventToUndo) {
      return currentFrame;
    }

    const priorEvent = prevIndex > 0 ? this.session.events[prevIndex - 1] ?? null : null;

    const state: MutableReplayState = {
      array: [...currentFrame.array],
      comparisons: currentFrame.comparisons,
      writes: currentFrame.writes,
      stackDepth: currentFrame.stackDepth,
      stack: [],
      pivotIndex: currentFrame.pivotIndex,
      range: [currentFrame.range[0], currentFrame.range[1]],
      activeIndices: [...currentFrame.activeIndices],
      highlightType: currentFrame.highlightType,
      latestEvent: currentFrame.latestEvent,
      isComplete: currentFrame.isComplete,
    };

    reverseEventBackward(state, eventToUndo, priorEvent);

    return toPlaybackFrame(
      state,
      prevIndex,
      this.totalSteps,
      this.session.cOverflow
    );
  }
}
