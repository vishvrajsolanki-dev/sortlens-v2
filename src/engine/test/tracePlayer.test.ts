import { describe, expect, it } from 'vitest';
import {
  EV_COMPARE,
  EV_SWAP,
  EV_DONE,
  type TraceEvent,
} from '../../core/adapter/types';
import { TracePlayer } from '../TracePlayer';
import type { ClockScheduler, PlaybackFrame, TraceSession } from '../types';

class MockScheduler implements ClockScheduler {
  currentTime = 1000;
  callbacks = new Map<number, (timestamp: number) => void>();
  private nextHandle = 1;

  now(): number {
    return this.currentTime;
  }

  requestFrame(callback: (timestamp: number) => void): number {
    const handle = this.nextHandle++;
    this.callbacks.set(handle, callback);
    return handle;
  }

  cancelFrame(handle: number): void {
    this.callbacks.delete(handle);
  }

  advance(ms: number): void {
    this.currentTime += ms;
    const currentCallbacks = Array.from(this.callbacks.values());
    this.callbacks.clear();
    for (const cb of currentCallbacks) {
      cb(this.currentTime);
    }
  }
}

function createSession(
  initialArray: number[],
  events: TraceEvent[],
  sortedArray: number[]
): TraceSession {
  return {
    algo: 0,
    initialArray,
    events,
    cComparisons: 2,
    cWrites: 2,
    cMaxDepth: 0,
    cOverflow: false,
    sortedArray,
  };
}

describe('TracePlayer - Single-Lane Playback State Machine', () => {
  const events: TraceEvent[] = [
    { type: EV_COMPARE, a: 0, b: 1, c: 0, d: 0 },
    { type: EV_SWAP, a: 0, b: 1, c: 0, d: 0 },
    { type: EV_COMPARE, a: 1, b: 2, c: 0, d: 0 },
    { type: EV_DONE, a: 0, b: 0, c: 0, d: 0 },
  ];

  it('initializes in idle state at frame 0 and notifies subscriber immediately', () => {
    const session = createSession([2, 1, 3], events, [1, 2, 3]);
    const player = new TracePlayer(session);

    let observedFrame: PlaybackFrame | null = null;
    const unsubscribe = player.subscribe((frame) => {
      observedFrame = frame;
    });

    expect(player.getStatus()).toBe('idle');
    expect(player.totalSteps).toBe(4);
    expect(observedFrame).not.toBeNull();
    expect(observedFrame!.stepIndex).toBe(0);
    expect(observedFrame!.array).toEqual([2, 1, 3]);

    unsubscribe();
  });

  it('supports manual stepForward and stepBackward', () => {
    const session = createSession([2, 1, 3], events, [1, 2, 3]);
    const player = new TracePlayer(session);

    player.stepForward();
    expect(player.getCurrentFrame().stepIndex).toBe(1);
    expect(player.getCurrentFrame().comparisons).toBe(1);

    player.stepForward();
    expect(player.getCurrentFrame().stepIndex).toBe(2);
    expect(player.getCurrentFrame().writes).toBe(2);
    expect(player.getCurrentFrame().array).toEqual([1, 2, 3]);

    player.stepBackward();
    expect(player.getCurrentFrame().stepIndex).toBe(1);
    expect(player.getCurrentFrame().writes).toBe(0);

    player.stepBackward();
    expect(player.getCurrentFrame().stepIndex).toBe(0);
  });

  it('seeks to any step and updates status correctly', () => {
    const session = createSession([2, 1, 3], events, [1, 2, 3]);
    const player = new TracePlayer(session);

    player.seek(2);
    expect(player.getStatus()).toBe('paused');
    expect(player.getCurrentFrame().stepIndex).toBe(2);
    expect(player.getCurrentFrame().array).toEqual([1, 2, 3]);

    // Seek to completion
    player.seek(4);
    expect(player.getStatus()).toBe('completed');
    expect(player.getCurrentFrame().isComplete).toBe(true);

    // Restart returns to idle at step 0
    player.restart();
    expect(player.getStatus()).toBe('idle');
    expect(player.getCurrentFrame().stepIndex).toBe(0);
  });

  it('runs automatically using mock clock scheduler and stops at completion', () => {
    const scheduler = new MockScheduler();
    const session = createSession([2, 1, 3], events, [1, 2, 3]);
    const player = new TracePlayer(session, scheduler);

    player.setSpeed(10); // 10 steps/sec = 1 step per 100ms
    player.play();
    expect(player.getStatus()).toBe('playing');

    // 100ms: advances to step 1
    scheduler.advance(100);
    expect(player.getCurrentFrame().stepIndex).toBe(1);

    // 200ms across two frames: advances to step 3
    scheduler.advance(100);
    scheduler.advance(100);
    expect(player.getCurrentFrame().stepIndex).toBe(3);

    // 100ms: advances to step 4 (completion)
    scheduler.advance(100);
    expect(player.getCurrentFrame().stepIndex).toBe(4);
    expect(player.getStatus()).toBe('completed');

    // Subsequent ticks do not advance past completion
    scheduler.advance(500);
    expect(player.getCurrentFrame().stepIndex).toBe(4);

    player.dispose();
  });

  it('auto-restarts from step 0 if play() is invoked when completed', () => {
    const session = createSession([2, 1, 3], events, [1, 2, 3]);
    const player = new TracePlayer(session);

    player.seek(4);
    expect(player.getStatus()).toBe('completed');

    player.play();
    expect(player.getStatus()).toBe('playing');
    expect(player.getCurrentFrame().stepIndex).toBe(0);

    player.dispose();
  });
});
