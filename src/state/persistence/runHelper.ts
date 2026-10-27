import type { TraceSession } from '../../engine/types';
import type { JudgeMetric, AlgorithmId } from '../../core/adapter/types';
import { JUDGE_COMPARISONS, JUDGE_WRITES } from '../../core/adapter/types';
import type { CompletedRunRecord, LaneRunSummary } from './schema';
import type { DatasetPattern } from '../appStore';

export interface CreateRunRecordParams {
  runId: string;
  timestamp?: number;
  arraySize: number;
  pattern: DatasetPattern;
  judgeBy: JudgeMetric;
  predictedAlgo: AlgorithmId | null;
  sessions: TraceSession[];
}

/**
 * Validates race sessions and produces a typed CompletedRunRecord.
 * Returns null if any session suffered trace overflow or if sessions are invalid.
 */
export function createCompletedRunRecord(params: CreateRunRecordParams): CompletedRunRecord | null {
  const { runId, timestamp = Date.now(), arraySize, pattern, judgeBy, predictedAlgo, sessions } = params;

  // Strict invariant: exactly 5 syllabus lanes and 0 overflow
  if (sessions.length !== 5 || sessions.some((s) => s.cOverflow)) {
    return null;
  }

  // 1. Calculate key metric cost
  const scored = sessions.map((s) => {
    let cost: number;
    if (judgeBy === JUDGE_COMPARISONS) {
      cost = s.cComparisons;
    } else if (judgeBy === JUDGE_WRITES) {
      cost = s.cWrites;
    } else {
      cost = s.cComparisons + s.cWrites;
    }
    return {
      algo: s.algo,
      comparisons: s.cComparisons,
      writes: s.cWrites,
      totalOps: s.cComparisons + s.cWrites,
      maxDepth: s.cMaxDepth,
      cost,
      rank: 1,
      tie: false,
    };
  });

  // 2. Sort ascending by judged cost
  scored.sort((a, b) => a.cost - b.cost);

  // 3. Compute ranks and honest tie detection
  for (let i = 0; i < scored.length; i++) {
    if (i === 0) {
      scored[i]!.rank = 1;
    } else if (scored[i]!.cost === scored[i - 1]!.cost) {
      scored[i]!.rank = scored[i - 1]!.rank;
      scored[i]!.tie = true;
      scored[i - 1]!.tie = true;
    } else {
      scored[i]!.rank = i + 1;
    }
  }

  const winner = scored[0]!;
  const winnerAlgo = winner.algo;
  const winnerCost = winner.cost;
  const predictionCorrect = predictedAlgo !== null ? winnerAlgo === predictedAlgo : null;

  const lanes: LaneRunSummary[] = scored.map((s) => ({
    algo: s.algo,
    comparisons: s.comparisons,
    writes: s.writes,
    totalOps: s.totalOps,
    maxDepth: s.maxDepth,
    rank: s.rank,
    tie: s.tie,
  }));

  return {
    id: runId,
    timestamp,
    arraySize,
    pattern,
    judgeBy,
    winnerAlgo,
    winnerCost,
    predictedAlgo,
    predictionCorrect,
    lanes,
  };
}
