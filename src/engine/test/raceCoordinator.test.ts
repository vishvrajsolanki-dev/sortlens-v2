import { describe, it, expect, beforeAll } from 'vitest';
import { getCoreClient } from '../../core/adapter/createCoreClient';
import type { CoreClient, AlgorithmId } from '../../core/adapter/types';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
} from '../../core/adapter/types';
import { RaceCoordinator } from '../RaceCoordinator';
import type { ClockScheduler, TraceSession } from '../types';

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

describe('RaceCoordinator - 5-Algorithm Concurrency and Synchronization with Real WASM Traces', () => {
  let client: CoreClient;
  const testInput = [64, 34, 25, 12, 22, 11, 90, 88, 45, 50];
  const sortedExpected = [...testInput].sort((a, b) => a - b);
  const algos: AlgorithmId[] = [
    ALGO_BUBBLE,
    ALGO_SELECTION,
    ALGO_INSERTION,
    ALGO_QUICK,
    ALGO_MERGE,
  ];
  let sessions: TraceSession[] = [];

  beforeAll(async () => {
    client = await getCoreClient();
    sessions = algos.map((algo) => {
      client.setInputArray(testInput);
      const res = client.runSort(algo, testInput.length, true);
      return {
        algo,
        initialArray: [...testInput],
        events: res.events,
        cComparisons: res.comparisons,
        cWrites: res.writes,
        cMaxDepth: res.maxDepth,
        cOverflow: res.overflow,
        sortedArray: res.sortedArray,
      };
    });
  });

  it('initializes all 5 lanes at step 0 with matching initial arrays and zero counters', () => {
    const coordinator = new RaceCoordinator(sessions);
    const snapshot = coordinator.getSnapshot();

    expect(snapshot.status).toBe('idle');
    expect(snapshot.currentStep).toBe(0);
    expect(snapshot.maxSteps).toBeGreaterThan(0);
    expect(snapshot.isAllDone).toBe(false);
    expect(snapshot.lanes.length).toBe(5);

    for (const lane of snapshot.lanes) {
      expect(lane.isDone).toBe(false);
      expect(lane.frame.stepIndex).toBe(0);
      expect(lane.frame.array).toEqual(testInput);
      expect(lane.frame.comparisons).toBe(0);
      expect(lane.frame.writes).toBe(0);
      expect(lane.frame.isComplete).toBe(false);
    }
  });

  it('maintains independent progress and non-interfering completion across lanes', () => {
    const coordinator = new RaceCoordinator(sessions);
    const maxSteps = coordinator.getMaxSteps();

    // Step forward incrementally until all lanes are complete
    for (let step = 0; step < maxSteps; step++) {
      coordinator.stepForward();
      const current = coordinator.getCurrentStep();
      expect(current).toBe(step + 1);

      const snap = coordinator.getSnapshot();
      for (const lane of snap.lanes) {
        // If this lane has completed, verify it stays completed and retains sorted array
        if (lane.isDone) {
          expect(lane.frame.array).toEqual(sortedExpected);
        }
      }
    }

    const finalSnapshot = coordinator.getSnapshot();
    expect(finalSnapshot.status).toBe('completed');
    expect(finalSnapshot.isAllDone).toBe(true);
    expect(finalSnapshot.progress).toBe(1);

    // Verify all 5 algorithms match their C core counters exactly
    for (const lane of finalSnapshot.lanes) {
      const session = sessions.find((s) => s.algo === lane.algo)!;
      expect(lane.isDone).toBe(true);
      expect(lane.frame.array).toEqual(sortedExpected);
      expect(lane.frame.comparisons).toBe(session.cComparisons);
      expect(lane.frame.writes).toBe(session.cWrites);
    }
  });

  it('supports accurate reverse stepping across all lanes', () => {
    const coordinator = new RaceCoordinator(sessions);
    // Seek to end
    coordinator.seek(coordinator.getMaxSteps());
    expect(coordinator.getSnapshot().isAllDone).toBe(true);

    // Step backward all the way to 0
    const maxSteps = coordinator.getMaxSteps();
    for (let i = 0; i < maxSteps; i++) {
      coordinator.stepBackward();
    }

    expect(coordinator.getCurrentStep()).toBe(0);
    const snap = coordinator.getSnapshot();
    for (const lane of snap.lanes) {
      expect(lane.frame.stepIndex).toBe(0);
      expect(lane.frame.array).toEqual(testInput);
      expect(lane.frame.comparisons).toBe(0);
      expect(lane.frame.writes).toBe(0);
    }
  });

  it('supports arbitrary timeline seeking and progress seeking', () => {
    const coordinator = new RaceCoordinator(sessions);
    const maxSteps = coordinator.getMaxSteps();

    // Seek to 50%
    coordinator.seekProgress(0.5);
    const midSnapshot = coordinator.getSnapshot();
    expect(midSnapshot.currentStep).toBe(Math.round(0.5 * maxSteps));
    expect(midSnapshot.progress).toBeCloseTo(0.5, 1);

    // Seek to 0%
    coordinator.seekProgress(0);
    expect(coordinator.getCurrentStep()).toBe(0);

    // Seek to 100%
    coordinator.seekProgress(1);
    expect(coordinator.getCurrentStep()).toBe(maxSteps);
    expect(coordinator.getSnapshot().isAllDone).toBe(true);
  });

  it('coordinates live playback with clock ticks and stops on race completion', () => {
    const scheduler = new MockScheduler();
    const coordinator = new RaceCoordinator(sessions, scheduler);
    coordinator.setSpeed(100); // 100 steps/sec

    coordinator.play();
    expect(coordinator.getStatus()).toBe('playing');

    // Advance 50 seconds in mock time (5,000 steps, enough to finish all lanes)
    // Advance in 500ms increments (50 steps per tick)
    for (let i = 0; i < 100; i++) {
      if (coordinator.getStatus() === 'completed') {
        break;
      }
      scheduler.advance(500);
    }

    expect(coordinator.getStatus()).toBe('completed');
    expect(coordinator.getSnapshot().isAllDone).toBe(true);

    coordinator.dispose();
  });
});
