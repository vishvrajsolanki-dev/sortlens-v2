import { describe, it, expect, beforeAll } from 'vitest';
import { getCoreClient } from '../../src/core/adapter/createCoreClient';
import type { CoreClient, AlgorithmId } from '../../src/core/adapter/types';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
} from '../../src/core/adapter/types';
import { RaceCoordinator } from '../../src/engine/RaceCoordinator';
import type { TraceSession } from '../../src/engine/types';
import { generateDataset } from '../../src/core/dataset/generator';

const ALL_ALGOS: AlgorithmId[] = [
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
];

describe('Telemetry & State Parity across Live Race Visualization', () => {
  let client: CoreClient;

  beforeAll(async () => {
    client = await getCoreClient();
  });

  it('guarantees 100% operation counter parity and exact sorted state for all 5 algorithms on random input', () => {
    const input = generateDataset('random', 25, 42);
    const sessions: TraceSession[] = [];

    for (const algo of ALL_ALGOS) {
      client.setInputArray(input);
      const res = client.runSort(algo);
      sessions.push({
        algo,
        initialArray: [...input],
        events: res.events,
        cComparisons: res.comparisons,
        cWrites: res.writes,
        cMaxDepth: res.maxDepth,
        cOverflow: res.overflow,
        sortedArray: res.sortedArray,
      });
    }

    const coordinator = new RaceCoordinator(sessions);

    // Seek to the end of the race
    coordinator.seek(coordinator.getMaxSteps());
    const snap = coordinator.getSnapshot();

    expect(snap.status).toBe('completed');
    expect(snap.lanes).toHaveLength(5);

    for (let i = 0; i < snap.lanes.length; i++) {
      const lane = snap.lanes[i]!;
      const session = sessions[i]!;

      // 1. Array state must be sorted and match C core output
      expect([...lane.frame.array]).toEqual([...session.sortedArray]);

      // 2. Comparisons counter must match authoritative C core counter exactly
      expect(lane.frame.comparisons).toBe(session.cComparisons);

      // 3. Writes counter must match authoritative C core counter exactly
      expect(lane.frame.writes).toBe(session.cWrites);

      // 4. Algorithm state must report completed
      expect(lane.isDone).toBe(true);
      expect(lane.frame.isComplete).toBe(true);

      // 5. Array must be monotonically sorted
      for (let j = 0; j < lane.frame.array.length - 1; j++) {
        expect(lane.frame.array[j]).toBeLessThanOrEqual(lane.frame.array[j + 1]!);
      }
    }

    coordinator.dispose();
  });

  it('guarantees parity on reverse-sorted input (worst-case stress)', () => {
    const input = generateDataset('reverse', 20, 99);
    const sessions: TraceSession[] = [];

    for (const algo of ALL_ALGOS) {
      client.setInputArray(input);
      const res = client.runSort(algo);
      sessions.push({
        algo,
        initialArray: [...input],
        events: res.events,
        cComparisons: res.comparisons,
        cWrites: res.writes,
        cMaxDepth: res.maxDepth,
        cOverflow: res.overflow,
        sortedArray: res.sortedArray,
      });
    }

    const coordinator = new RaceCoordinator(sessions);
    coordinator.seek(coordinator.getMaxSteps());
    const snap = coordinator.getSnapshot();

    expect(snap.lanes).toHaveLength(5);

    for (let i = 0; i < snap.lanes.length; i++) {
      const lane = snap.lanes[i]!;
      const session = sessions[i]!;

      expect([...lane.frame.array]).toEqual([...session.sortedArray]);
      expect(lane.frame.comparisons).toBe(session.cComparisons);
      expect(lane.frame.writes).toBe(session.cWrites);
      expect(lane.isDone).toBe(true);
    }

    coordinator.dispose();
  });

  it('reconstructs step 0 with exact initial array, 0 comparisons, and 0 writes', () => {
    const input = generateDataset('random', 15, 101);
    const sessions: TraceSession[] = [];

    for (const algo of ALL_ALGOS) {
      client.setInputArray(input);
      const res = client.runSort(algo);
      sessions.push({
        algo,
        initialArray: [...input],
        events: res.events,
        cComparisons: res.comparisons,
        cWrites: res.writes,
        cMaxDepth: res.maxDepth,
        cOverflow: res.overflow,
        sortedArray: res.sortedArray,
      });
    }

    const coordinator = new RaceCoordinator(sessions);
    // Seek to middle, then back to 0
    coordinator.seek(10);
    coordinator.restart();
    const snap = coordinator.getSnapshot();

    expect(snap.currentStep).toBe(0);

    for (const lane of snap.lanes) {
      expect([...lane.frame.array]).toEqual(input);
      expect(lane.frame.comparisons).toBe(0);
      expect(lane.frame.writes).toBe(0);
      expect(lane.frame.stepIndex).toBe(0);
      expect(lane.isDone).toBe(false);
    }

    coordinator.dispose();
  });
});
