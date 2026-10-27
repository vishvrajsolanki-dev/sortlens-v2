import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadPreferences,
  savePreferences,
  resetPreferences,
  loadHistory,
  saveCompletedRun,
  clearHistory,
  exportHistoryJson,
  isStorageAvailable,
} from '../../src/state/persistence/storage';
import {
  PREFERENCES_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  DEFAULT_PREFERENCES,
  MAX_HISTORY_RECORDS,
  type CompletedRunRecord,
} from '../../src/state/persistence/schema';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
  JUDGE_TOTAL,
  JUDGE_COMPARISONS,
} from '../../src/core/adapter/types';

describe('Local Persistence Subsystem — Preferences and Run History', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('isStorageAvailable', () => {
    it('detects available localStorage in test environment', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    it('gracefully handles throwing localStorage', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('SecurityError: The operation is insecure.');
      });
      expect(isStorageAvailable()).toBe(false);
      setItemSpy.mockRestore();
    });
  });

  describe('Preferences Persistence', () => {
    it('loads default preferences when storage is empty', () => {
      const prefs = loadPreferences();
      expect(prefs).toEqual(DEFAULT_PREFERENCES);
    });

    it('saves and reloads valid preferences', () => {
      const ok = savePreferences({
        arraySize: 55,
        datasetPattern: 'nearly_sorted',
        judgeBy: JUDGE_COMPARISONS,
        sidebarCollapsed: true,
      });
      expect(ok).toBe(true);

      const loaded = loadPreferences();
      expect(loaded.arraySize).toBe(55);
      expect(loaded.datasetPattern).toBe('nearly_sorted');
      expect(loaded.judgeBy).toBe(JUDGE_COMPARISONS);
      expect(loaded.sidebarCollapsed).toBe(true);
    });

    it('clamps arraySize within [2, 100] when saving', () => {
      savePreferences({ arraySize: 250 });
      expect(loadPreferences().arraySize).toBe(100);

      savePreferences({ arraySize: 0 });
      expect(loadPreferences().arraySize).toBe(2);
    });

    it('falls back to defaults upon reading malformed JSON', () => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, '{ invalid_json :::');
      const prefs = loadPreferences();
      expect(prefs).toEqual(DEFAULT_PREFERENCES);
    });

    it('falls back to defaults upon encountering an incompatible schema version', () => {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ version: 999, arraySize: 80, datasetPattern: 'random' })
      );
      const prefs = loadPreferences();
      expect(prefs).toEqual(DEFAULT_PREFERENCES);
    });

    it('resets preferences back to factory defaults', () => {
      savePreferences({ arraySize: 75, datasetPattern: 'reverse' });
      expect(loadPreferences().arraySize).toBe(75);

      const reset = resetPreferences();
      expect(reset).toEqual(DEFAULT_PREFERENCES);
      expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('Run History Persistence', () => {
    const makeSampleRecord = (id: string, timestamp = Date.now()): CompletedRunRecord => ({
      id,
      timestamp,
      arraySize: 20,
      pattern: 'random',
      judgeBy: JUDGE_TOTAL,
      winnerAlgo: ALGO_MERGE,
      winnerCost: 120,
      predictedAlgo: ALGO_MERGE,
      predictionCorrect: true,
      lanes: [
        { algo: ALGO_BUBBLE, comparisons: 190, writes: 95, totalOps: 285, maxDepth: 0, rank: 5, tie: false },
        { algo: ALGO_SELECTION, comparisons: 190, writes: 19, totalOps: 209, maxDepth: 0, rank: 4, tie: false },
        { algo: ALGO_INSERTION, comparisons: 95, writes: 95, totalOps: 190, maxDepth: 0, rank: 3, tie: false },
        { algo: ALGO_QUICK, comparisons: 80, writes: 50, totalOps: 130, maxDepth: 5, rank: 2, tie: false },
        { algo: ALGO_MERGE, comparisons: 70, writes: 50, totalOps: 120, maxDepth: 4, rank: 1, tie: false },
      ],
    });

    it('loads empty list when history storage is empty', () => {
      expect(loadHistory()).toEqual([]);
    });

    it('saves completed run and retrieves it newest first', () => {
      const rec1 = makeSampleRecord('run-1', 1000);
      const rec2 = makeSampleRecord('run-2', 2000);

      expect(saveCompletedRun(rec1)).toBe(true);
      expect(saveCompletedRun(rec2)).toBe(true);

      const history = loadHistory();
      expect(history.length).toBe(2);
      expect(history[0].id).toBe('run-2');
      expect(history[1].id).toBe('run-1');
    });

    it('enforces idempotency: does not duplicate run with identical id', () => {
      const rec = makeSampleRecord('run-duplicate-id');
      expect(saveCompletedRun(rec)).toBe(true);
      expect(saveCompletedRun(rec)).toBe(true); // second call

      const history = loadHistory();
      expect(history.length).toBe(1);
    });

    it('rejects invalid run record structure safely', () => {
      // @ts-expect-error testing invalid payload
      const ok = saveCompletedRun({ id: 'bad' });
      expect(ok).toBe(false);
      expect(loadHistory()).toEqual([]);
    });

    it('bounds history to MAX_HISTORY_RECORDS (200) by pruning oldest runs', () => {
      for (let i = 0; i < 210; i++) {
        saveCompletedRun(makeSampleRecord(`run-${i}`, 1000 + i));
      }

      const history = loadHistory();
      expect(history.length).toBe(MAX_HISTORY_RECORDS);
      // Newest run is run-209
      expect(history[0].id).toBe('run-209');
      // Oldest retained is run-10 (runs 0..9 were pruned)
      expect(history[history.length - 1].id).toBe('run-10');
    });

    it('recovers from QuotaExceededError by pruning half of records and retrying', () => {
      let callCount = 0;
      const originalSetItem = localStorage.setItem.bind(localStorage);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => {
        if (key === HISTORY_STORAGE_KEY) {
          callCount++;
          if (callCount === 1) {
            const err = new Error('QuotaExceededError');
            err.name = 'QuotaExceededError';
            throw err;
          }
        }
        originalSetItem(key, val);
      });

      // Pre-seed some records
      for (let i = 0; i < 50; i++) {
        saveCompletedRun(makeSampleRecord(`seed-${i}`, 1000 + i));
      }

      // This will trigger QuotaExceededError on first write and prune
      const ok = saveCompletedRun(makeSampleRecord('quota-trigger', 99999));
      expect(ok).toBe(true);

      const history = loadHistory();
      expect(history.length).toBeLessThanOrEqual(51);
      expect(history[0].id).toBe('quota-trigger');
    });

    it('clears history completely', () => {
      saveCompletedRun(makeSampleRecord('run-to-clear'));
      expect(loadHistory().length).toBe(1);

      expect(clearHistory()).toBe(true);
      expect(loadHistory()).toEqual([]);
    });

    it('exports formatted JSON string containing metadata and records', () => {
      saveCompletedRun(makeSampleRecord('export-run'));
      const jsonStr = exportHistoryJson();
      const parsed = JSON.parse(jsonStr);

      expect(parsed.count).toBe(1);
      expect(parsed.records[0].id).toBe('export-run');
      expect(parsed.version).toBe(1);
      expect(typeof parsed.exportedAt).toBe('string');
    });
  });
});
