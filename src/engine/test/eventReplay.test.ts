import { describe, expect, it } from 'vitest';
import {
  EV_COMPARE,
  EV_SWAP,
  EV_WRITE,
  EV_PIVOT,
  EV_RANGE,
  EV_PUSH,
  EV_POP,
  EV_DONE,
  type TraceEvent,
} from '../../core/adapter/types';
import {
  applyEventForward,
  cloneReplayState,
  createInitialReplayState,
  reverseEventBackward,
  toPlaybackFrame,
} from '../frameReplay';

describe('frameReplay - Event Reversibility and State Transitions', () => {
  it('creates initial replay state with isolated array and zero counters', () => {
    const original = [42, 10, 88, 3];
    const state = createInitialReplayState(original);

    expect(state.array).toEqual([42, 10, 88, 3]);
    expect(state.comparisons).toBe(0);
    expect(state.writes).toBe(0);
    expect(state.stackDepth).toBe(0);
    expect(state.stack).toEqual([]);
    expect(state.pivotIndex).toBe(-1);
    expect(state.range).toEqual([-1, -1]);
    expect(state.isComplete).toBe(false);

    // Verify isolation
    state.array[0] = 999;
    expect(original[0]).toBe(42);
  });

  it('handles EV_COMPARE forward and backward without mutating array', () => {
    const initial = [5, 2, 8, 1];
    const state = createInitialReplayState(initial);
    const ev: TraceEvent = { type: EV_COMPARE, a: 0, b: 1, c: 0, d: 0 };

    applyEventForward(state, ev);
    expect(state.comparisons).toBe(1);
    expect(state.writes).toBe(0);
    expect(state.array).toEqual([5, 2, 8, 1]);
    expect(state.activeIndices).toEqual([0, 1]);
    expect(state.highlightType).toBe('compare');

    reverseEventBackward(state, ev);
    expect(state.comparisons).toBe(0);
    expect(state.writes).toBe(0);
    expect(state.array).toEqual([5, 2, 8, 1]);
  });

  it('handles EV_SWAP forward and backward with exact array mutation reversal', () => {
    const initial = [10, 20, 30, 40];
    const state = createInitialReplayState(initial);
    const ev: TraceEvent = { type: EV_SWAP, a: 1, b: 3, c: 0, d: 0 };

    applyEventForward(state, ev);
    expect(state.array).toEqual([10, 40, 30, 20]);
    expect(state.writes).toBe(2);
    expect(state.activeIndices).toEqual([1, 3]);
    expect(state.highlightType).toBe('swap');

    reverseEventBackward(state, ev);
    expect(state.array).toEqual([10, 20, 30, 40]);
    expect(state.writes).toBe(0);
  });

  it('handles EV_WRITE forward and backward using old_val in field c', () => {
    const initial = [10, 20, 30, 40];
    const state = createInitialReplayState(initial);
    // Write value 99 into index 2, where old value was 30
    const ev: TraceEvent = { type: EV_WRITE, a: 2, b: 99, c: 30, d: 0 };

    applyEventForward(state, ev);
    expect(state.array).toEqual([10, 20, 99, 40]);
    expect(state.writes).toBe(1);
    expect(state.activeIndices).toEqual([2]);
    expect(state.highlightType).toBe('write');

    reverseEventBackward(state, ev);
    expect(state.array).toEqual([10, 20, 30, 40]);
    expect(state.writes).toBe(0);
  });

  it('handles EV_PIVOT and EV_RANGE forward and backward', () => {
    const initial = [7, 3, 5, 2];
    const state = createInitialReplayState(initial);

    const rangeEv: TraceEvent = { type: EV_RANGE, a: 1, b: 3, c: 0, d: 0 };
    applyEventForward(state, rangeEv);
    expect(state.range).toEqual([1, 3]);
    expect(state.highlightType).toBe('range');

    const pivotEv: TraceEvent = { type: EV_PIVOT, a: 3, b: 0, c: 0, d: 0 };
    applyEventForward(state, pivotEv);
    expect(state.pivotIndex).toBe(3);
    expect(state.highlightType).toBe('pivot');

    reverseEventBackward(state, pivotEv);
    expect(state.pivotIndex).toBe(-1);

    reverseEventBackward(state, rangeEv);
    expect(state.range).toEqual([-1, -1]);
  });

  it('handles EV_PUSH and EV_POP call-stack frame tracking forward and backward', () => {
    const initial = [8, 4, 2, 1];
    const state = createInitialReplayState(initial);

    const push1: TraceEvent = { type: EV_PUSH, a: 0, b: 3, c: 0, d: 0 };
    const push2: TraceEvent = { type: EV_PUSH, a: 2, b: 3, c: 0, d: 0 };

    applyEventForward(state, push1);
    expect(state.stackDepth).toBe(1);
    expect(state.stack).toEqual([[0, 3]]);

    applyEventForward(state, push2);
    expect(state.stackDepth).toBe(2);
    expect(state.stack).toEqual([[0, 3], [2, 3]]);

    // Now pop the second frame (a=2, b=3)
    const pop2: TraceEvent = { type: EV_POP, a: 2, b: 3, c: 0, d: 0 };
    applyEventForward(state, pop2);
    expect(state.stackDepth).toBe(1);
    expect(state.stack).toEqual([[0, 3]]);

    // Reverse pop2: re-pushes [2, 3]
    reverseEventBackward(state, pop2);
    expect(state.stackDepth).toBe(2);
    expect(state.stack).toEqual([[0, 3], [2, 3]]);

    // Reverse push2: pops [2, 3]
    reverseEventBackward(state, push2);
    expect(state.stackDepth).toBe(1);
    expect(state.stack).toEqual([[0, 3]]);

    // Reverse push1: pops [0, 3]
    reverseEventBackward(state, push1);
    expect(state.stackDepth).toBe(0);
    expect(state.stack).toEqual([]);
  });

  it('handles EV_DONE completion flag', () => {
    const state = createInitialReplayState([1, 2, 3]);
    const doneEv: TraceEvent = { type: EV_DONE, a: 0, b: 0, c: 0, d: 0 };

    applyEventForward(state, doneEv);
    expect(state.isComplete).toBe(true);
    expect(state.highlightType).toBe('done');

    reverseEventBackward(state, doneEv);
    expect(state.isComplete).toBe(false);
  });

  it('guarantees bidirectional identity across a mixed event sequence', () => {
    const initial = [50, 20, 80, 10, 30];
    const state = createInitialReplayState(initial);
    const initialClone = cloneReplayState(state);

    const sequence: TraceEvent[] = [
      { type: EV_RANGE, a: 0, b: 4, c: 0, d: 0 },
      { type: EV_PUSH, a: 0, b: 4, c: 0, d: 0 },
      { type: EV_COMPARE, a: 0, b: 1, c: 0, d: 0 },
      { type: EV_SWAP, a: 0, b: 1, c: 0, d: 0 },
      { type: EV_WRITE, a: 2, b: 99, c: 80, d: 0 },
      { type: EV_PIVOT, a: 4, b: 0, c: 0, d: 0 },
      { type: EV_POP, a: 0, b: 4, c: 0, d: 0 },
      { type: EV_DONE, a: 0, b: 0, c: 0, d: 0 },
    ];

    // Apply forward
    for (const ev of sequence) {
      applyEventForward(state, ev);
    }

    expect(state.isComplete).toBe(true);
    expect(state.comparisons).toBe(1);
    expect(state.writes).toBe(3); // 1 swap (2) + 1 write (1) = 3
    expect(state.array).toEqual([20, 50, 99, 10, 30]);

    // Apply backward in reverse order
    for (let i = sequence.length - 1; i >= 0; i--) {
      reverseEventBackward(state, sequence[i]!);
    }

    expect(state.array).toEqual(initialClone.array);
    expect(state.comparisons).toBe(initialClone.comparisons);
    expect(state.writes).toBe(initialClone.writes);
    expect(state.stackDepth).toBe(initialClone.stackDepth);
    expect(state.stack).toEqual(initialClone.stack);
    expect(state.isComplete).toBe(false);
  });

  it('converts replay state to immutable PlaybackFrame', () => {
    const state = createInitialReplayState([1, 2, 3]);
    const frame = toPlaybackFrame(state, 0, 10, false);

    expect(frame.stepIndex).toBe(0);
    expect(frame.totalSteps).toBe(10);
    expect(frame.array).toEqual([1, 2, 3]);
    expect(frame.comparisons).toBe(0);
    expect(frame.writes).toBe(0);
    expect(frame.isComplete).toBe(false);
    expect(frame.overflow).toBe(false);

    // Ensure array is a separate frozen/isolated copy
    state.array[0] = 999;
    expect(frame.array[0]).toBe(1);
  });
});
