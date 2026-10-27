import type {
  AlgorithmId,
  CoreClient,
  HashTableData,
  JudgeMetric,
  RawWasmModule,
  SearchResult,
  SearchStep,
  SearchKind,
  ShapeAnalysisResult,
  SortRunResult,
  TraceEvent,
  EventType,
} from './types';
import {
  ALGO_BUBBLE,
  ALGO_MERGE,
  JUDGE_COMPARISONS,
  JUDGE_TOTAL,
  SEARCH_LINEAR,
  SEARCH_BINARY,
} from './types';
import {
  CoreNotInitializedError,
  InvalidInputError,
} from './errors';
import { loadWasmModule } from './loader';

export class CoreClientImpl implements CoreClient {
  private wasm: RawWasmModule | null = null;
  private currentArrayLength = 0;

  isReady(): boolean {
    return this.wasm !== null;
  }

  async init(): Promise<void> {
    if (this.wasm) {
      return;
    }
    this.wasm = await loadWasmModule();
  }

  private ensureReady(): RawWasmModule {
    if (!this.wasm) {
      throw new CoreNotInitializedError();
    }
    return this.wasm;
  }

  private validateArray(arr: number[], minLen = 2, maxLen = 100): void {
    if (!Array.isArray(arr)) {
      throw new InvalidInputError('Input must be a valid array.');
    }
    if (arr.length < minLen || arr.length > maxLen) {
      throw new InvalidInputError(
        `Array length ${arr.length} is out of valid bounds [${minLen}, ${maxLen}].`
      );
    }
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      if (typeof val !== 'number' || !Number.isInteger(val)) {
        throw new InvalidInputError(`Element at index ${i} (${val}) must be an integer.`);
      }
    }
  }

  private validateAlgorithm(algo: AlgorithmId): void {
    if (algo < ALGO_BUBBLE || algo > ALGO_MERGE) {
      throw new InvalidInputError(`Algorithm ID ${algo} is invalid (expected 0..4).`);
    }
  }

  private validateMetric(metric: JudgeMetric): void {
    if (metric < JUDGE_COMPARISONS || metric > JUDGE_TOTAL) {
      throw new InvalidInputError(`Judge metric ${metric} is invalid (expected 0..2).`);
    }
  }

  setInputArray(arr: number[]): void {
    const wasm = this.ensureReady();
    this.validateArray(arr, 1, 100);

    const n = arr.length;
    for (let i = 0; i < n; i++) {
      const val = arr[i];
      if (val !== undefined) {
        wasm._sl_set_value(i, val);
      }
    }
    this.currentArrayLength = n;
  }

  analyze(arr: number[], metric: JudgeMetric = JUDGE_COMPARISONS): ShapeAnalysisResult {
    const wasm = this.ensureReady();
    this.validateArray(arr, 1, 100);
    this.validateMetric(metric);

    this.setInputArray(arr);
    const n = arr.length;
    wasm._sl_analyze(n, metric);

    const estimates: number[] = [];
    for (let a = 0; a < 5; a++) {
      estimates.push(Number(wasm._sl_estimate(a)));
    }

    // sl_reason returns a const char* pointer, read via ccall
    const reasonStr = String(wasm.ccall('sl_reason', 'string', [], []));

    return {
      inversions: Number(wasm._sl_inversions()),
      inversionRatio: wasm._sl_inversion_ratio_x1000() / 1000.0,
      duplicateRatio: wasm._sl_dup_ratio_x1000() / 1000.0,
      distinct: wasm._sl_distinct(),
      collisions: wasm._sl_collisions(),
      maxLeftGreater: wasm._sl_max_left_greater(),
      estimates,
      predictedAlgo: wasm._sl_predicted() as AlgorithmId,
      reason: reasonStr,
    };
  }

  runSort(
    algo: AlgorithmId,
    n?: number,
    recordTrace = true
  ): SortRunResult {
    const wasm = this.ensureReady();
    this.validateAlgorithm(algo);

    const len = n ?? this.currentArrayLength;
    if (len < 1 || len > 100) {
      throw new InvalidInputError(`Run length ${len} is out of bounds [1, 100].`);
    }

    wasm._sl_run(algo, len, recordTrace ? 1 : 0);

    const comparisons = Number(wasm._sl_comparisons(algo));
    const writes = Number(wasm._sl_writes(algo));
    const maxDepth = wasm._sl_max_depth(algo);
    const overflowRaw = wasm._sl_overflow(algo);
    const overflow = overflowRaw !== 0;
    const eventCount = wasm._sl_event_count(algo);

    if (overflow) {
      console.warn(`[SortLens] Trace overflow detected for algorithm ${algo}.`);
    }

    const events: TraceEvent[] = [];
    if (recordTrace) {
      for (let k = 0; k < eventCount; k++) {
        events.push({
          type: wasm._sl_event_type(algo, k) as EventType,
          a: wasm._sl_event_a(algo, k),
          b: wasm._sl_event_b(algo, k),
          c: wasm._sl_event_c(algo, k),
          d: wasm._sl_event_d(algo, k),
        });
      }
    }

    const sortedArray: number[] = [];
    for (let i = 0; i < len; i++) {
      sortedArray.push(wasm._sl_result_value(algo, i));
    }

    return {
      algo,
      comparisons,
      writes,
      maxDepth,
      overflow,
      eventCount,
      events,
      sortedArray,
    };
  }

  getHashTableData(): HashTableData {
    const wasm = this.ensureReady();
    const size = wasm._sl_hash_size();
    const buckets: number[][] = [];

    for (let b = 0; b < size; b++) {
      const len = wasm._sl_hash_chain_length(b);
      const chain: number[] = [];
      for (let k = 0; k < len; k++) {
        chain.push(wasm._sl_hash_chain_value(b, k));
      }
      buckets.push(chain);
    }

    return {
      size,
      distinctCount: wasm._sl_distinct(),
      collisionCount: wasm._sl_collisions(),
      buckets,
    };
  }

  prepareSearch(arr: number[]): number[] {
    const wasm = this.ensureReady();
    this.validateArray(arr, 1, 100);
    this.setInputArray(arr);
    const n = arr.length;
    wasm._sl_make_sorted(n);

    // Read sorted array from merge sort result (ALGO_MERGE = 4)
    const sorted: number[] = [];
    for (let i = 0; i < n; i++) {
      sorted.push(wasm._sl_result_value(ALGO_MERGE, i));
    }
    return sorted;
  }

  search(kind: SearchKind, target: number, n?: number): SearchResult {
    const wasm = this.ensureReady();
    if (kind !== SEARCH_LINEAR && kind !== SEARCH_BINARY) {
      throw new InvalidInputError(`Invalid search kind ${kind} (expected 0 or 1).`);
    }

    const len = n ?? this.currentArrayLength;
    if (len < 1 || len > 100) {
      throw new InvalidInputError(`Search array length ${len} is invalid.`);
    }

    const foundIndex = wasm._sl_search(kind, target, len);
    const comparisons = wasm._sl_search_comparisons();
    const stepsCount = wasm._sl_search_steps_count();

    const steps: SearchStep[] = [];
    for (let k = 0; k < stepsCount; k++) {
      steps.push({
        index: wasm._sl_search_step_index(k),
        low: wasm._sl_search_step_low(k),
        high: wasm._sl_search_step_high(k),
      });
    }

    return {
      foundIndex,
      comparisons,
      steps,
    };
  }
}

/**
 * Creates a new CoreClient instance.
 */
export function createCoreClient(): CoreClient {
  return new CoreClientImpl();
}

let defaultClient: CoreClient | null = null;

/**
 * Returns a shared, singleton CoreClient instance.
 */
export async function getCoreClient(): Promise<CoreClient> {
  if (!defaultClient) {
    defaultClient = createCoreClient();
  }
  if (!defaultClient.isReady()) {
    await defaultClient.init();
  }
  return defaultClient;
}
