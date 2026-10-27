import { describe, expect, it } from 'vitest';
import {
  EV_COMPARE,
  EV_SWAP,
  EV_WRITE,
  EV_DONE,
  type TraceEvent,
} from '../../core/adapter/types';
import { FrameStore } from '../FrameStore';
import type { PlaybackFrame, TraceSession } from '../types';

function createMockSession(
  initialArray: number[],
  events: TraceEvent[],
  sortedArray: number[]
): TraceSession {
  let comps = 0;
  let writes = 0;
  for (const ev of events) {
    if (ev.type === EV_COMPARE) comps++;
    if (ev.type === EV_SWAP) writes += 2;
    if (ev.type === EV_WRITE) writes += 1;
  }
  return {
    algo: 0,
    initialArray,
    events,
    cComparisons: comps,
    cWrites: writes,
    cMaxDepth: 0,
    cOverflow: false,
    sortedArray,
  };
}

describe('FrameStore - Sparse Checkpoints and Deterministic Frame Navigation', () => {
  it('initializes with frame 0 matching initial array and 0 counters', () => {
    const session = createMockSession([3, 1, 2], [
      { type: EV_COMPARE, a: 0, b: 1, c: 0, d: 0 },
      { type: EV_SWAP, a: 0, b: 1, c: 0, d: 0 },
      { type: EV_DONE, a: 0, b: 0, c: 0, d: 0 },
    ], [1, 2, 3]);

    const store = new FrameStore(session, 2);
    expect(store.totalSteps).toBe(3);

    const f0 = store.getFrameAt(0);
    expect(f0.stepIndex).toBe(0);
    expect(f0.array).toEqual([3, 1, 2]);
    expect(f0.comparisons).toBe(0);
    expect(f0.writes).toBe(0);
    expect(f0.isComplete).toBe(false);
  });

  it('steps forward sequentially to completion', () => {
    const session = createMockSession([3, 1, 2], [
      { type: EV_COMPARE, a: 0, b: 1, c: 0, d: 0 },
      { type: EV_SWAP, a: 0, b: 1, c: 0, d: 0 },
      { type: EV_DONE, a: 0, b: 0, c: 0, d: 0 },
    ], [1, 3, 2]);

    const store = new FrameStore(session);
    let frame = store.getFrameAt(0);

    // Step 1: Compare
    frame = store.stepForwardFrom(frame);
    expect(frame.stepIndex).toBe(1);
    expect(frame.comparisons).toBe(1);
    expect(frame.writes).toBe(0);
    expect(frame.array).toEqual([3, 1, 2]);

    // Step 2: Swap
    frame = store.stepForwardFrom(frame);
    expect(frame.stepIndex).toBe(2);
    expect(frame.comparisons).toBe(1);
    expect(frame.writes).toBe(2);
    expect(frame.array).toEqual([1, 3, 2]);

    // Step 3: Done
    frame = store.stepForwardFrom(frame);
    expect(frame.stepIndex).toBe(3);
    expect(frame.isComplete).toBe(true);

    // Stepping past end remains at end
    const pastEnd = store.stepForwardFrom(frame);
    expect(pastEnd.stepIndex).toBe(3);
  });

  it('steps backward sequentially back to initial state', () => {
    const session = createMockSession([3, 1, 2], [
      { type: EV_COMPARE, a: 0, b: 1, c: 0, d: 0 },
      { type: EV_SWAP, a: 0, b: 1, c: 0, d: 0 },
      { type: EV_DONE, a: 0, b: 0, c: 0, d: 0 },
    ], [1, 3, 2]);

    const store = new FrameStore(session);
    let frame = store.getFrameAt(3);
    expect(frame.stepIndex).toBe(3);
    expect(frame.isComplete).toBe(true);

    // Back to step 2
    frame = store.stepBackwardFrom(frame);
    expect(frame.stepIndex).toBe(2);
    expect(frame.isComplete).toBe(false);
    expect(frame.array).toEqual([1, 3, 2]);

    // Back to step 1
    frame = store.stepBackwardFrom(frame);
    expect(frame.stepIndex).toBe(1);
    expect(frame.array).toEqual([3, 1, 2]);
    expect(frame.writes).toBe(0);

    // Back to step 0
    frame = store.stepBackwardFrom(frame);
    expect(frame.stepIndex).toBe(0);
    expect(frame.comparisons).toBe(0);
    expect(frame.writes).toBe(0);

    // Stepping backward before 0 remains at 0
    const beforeZero = store.stepBackwardFrom(frame);
    expect(beforeZero.stepIndex).toBe(0);
  });

  it('seeks accurately across sparse checkpoint boundaries', () => {
    // Generate 120 swap events to span across checkpoint interval of 20
    const initial = Array.from({ length: 10 }, (_, i) => i);
    const events: TraceEvent[] = [];
    for (let i = 0; i < 120; i++) {
      const idx = i % 9;
      events.push({ type: EV_SWAP, a: idx, b: idx + 1, c: 0, d: 0 });
    }

    const session = createMockSession(initial, events, initial);
    const store = new FrameStore(session, 20);

    // Reference frames computed strictly sequentially
    let cur = store.getFrameAt(0);
    const sequentialFrames: PlaybackFrame[] = [cur];
    for (let i = 0; i < 120; i++) {
      cur = store.stepForwardFrom(cur);
      sequentialFrames.push(cur);
    }

    // Verify seeking to random steps matches sequential frames exactly
    const testSteps = [0, 1, 19, 20, 21, 40, 55, 80, 99, 119, 120];
    for (const step of testSteps) {
      const seekFrame = store.getFrameAt(step);
      const expected = sequentialFrames[step]!;
      expect(seekFrame.stepIndex).toBe(step);
      expect(seekFrame.array).toEqual(expected.array);
      expect(seekFrame.comparisons).toBe(expected.comparisons);
      expect(seekFrame.writes).toBe(expected.writes);
    }
  });

  it('clamps out-of-bounds seek targets cleanly', () => {
    const session = createMockSession([1, 2], [
      { type: EV_COMPARE, a: 0, b: 1, c: 0, d: 0 },
    ], [1, 2]);
    const store = new FrameStore(session);

    const fNeg = store.getFrameAt(-50);
    expect(fNeg.stepIndex).toBe(0);

    const fTooHigh = store.getFrameAt(1000);
    expect(fTooHigh.stepIndex).toBe(1);
  });
});
