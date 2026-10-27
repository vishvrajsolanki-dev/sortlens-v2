// Algorithm IDs matching sortlens.h
export const ALGO_BUBBLE = 0;
export const ALGO_SELECTION = 1;
export const ALGO_INSERTION = 2;
export const ALGO_QUICK = 3;
export const ALGO_MERGE = 4;
export const ALGO_COUNT = 5;

export type AlgorithmId =
  | typeof ALGO_BUBBLE
  | typeof ALGO_SELECTION
  | typeof ALGO_INSERTION
  | typeof ALGO_QUICK
  | typeof ALGO_MERGE;

export const ALGORITHM_NAMES: Record<AlgorithmId, string> = {
  [ALGO_BUBBLE]: 'Bubble Sort',
  [ALGO_SELECTION]: 'Selection Sort',
  [ALGO_INSERTION]: 'Insertion Sort',
  [ALGO_QUICK]: 'Quick Sort (Lomuto)',
  [ALGO_MERGE]: 'Merge Sort (Top-down)',
};

// Judge Metric IDs matching sortlens.h
export const JUDGE_COMPARISONS = 0;
export const JUDGE_WRITES = 1;
export const JUDGE_TOTAL = 2;

export type JudgeMetric =
  | typeof JUDGE_COMPARISONS
  | typeof JUDGE_WRITES
  | typeof JUDGE_TOTAL;

// Event types matching sortlens.h
export const EV_COMPARE = 1;
export const EV_SWAP = 2;
export const EV_WRITE = 3;
export const EV_PIVOT = 4;
export const EV_RANGE = 5;
export const EV_PUSH = 6;
export const EV_POP = 7;
export const EV_DONE = 8;

export type EventType =
  | typeof EV_COMPARE
  | typeof EV_SWAP
  | typeof EV_WRITE
  | typeof EV_PIVOT
  | typeof EV_RANGE
  | typeof EV_PUSH
  | typeof EV_POP
  | typeof EV_DONE;

export interface TraceEvent {
  type: EventType;
  a: number;
  b: number;
  c: number;
  d: number;
}

// Search Kinds
export const SEARCH_LINEAR = 0;
export const SEARCH_BINARY = 1;

export type SearchKind = typeof SEARCH_LINEAR | typeof SEARCH_BINARY;

export interface SearchStep {
  index: number;
  low: number;
  high: number;
}

export interface SearchResult {
  foundIndex: number;
  comparisons: number;
  steps: SearchStep[];
}

export interface ShapeAnalysisResult {
  inversions: number;
  inversionRatio: number;
  duplicateRatio: number;
  distinct: number;
  collisions: number;
  maxLeftGreater: number;
  estimates: number[];
  predictedAlgo: AlgorithmId;
  reason: string;
}

export interface SortRunResult {
  algo: AlgorithmId;
  comparisons: number;
  writes: number;
  maxDepth: number;
  overflow: boolean;
  eventCount: number;
  events: TraceEvent[];
  sortedArray: number[];
}

export interface HashTableData {
  size: number;
  distinctCount: number;
  collisionCount: number;
  buckets: number[][];
}

// Low-level Emscripten Module shape
export interface RawWasmModule {
  _sl_set_value: (i: number, v: number) => void;
  _sl_analyze: (n: number, judgeBy: number) => void;
  _sl_inversions: () => bigint | number;
  _sl_inversion_ratio_x1000: () => number;
  _sl_dup_ratio_x1000: () => number;
  _sl_distinct: () => number;
  _sl_collisions: () => number;
  _sl_max_left_greater: () => number;
  _sl_hash_size: () => number;
  _sl_hash_chain_length: (b: number) => number;
  _sl_hash_chain_value: (b: number, k: number) => number;
  _sl_estimate: (algo: number) => bigint | number;
  _sl_predicted: () => number;
  _sl_reason: () => number;
  _sl_run: (algo: number, n: number, record: number) => void;
  _sl_comparisons: (algo: number) => bigint | number;
  _sl_writes: (algo: number) => bigint | number;
  _sl_max_depth: (algo: number) => number;
  _sl_event_count: (algo: number) => number;
  _sl_event_type: (algo: number, k: number) => number;
  _sl_event_a: (algo: number, k: number) => number;
  _sl_event_b: (algo: number, k: number) => number;
  _sl_event_c: (algo: number, k: number) => number;
  _sl_event_d: (algo: number, k: number) => number;
  _sl_overflow: (algo: number) => number;
  _sl_result_value: (algo: number, i: number) => number;
  _sl_make_sorted: (n: number) => void;
  _sl_search: (kind: number, target: number, n: number) => number;
  _sl_search_comparisons: () => number;
  _sl_search_steps_count: () => number;
  _sl_search_step_index: (k: number) => number;
  _sl_search_step_low: (k: number) => number;
  _sl_search_step_high: (k: number) => number;
  ccall: (
    ident: string,
    returnType: string | null,
    argTypes: string[],
    args: unknown[]
  ) => unknown;
}

// Client Interface
export interface CoreClient {
  isReady(): boolean;
  init(): Promise<void>;
  setInputArray(arr: number[]): void;
  analyze(arr: number[], metric?: JudgeMetric): ShapeAnalysisResult;
  runSort(
    algo: AlgorithmId,
    n?: number,
    recordTrace?: boolean
  ): SortRunResult;
  getHashTableData(): HashTableData;
  prepareSearch(arr: number[]): number[];
  search(kind: SearchKind, target: number, n?: number): SearchResult;
}
