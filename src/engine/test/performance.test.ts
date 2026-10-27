import { describe, expect, it } from 'vitest';
import {
  EV_COMPARE,
  EV_SWAP,
  EV_WRITE,
  EV_DONE,
  type TraceEvent,
} from '../../core/adapter/types';
import { FrameStore } from '../FrameStore';
import type { TraceSession } from '../types';

describe('Playback Engine - Performance and Seek Latency Benchmarks', () => {
  it('bounds seek latency to under 5ms even across a 2,000-event trace', () => {
    const arraySize = 50;
    const initial = Array.from({ length: arraySize }, (_, i) => arraySize - i);
    const events: TraceEvent[] = [];

    // Simulate 2000 events
    for (let i = 0; i < 2000; i++) {
      const a = i % (arraySize - 1);
      const b = a + 1;
      if (i % 3 === 0) {
        events.push({ type: EV_COMPARE, a, b, c: 0, d: 0 });
      } else if (i % 3 === 1) {
        events.push({ type: EV_SWAP, a, b, c: 0, d: 0 });
      } else {
        events.push({ type: EV_WRITE, a, b: 42, c: initial[a] ?? 0, d: 0 });
      }
    }
    events.push({ type: EV_DONE, a: 0, b: 0, c: 0, d: 0 });

    const session: TraceSession = {
      algo: 0,
      initialArray: initial,
      events,
      cComparisons: 667,
      cWrites: 1334,
      cMaxDepth: 0,
      cOverflow: false,
      sortedArray: initial,
    };

    const store = new FrameStore(session, 50);

    // Warm up
    store.getFrameAt(500);

    // Perform 100 seeks across random steps in the timeline
    const targets = Array.from({ length: 100 }, (_, i) => (i * 19) % store.totalSteps);

    const start = performance.now();
    for (const step of targets) {
      const frame = store.getFrameAt(step);
      expect(frame.stepIndex).toBe(step);
    }
    const totalDurationMs = performance.now() - start;
    const avgDurationMs = totalDurationMs / targets.length;

    // Ponytail expectation: average seek must be sub-millisecond, definitely < 5ms
    expect(avgDurationMs).toBeLessThan(5);
  });

  it('bounds memory footprint by strictly limiting checkpoint counts', () => {
    const eventCount = 1500;
    const interval = 50;
    const events: TraceEvent[] = Array.from({ length: eventCount }, () => ({
      type: EV_COMPARE,
      a: 0,
      b: 1,
      c: 0,
      d: 0,
    }));

    const session: TraceSession = {
      algo: 0,
      initialArray: [1, 2, 3],
      events,
      cComparisons: eventCount,
      cWrites: 0,
      cMaxDepth: 0,
      cOverflow: false,
      sortedArray: [1, 2, 3],
    };

    const store = new FrameStore(session, interval);
    const expectedCheckpoints = Math.floor(eventCount / interval) + 1; // 0, 50, 100, ..., 1500 = 31 checkpoints

    expect(store.checkpointCount).toBe(expectedCheckpoints);
    expect(store.checkpointCount).toBeLessThan(50);
  });
});
