import { describe, expect, it } from 'vitest';
import { PlaybackClock } from '../PlaybackClock';
import type { ClockScheduler } from '../types';

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
    // Drain current callbacks
    const currentCallbacks = Array.from(this.callbacks.values());
    this.callbacks.clear();
    for (const cb of currentCallbacks) {
      cb(this.currentTime);
    }
  }

  get pendingCount(): number {
    return this.callbacks.size;
  }
}

describe('PlaybackClock - Timing, Speed Control, and Lifecycle', () => {
  it('initializes in stopped state with default speed', () => {
    const scheduler = new MockScheduler();
    const clock = new PlaybackClock(scheduler);

    expect(clock.active).toBe(false);
    expect(clock.speed).toBe(60);
    expect(scheduler.pendingCount).toBe(0);
  });

  it('starts and schedules animation frames', () => {
    const scheduler = new MockScheduler();
    const clock = new PlaybackClock(scheduler);

    clock.start();
    expect(clock.active).toBe(true);
    expect(scheduler.pendingCount).toBe(1);

    clock.stop();
    expect(clock.active).toBe(false);
    expect(scheduler.pendingCount).toBe(0);
  });

  it('does not duplicate frames if start() is called multiple times', () => {
    const scheduler = new MockScheduler();
    const clock = new PlaybackClock(scheduler);

    clock.start();
    clock.start();
    clock.start();
    expect(scheduler.pendingCount).toBe(1);

    clock.stop();
    expect(scheduler.pendingCount).toBe(0);
  });

  it('fires ticks proportionally to speed and elapsed time', () => {
    const scheduler = new MockScheduler();
    const clock = new PlaybackClock(scheduler);

    // Set speed to 10 events per second (1 event every 100ms)
    clock.setSpeed(10);
    expect(clock.speed).toBe(10);

    let totalStepsTicked = 0;
    clock.onTick((steps) => {
      totalStepsTicked += steps;
    });

    clock.start();

    // Advance 50ms - not enough for 1 step
    scheduler.advance(50);
    expect(totalStepsTicked).toBe(0);

    // Advance another 50ms (total 100ms) - should tick exactly 1 step
    scheduler.advance(50);
    expect(totalStepsTicked).toBe(1);

    // Advance 250ms in 50ms frames - should tick 2 more steps (total 3) with 50ms leftover
    for (let i = 0; i < 5; i++) {
      scheduler.advance(50);
    }
    expect(totalStepsTicked).toBe(3);

    // Advance 50ms - completes leftover to trigger another step (total 4)
    scheduler.advance(50);
    expect(totalStepsTicked).toBe(4);

    clock.stop();
  });

  it('caps catch-up time on long pauses/tab-suspension', () => {
    const scheduler = new MockScheduler();
    const clock = new PlaybackClock(scheduler);

    clock.setSpeed(100); // 100 events/sec = 1 event every 10ms
    let totalSteps = 0;
    clock.onTick((steps) => {
      totalSteps += steps;
    });

    clock.start();

    // Simulate background tab sleep of 5,000ms
    // maxCatchupMs is 100ms, so at 100 events/sec, it should cap to at most 10 steps
    scheduler.advance(5000);
    expect(totalSteps).toBe(10);

    clock.stop();
  });

  it('cleans up resources and prevents new ticks after dispose()', () => {
    const scheduler = new MockScheduler();
    const clock = new PlaybackClock(scheduler);

    let ticked = false;
    clock.onTick(() => {
      ticked = true;
    });

    clock.start();
    clock.dispose();

    expect(clock.active).toBe(false);
    expect(scheduler.pendingCount).toBe(0);

    // Trying to start a disposed clock does nothing
    clock.start();
    expect(clock.active).toBe(false);
    expect(scheduler.pendingCount).toBe(0);

    scheduler.advance(200);
    expect(ticked).toBe(false);
  });
});
