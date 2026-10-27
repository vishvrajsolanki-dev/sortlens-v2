# SortLens Rebuild — Local Persistence Subsystem Specification

## 1. Architecture Overview

SortLens is an educational algorithm analyzer that operates strictly client-side without servers, databases, or cloud accounts. All user settings and telemetry history are stored locally in the browser's `localStorage` engine under strict schema versioning.

The persistence layer is housed in `src/state/persistence/`:
* `schema.ts`: Schema interfaces, constants, and default states.
* `storage.ts`: Read/write functions with input validation, graceful fallbacks, and storage quota recovery.
* `runHelper.ts`: Authoritative factory that verifies 5-algorithm race results and constructs immutable run records.
* `index.ts`: Unified module exports.

---

## 2. Storage Envelopes & Key Naming

| Data Entity | Storage Key | Schema Version | Bound / Retention |
| :--- | :--- | :--- | :--- |
| **User Preferences** | `sortlens_preferences_v1` | `1` | 1 object |
| **Telemetry History** | `sortlens_history_v1` | `1` | Max 200 records (newest-first) |

---

## 3. Schema Definitions

### 3.1 Preferences Schema (`StoredPreferences`)
```typescript
interface StoredPreferences {
  version: 1;
  arraySize: number;           // Clamped to [2, 100], integer
  datasetPattern: DatasetPattern; // 'random' | 'sorted' | 'nearly_sorted' | 'reverse' | 'few_unique' | 'custom'
  judgeBy: JudgeMetric;        // 0 (Comparisons), 1 (Writes), 2 (Total Ops)
  playbackSpeed: number;       // Clamped to [5, 120]
  activeSection: NavigationSection; // 'arena' | 'analysis' | 'search' | 'scaling' | 'viva'
  sidebarCollapsed: boolean;   // boolean flag
}
```

### 3.2 Completed Run Record (`CompletedRunRecord`)
```typescript
interface CompletedRunRecord {
  id: string;                  // Unique run identifier (e.g. 'run-1700000000000-abc123')
  timestamp: number;           // Epoch millisecond timestamp
  arraySize: number;           // Elements sorted (N)
  pattern: DatasetPattern;     // Dataset distribution
  judgeBy: JudgeMetric;        // Metric used to determine rank
  winnerAlgo: AlgorithmId;     // Algorithm that achieved rank 1
  winnerCost: number;          // Evaluated cost of the winner
  predictedAlgo: AlgorithmId | null; // C99 model pre-run prediction
  predictionCorrect: boolean | null; // true if winnerAlgo === predictedAlgo
  lanes: LaneRunSummary[];     // Exact telemetry across all 5 syllabus algorithms
}

interface LaneRunSummary {
  algo: AlgorithmId;
  comparisons: number;
  writes: number;
  totalOps: number;
  maxDepth: number;
  rank: number;
  tie: boolean;
}
```

---

## 4. Invariants & Reliability Guarantees

1. **Authoritative Completion Rule:**
   Only verified races that run to completion (`isRaceComplete === true`) and exhibit zero trace overflows (`!lane.cOverflow`) across all 5 syllabus algorithms are recorded. Incomplete runs or canceled runs are never saved.

2. **Run Idempotency:**
   Each staged dataset generates an immutable `runId`. Moving the playback scrubber back and forth across completion does not append duplicate run entries.

3. **Quota Exhaustion Recovery:**
   If `localStorage.setItem` throws `QuotaExceededError`, `saveCompletedRun` automatically prunes the oldest 50% of history records and retries the save once before failing gracefully.

4. **Schema Degradation & Recovery:**
   If a user visits SortLens with corrupt JSON or a mismatched schema version in `localStorage`, the loader catches the exception and falls back safely to `DEFAULT_PREFERENCES` without halting application bootstrap.

5. **Export & Portability:**
   Users can export their complete telemetry history at any time as a formatted JSON document via the History dialog for academic reports and viva verification.
