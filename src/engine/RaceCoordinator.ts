import type {
  AlgorithmId,
  ClockScheduler,
  PlaybackFrame,
  PlaybackStatus,
  RaceListener,
  RaceSnapshot,
  TraceSession,
} from './types';
import { FrameStore } from './FrameStore';
import { PlaybackClock } from './PlaybackClock';

/**
 * Multi-lane race coordinator managing concurrent execution across sorting algorithms.
 * Synchronizes step progression, timeline seeking, forward/backward navigation,
 * and unified status telemetry for the 5-algorithm arena.
 */
export class RaceCoordinator {
  private readonly stores = new Map<AlgorithmId, FrameStore>();
  private readonly currentFrames = new Map<AlgorithmId, PlaybackFrame>();
  private readonly order: AlgorithmId[] = [];
  private clock: PlaybackClock;
  private status: PlaybackStatus = 'idle';
  private currentStep = 0;
  private readonly maxSteps: number = 0;
  private listeners = new Set<RaceListener>();

  constructor(sessions: TraceSession[], scheduler?: ClockScheduler) {
    let max = 0;
    for (const session of sessions) {
      const store = new FrameStore(session);
      this.stores.set(session.algo, store);
      this.currentFrames.set(session.algo, store.getFrameAt(0));
      this.order.push(session.algo);
      if (store.totalSteps > max) {
        max = store.totalSteps;
      }
    }
    this.maxSteps = max;

    this.clock = new PlaybackClock(scheduler);
    this.clock.onTick((stepsToAdvance) => {
      this.advanceSteps(stepsToAdvance);
    });
  }

  getStatus(): PlaybackStatus {
    return this.status;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getMaxSteps(): number {
    return this.maxSteps;
  }

  getLaneFrame(algo: AlgorithmId): PlaybackFrame | undefined {
    return this.currentFrames.get(algo);
  }

  getSnapshot(): RaceSnapshot {
    const isAllDone =
      this.maxSteps === 0 ||
      this.order.every((algo) => {
        const frame = this.currentFrames.get(algo);
        const store = this.stores.get(algo);
        return frame && store && frame.stepIndex >= store.totalSteps;
      });

    const lanes = this.order.map((algo) => {
      const frame = this.currentFrames.get(algo)!;
      const store = this.stores.get(algo)!;
      return {
        algo,
        frame,
        isDone: frame.stepIndex >= store.totalSteps,
      };
    });

    const progress = this.maxSteps > 0 ? this.currentStep / this.maxSteps : 1;

    return {
      status: this.status,
      progress,
      currentStep: this.currentStep,
      maxSteps: this.maxSteps,
      isAllDone,
      lanes,
    };
  }

  subscribe(listener: RaceListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  play(): void {
    if (this.status === 'playing') {
      return;
    }
    if (this.currentStep >= this.maxSteps) {
      this.seek(0);
    }
    this.status = 'playing';
    this.clock.start();
  }

  pause(): void {
    if (this.status === 'playing') {
      this.status = 'paused';
      this.clock.stop();
      this.emit();
    }
  }

  stepForward(): void {
    this.pause();
    if (this.currentStep < this.maxSteps) {
      this.currentStep++;
      for (const algo of this.order) {
        const frame = this.currentFrames.get(algo)!;
        const store = this.stores.get(algo)!;
        if (frame.stepIndex < store.totalSteps) {
          this.currentFrames.set(algo, store.stepForwardFrom(frame));
        }
      }
      if (this.currentStep >= this.maxSteps) {
        this.status = 'completed';
      }
      this.emit();
    }
  }

  stepBackward(): void {
    this.pause();
    if (this.currentStep > 0) {
      this.currentStep--;
      for (const algo of this.order) {
        const frame = this.currentFrames.get(algo)!;
        const store = this.stores.get(algo)!;
        if (frame.stepIndex > this.currentStep) {
          this.currentFrames.set(algo, store.stepBackwardFrom(frame));
        }
      }
      this.status = 'paused';
      this.emit();
    }
  }

  seek(targetStep: number): void {
    this.pause();
    const clamped = Math.max(0, Math.min(this.maxSteps, Math.floor(targetStep)));
    this.currentStep = clamped;
    for (const algo of this.order) {
      const store = this.stores.get(algo)!;
      const laneStep = Math.min(clamped, store.totalSteps);
      this.currentFrames.set(algo, store.getFrameAt(laneStep));
    }
    if (this.currentStep >= this.maxSteps && this.maxSteps > 0) {
      this.status = 'completed';
    } else {
      this.status = 'paused';
    }
    this.emit();
  }

  seekProgress(ratio: number): void {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    this.seek(Math.round(clampedRatio * this.maxSteps));
  }

  restart(): void {
    this.pause();
    this.currentStep = 0;
    for (const algo of this.order) {
      const store = this.stores.get(algo)!;
      this.currentFrames.set(algo, store.getFrameAt(0));
    }
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
    for (let s = 0; s < steps; s++) {
      if (this.currentStep >= this.maxSteps) {
        this.status = 'completed';
        this.clock.stop();
        break;
      }
      this.currentStep++;
      for (const algo of this.order) {
        const frame = this.currentFrames.get(algo)!;
        const store = this.stores.get(algo)!;
        if (frame.stepIndex < store.totalSteps) {
          this.currentFrames.set(algo, store.stepForwardFrom(frame));
        }
      }
    }
    this.emit();
  }
}
