import type {
  ClockScheduler,
  FrameListener,
  PlaybackFrame,
  PlaybackStatus,
  TraceSession,
} from './types';
import { FrameStore } from './FrameStore';
import { PlaybackClock } from './PlaybackClock';

/**
 * Deterministic player for a single algorithm's event trace.
 * Manages frame navigation, forward/backward stepping, seeking, and subscribers.
 */
export class TracePlayer {
  readonly store: FrameStore;
  private clock: PlaybackClock;
  private currentFrame: PlaybackFrame;
  private status: PlaybackStatus = 'idle';
  private listeners = new Set<FrameListener>();

  constructor(session: TraceSession, scheduler?: ClockScheduler) {
    this.store = new FrameStore(session);
    this.currentFrame = this.store.getFrameAt(0);
    this.clock = new PlaybackClock(scheduler);

    this.clock.onTick((stepsToAdvance) => {
      this.advanceSteps(stepsToAdvance);
    });
  }

  get algo() {
    return this.store.session.algo;
  }

  get totalSteps(): number {
    return this.store.totalSteps;
  }

  getStatus(): PlaybackStatus {
    return this.status;
  }

  getCurrentFrame(): PlaybackFrame {
    return this.currentFrame;
  }

  subscribe(listener: FrameListener): () => void {
    this.listeners.add(listener);
    listener(this.currentFrame);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.currentFrame);
    }
  }

  play(): void {
    if (this.status === 'playing') {
      return;
    }
    // If already at end, restart automatically
    if (this.currentFrame.stepIndex >= this.totalSteps) {
      this.seek(0);
    }
    this.status = 'playing';
    this.clock.start();
  }

  pause(): void {
    if (this.status === 'playing') {
      this.status = 'paused';
      this.clock.stop();
    }
  }

  stepForward(): void {
    this.pause();
    if (this.currentFrame.stepIndex < this.totalSteps) {
      this.currentFrame = this.store.stepForwardFrom(this.currentFrame);
      if (this.currentFrame.stepIndex >= this.totalSteps) {
        this.status = 'completed';
      }
      this.emit();
    }
  }

  stepBackward(): void {
    this.pause();
    if (this.currentFrame.stepIndex > 0) {
      this.currentFrame = this.store.stepBackwardFrom(this.currentFrame);
      this.status = 'paused';
      this.emit();
    }
  }

  seek(targetStep: number): void {
    this.pause();
    const clamped = Math.max(0, Math.min(this.totalSteps, Math.floor(targetStep)));
    this.currentFrame = this.store.getFrameAt(clamped);
    if (this.currentFrame.stepIndex >= this.totalSteps) {
      this.status = 'completed';
    } else {
      this.status = 'paused';
    }
    this.emit();
  }

  restart(): void {
    this.pause();
    this.currentFrame = this.store.getFrameAt(0);
    this.status = 'idle';
    this.emit();
  }

  setSpeed(eventsPerSec: number): void {
    this.clock.setSpeed(eventsPerSec);
  }

  dispose(): void {
    this.clock.dispose();
    this.listeners.clear();
    this.status = 'idle';
  }

  private advanceSteps(steps: number): void {
    for (let i = 0; i < steps; i++) {
      if (this.currentFrame.stepIndex >= this.totalSteps) {
        this.status = 'completed';
        this.clock.stop();
        break;
      }
      this.currentFrame = this.store.stepForwardFrom(this.currentFrame);
      if (this.currentFrame.stepIndex >= this.totalSteps) {
        this.status = 'completed';
        this.clock.stop();
        break;
      }
    }
    this.emit();
  }
}
