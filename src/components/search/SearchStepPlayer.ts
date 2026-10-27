/**
 * SearchStepPlayer.ts - Deterministic playback controller for search steps
 *
 * Controls step-by-step navigation of Linear and Binary search traces.
 * Supports play, pause, single-stepping in both directions, arbitrary seeking,
 * and speed adjustments with guaranteed timer cleanup.
 */

export interface SearchStepPlayerOptions {
  totalSteps: number;
  initialSpeed?: number; // steps per second (e.g. 1, 2, 4)
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
}

export class SearchStepPlayer {
  private currentStep = 0;
  private totalSteps: number;
  private speed: number;
  private isPlaying = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private onStepChange?: (stepIndex: number) => void;
  private onComplete?: (stepIndex: number) => void;

  constructor(options: SearchStepPlayerOptions) {
    this.totalSteps = Math.max(0, options.totalSteps);
    this.speed = options.initialSpeed ?? 1.5;
    this.onStepChange = options.onStepChange;
    this.onComplete = options.onComplete;
  }

  public getStep(): number {
    return this.currentStep;
  }

  public getTotalSteps(): number {
    return this.totalSteps;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public setTotalSteps(total: number): void {
    this.totalSteps = Math.max(0, total);
    if (this.currentStep >= this.totalSteps) {
      this.currentStep = Math.max(0, this.totalSteps - 1);
    }
  }

  public setSpeed(speed: number): void {
    if (speed > 0) {
      this.speed = speed;
      if (this.isPlaying) {
        this.clearTimer();
        this.scheduleNextTick();
      }
    }
  }

  public play(): void {
    if (this.isPlaying) return;
    if (this.totalSteps <= 0) return;

    // If at end, loop back to start
    if (this.currentStep >= this.totalSteps - 1) {
      this.currentStep = 0;
      this.notify();
    }

    this.isPlaying = true;
    this.scheduleNextTick();
  }

  public pause(): void {
    this.isPlaying = false;
    this.clearTimer();
  }

  public stepForward(): boolean {
    this.pause();
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.notify();
      return true;
    }
    return false;
  }

  public stepBackward(): boolean {
    this.pause();
    if (this.currentStep > 0) {
      this.currentStep--;
      this.notify();
      return true;
    }
    return false;
  }

  public seek(stepIndex: number): void {
    this.pause();
    const clamped = Math.max(0, Math.min(this.totalSteps - 1, Math.floor(stepIndex)));
    if (clamped !== this.currentStep) {
      this.currentStep = clamped;
      this.notify();
    }
  }

  public restart(): void {
    this.pause();
    this.currentStep = 0;
    this.notify();
  }

  public destroy(): void {
    this.pause();
    this.onStepChange = undefined;
    this.onComplete = undefined;
  }

  private scheduleNextTick(): void {
    if (!this.isPlaying) return;
    const intervalMs = Math.max(50, Math.round(1000 / this.speed));
    this.timer = setTimeout(() => {
      this.tick();
    }, intervalMs);
  }

  private tick(): void {
    if (!this.isPlaying) return;
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.notify();
      this.scheduleNextTick();
    } else {
      this.isPlaying = false;
      this.clearTimer();
      if (this.onComplete) {
        this.onComplete(this.currentStep);
      }
    }
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private notify(): void {
    if (this.onStepChange) {
      this.onStepChange(this.currentStep);
    }
  }
}
