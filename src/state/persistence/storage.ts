import type { DatasetPattern, NavigationSection } from '../appStore';
import type { JudgeMetric } from '../../core/adapter/types';
import {
  STORAGE_VERSION,
  PREFERENCES_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_RECORDS,
  DEFAULT_PREFERENCES,
  type StoredPreferences,
  type CompletedRunRecord,
  type StoredHistory,
} from './schema';

const VALID_PATTERNS: ReadonlySet<DatasetPattern> = new Set([
  'random',
  'sorted',
  'nearly_sorted',
  'reverse',
  'few_unique',
  'custom',
]);

const VALID_SECTIONS: ReadonlySet<NavigationSection> = new Set([
  'arena',
  'analysis',
  'search',
  'scaling',
  'viva',
]);

const VALID_JUDGE_METRICS: ReadonlySet<JudgeMetric> = new Set([0, 1, 2]);

/**
 * Checks whether localStorage is available and writable in the current runtime.
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const testKey = '__sl_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates and sanitizes raw preferences object.
 */
function sanitizePreferences(raw: unknown): StoredPreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }

  const obj = raw as Partial<StoredPreferences>;

  // Check version compatibility
  if (typeof obj.version !== 'number' || obj.version !== STORAGE_VERSION) {
    return { ...DEFAULT_PREFERENCES };
  }

  const arraySize =
    typeof obj.arraySize === 'number' && !Number.isNaN(obj.arraySize)
      ? Math.max(2, Math.min(100, Math.floor(obj.arraySize)))
      : DEFAULT_PREFERENCES.arraySize;

  const datasetPattern =
    obj.datasetPattern && VALID_PATTERNS.has(obj.datasetPattern)
      ? obj.datasetPattern
      : DEFAULT_PREFERENCES.datasetPattern;

  const judgeBy =
    obj.judgeBy !== undefined && VALID_JUDGE_METRICS.has(obj.judgeBy)
      ? obj.judgeBy
      : DEFAULT_PREFERENCES.judgeBy;

  const playbackSpeed =
    typeof obj.playbackSpeed === 'number' && !Number.isNaN(obj.playbackSpeed)
      ? Math.max(5, Math.min(120, obj.playbackSpeed))
      : DEFAULT_PREFERENCES.playbackSpeed;

  const activeSection =
    obj.activeSection && VALID_SECTIONS.has(obj.activeSection)
      ? obj.activeSection
      : DEFAULT_PREFERENCES.activeSection;

  const sidebarCollapsed = typeof obj.sidebarCollapsed === 'boolean' ? obj.sidebarCollapsed : false;

  return {
    version: STORAGE_VERSION,
    arraySize,
    datasetPattern,
    judgeBy,
    playbackSpeed,
    activeSection,
    sidebarCollapsed,
  };
}

/**
 * Loads preferences from localStorage with fallback to defaults.
 */
export function loadPreferences(): StoredPreferences {
  if (!isStorageAvailable()) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PREFERENCES };
    }
    const parsed = JSON.parse(raw);
    return sanitizePreferences(parsed);
  } catch {
    // Malformed JSON or read error -> fallback safely
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Saves preferences to localStorage.
 */
export function savePreferences(prefs: Partial<StoredPreferences>): boolean {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    const current = loadPreferences();
    const updated: StoredPreferences = sanitizePreferences({
      ...current,
      ...prefs,
      version: STORAGE_VERSION,
    });
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.warn('[SortLens Persistence] Failed to save preferences:', err);
    return false;
  }
}

/**
 * Resets preferences to factory defaults in localStorage.
 */
export function resetPreferences(): StoredPreferences {
  if (isStorageAvailable()) {
    try {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    } catch {
      // ignore
    }
  }
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Validates a single completed run record.
 */
function isValidRunRecord(record: unknown): record is CompletedRunRecord {
  if (!record || typeof record !== 'object') return false;
  const r = record as Partial<CompletedRunRecord>;
  return (
    typeof r.id === 'string' &&
    typeof r.timestamp === 'number' &&
    typeof r.arraySize === 'number' &&
    typeof r.winnerAlgo === 'number' &&
    typeof r.winnerCost === 'number' &&
    Array.isArray(r.lanes) &&
    r.lanes.length === 5
  );
}

/**
 * Loads completed run history from localStorage.
 */
export function loadHistory(): CompletedRunRecord[] {
  if (!isStorageAvailable()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StoredHistory;
    if (!parsed || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.records)) {
      return [];
    }

    // Filter and return only valid records, sorted newest first
    return parsed.records.filter(isValidRunRecord);
  } catch {
    return [];
  }
}

/**
 * Saves a completed run record with idempotent check and bound capped at MAX_HISTORY_RECORDS.
 * Automatically recovers from QuotaExceededError by pruning older records.
 */
export function saveCompletedRun(record: CompletedRunRecord): boolean {
  if (!isStorageAvailable() || !isValidRunRecord(record)) {
    return false;
  }

  try {
    const currentRecords = loadHistory();

    // Idempotency: do not re-add if record with same id already exists
    if (currentRecords.some((r) => r.id === record.id)) {
      return true;
    }

    // Newest first, bound to MAX_HISTORY_RECORDS
    const updated = [record, ...currentRecords].slice(0, MAX_HISTORY_RECORDS);
    const envelope: StoredHistory = {
      version: STORAGE_VERSION,
      records: updated,
    };

    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(envelope));
      return true;
    } catch (quotaErr) {
      // If QuotaExceededError, aggressively prune half the records and retry once
      console.warn('[SortLens Persistence] Storage quota hit, pruning older history records...');
      const pruned = updated.slice(0, Math.floor(MAX_HISTORY_RECORDS / 2));
      const prunedEnvelope: StoredHistory = {
        version: STORAGE_VERSION,
        records: pruned,
      };
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(prunedEnvelope));
      return true;
    }
  } catch (err) {
    console.warn('[SortLens Persistence] Failed to record completed run:', err);
    return false;
  }
}

/**
 * Clears history from storage.
 */
export function clearHistory(): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Exports history records as a JSON string for academic reports.
 */
export function exportHistoryJson(): string {
  const records = loadHistory();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: STORAGE_VERSION,
      count: records.length,
      records,
    },
    null,
    2
  );
}
