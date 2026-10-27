import type { ClockScheduler } from './types';

export class DefaultClockScheduler implements ClockScheduler {
  now(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }

  requestFrame(callback: (timestamp: number) => void): number {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(callback);
    }
    // Node.js fallback using setTimeout with 16ms interval (~60fps)
    return setTimeout(() => callback(this.now()), 16) as unknown as number;
  }

  cancelFrame(handle: number): void {
    if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(handle);
      return;
    }
    clearTimeout(handle);
  }
}

export type TickCallback = (stepsToAdvance: number) => void;

/**
 * High-precision, deterministic playback clock.
 * Decouples animation frame rate (Hz) from logical event playback speed (events/sec).
 */
export class PlaybackClock {
  private scheduler: ClockScheduler;
  private isRunning = false;
  private isDisposed = false;
  private frameHandle: number | null = null;
  private lastTimestamp = 0;
  private accumulatedTime = 0;
  private eventsPerSecond = 60; // Default 60 events/sec
  private maxCatchupMs = 100; // Protection against background tab suspension freezes
  private onTickCallback: TickCallback | null = null;

  constructor(scheduler?: ClockScheduler) {
    this.scheduler = scheduler ?? new DefaultClockScheduler();
  }

  get active(): boolean {
    return this.isRunning && !this.isDisposed;
  }

  get speed(): number {
    return this.eventsPerSecond;
  }

  setSpeed(eventsPerSec: number): void {
    if (eventsPerSec > 0 && Number.isFinite(eventsPerSec)) {
      this.eventsPerSecond = eventsPerSec;
    }
  }

  onTick(cb: TickCallback): void {
    this.onTickCallback = cb;
  }

  start(): void {
    if (this.isRunning || this.isDisposed) {
      return;
    }
    this.isRunning = true;
    this.lastTimestamp = this.scheduler.now();
    this.accumulatedTime = 0;
    this.scheduleFrame();
  }

  stop(): void {
    this.isRunning = false;
    if (this.frameHandle !== null) {
      this.scheduler.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.accumulatedTime = 0;
  }

  dispose(): void {
    this.stop();
    this.isDisposed = true;
    this.onTickCallback = null;
  }

  private scheduleFrame(): void {
    if (!this.isRunning || this.isDisposed) {
      return;
    }
    this.frameHandle = this.scheduler.requestFrame((now) => {
      this.tick(now);
    });
  }

  private tick(now: number): void {
    if (!this.isRunning || this.isDisposed) {
      return;
    }

    const delta = Math.min(now - this.lastTimestamp, this.maxCatchupMs);
    this.lastTimestamp = now;

    if (delta > 0) {
      this.accumulatedTime += delta;
      const stepDurationMs = 1000 / this.eventsPerSecond;

      const stepsToAdvance = Math.floor(this.accumulatedTime / stepDurationMs);
      if (stepsToAdvance > 0) {
        this.accumulatedTime -= stepsToAdvance * stepDurationMs;
        if (this.onTickCallback) {
          this.onTickCallback(stepsToAdvance);
        }
      }
    }

    if (this.isRunning && !this.isDisposed) {
      this.scheduleFrame();
    }
  }
}
