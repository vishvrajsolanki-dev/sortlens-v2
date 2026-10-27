import type { TraceEvent } from '../core/adapter/types';
import {
  EV_COMPARE,
  EV_SWAP,
  EV_WRITE,
  EV_PIVOT,
  EV_RANGE,
  EV_PUSH,
  EV_POP,
  EV_DONE,
} from '../core/adapter/types';
import type {
  HighlightType,
  MutableReplayState,
  PlaybackFrame,
} from './types';

export function createInitialReplayState(
  initialArray: readonly number[]
): MutableReplayState {
  return {
    array: [...initialArray],
    comparisons: 0,
    writes: 0,
    stackDepth: 0,
    stack: [],
    pivotIndex: -1,
    range: [-1, -1],
    activeIndices: [],
    highlightType: 'none',
    latestEvent: null,
    isComplete: false,
  };
}

export function cloneReplayState(state: MutableReplayState): MutableReplayState {
  return {
    array: [...state.array],
    comparisons: state.comparisons,
    writes: state.writes,
    stackDepth: state.stackDepth,
    stack: state.stack.map(([l, h]) => [l, h]),
    pivotIndex: state.pivotIndex,
    range: [state.range[0], state.range[1]],
    activeIndices: [...state.activeIndices],
    highlightType: state.highlightType,
    latestEvent: state.latestEvent,
    isComplete: state.isComplete,
  };
}

/**
 * Applies an event forward to transition state from boundary k to k + 1.
 */
export function applyEventForward(
  state: MutableReplayState,
  event: TraceEvent
): void {
  state.latestEvent = event;
  state.activeIndices = [];

  switch (event.type) {
    case EV_COMPARE: {
      state.comparisons++;
      state.highlightType = 'compare';
      state.activeIndices = [event.a, event.b];
      break;
    }
    case EV_SWAP: {
      const temp = state.array[event.a];
      const valB = state.array[event.b];
      if (temp !== undefined && valB !== undefined) {
        state.array[event.a] = valB;
        state.array[event.b] = temp;
      }
      state.writes += 2;
      state.highlightType = 'swap';
      state.activeIndices = [event.a, event.b];
      break;
    }
    case EV_WRITE: {
      state.array[event.a] = event.b;
      state.writes += 1;
      state.highlightType = 'write';
      state.activeIndices = [event.a];
      break;
    }
    case EV_PIVOT: {
      state.pivotIndex = event.a;
      state.highlightType = 'pivot';
      state.activeIndices = [event.a];
      break;
    }
    case EV_RANGE: {
      state.range = [event.a, event.b];
      state.highlightType = 'range';
      break;
    }
    case EV_PUSH: {
      state.stack.push([event.a, event.b]);
      state.stackDepth = state.stack.length;
      state.highlightType = 'push';
      break;
    }
    case EV_POP: {
      if (state.stack.length > 0) {
        state.stack.pop();
      }
      state.stackDepth = state.stack.length;
      state.highlightType = 'pop';
      break;
    }
    case EV_DONE: {
      state.isComplete = true;
      state.highlightType = 'done';
      break;
    }
  }
}

/**
 * Reverses an event backward to transition state from boundary k + 1 back to k.
 * Uses exact before-state payload fields captured by the C core:
 * - EV_SWAP is self-inverting.
 * - EV_WRITE restores old_val (field c).
 * - EV_POP restores pushed frame [a, b].
 */
export function reverseEventBackward(
  state: MutableReplayState,
  event: TraceEvent,
  priorEvent: TraceEvent | null = null
): void {
  switch (event.type) {
    case EV_COMPARE: {
      state.comparisons--;
      break;
    }
    case EV_SWAP: {
      // Swapping again reverses the mutation
      const temp = state.array[event.a];
      const valB = state.array[event.b];
      if (temp !== undefined && valB !== undefined) {
        state.array[event.a] = valB;
        state.array[event.b] = temp;
      }
      state.writes -= 2;
      break;
    }
    case EV_WRITE: {
      // Restore previous value recorded in field c
      state.array[event.a] = event.c;
      state.writes -= 1;
      break;
    }
    case EV_PIVOT: {
      state.pivotIndex = -1;
      break;
    }
    case EV_RANGE: {
      state.range = [-1, -1];
      break;
    }
    case EV_PUSH: {
      if (state.stack.length > 0) {
        state.stack.pop();
      }
      state.stackDepth = state.stack.length;
      break;
    }
    case EV_POP: {
      // Re-push the frame [event.a, event.b] that was popped
      state.stack.push([event.a, event.b]);
      state.stackDepth = state.stack.length;
      break;
    }
    case EV_DONE: {
      state.isComplete = false;
      break;
    }
  }

  // Restore visual highlights based on prior event (or clear to none)
  state.latestEvent = priorEvent;
  state.activeIndices = [];

  if (!priorEvent) {
    state.highlightType = 'none';
  } else {
    state.highlightType = getHighlightTypeForEvent(priorEvent.type);
    if (priorEvent.type === EV_COMPARE || priorEvent.type === EV_SWAP) {
      state.activeIndices = [priorEvent.a, priorEvent.b];
    } else if (priorEvent.type === EV_WRITE || priorEvent.type === EV_PIVOT) {
      state.activeIndices = [priorEvent.a];
    }
  }
}

export function getHighlightTypeForEvent(type: number): HighlightType {
  switch (type) {
    case EV_COMPARE: return 'compare';
    case EV_SWAP: return 'swap';
    case EV_WRITE: return 'write';
    case EV_PIVOT: return 'pivot';
    case EV_RANGE: return 'range';
    case EV_PUSH: return 'push';
    case EV_POP: return 'pop';
    case EV_DONE: return 'done';
    default: return 'none';
  }
}

export function toPlaybackFrame(
  state: MutableReplayState,
  stepIndex: number,
  totalSteps: number,
  overflow: boolean
): PlaybackFrame {
  return {
    stepIndex,
    totalSteps,
    array: [...state.array],
    comparisons: state.comparisons,
    writes: state.writes,
    stackDepth: state.stackDepth,
    activeIndices: [...state.activeIndices],
    highlightType: state.highlightType,
    pivotIndex: state.pivotIndex,
    range: [state.range[0], state.range[1]],
    latestEvent: state.latestEvent,
    isComplete: state.isComplete || stepIndex >= totalSteps,
    overflow,
  };
}
