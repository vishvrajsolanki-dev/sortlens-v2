import React from 'react';
import type { TraceSession } from '../../engine/types';
import type { JudgeMetric, AlgorithmId } from '../../core/adapter/types';
import {
  ALGORITHM_NAMES,
  JUDGE_COMPARISONS,
  JUDGE_WRITES,
} from '../../core/adapter/types';
import { Badge } from '../ui/Badge';

export interface PredictionVerdictProps {
  sessions: TraceSession[];
  predictedAlgo: AlgorithmId | null;
  judgeBy: JudgeMetric;
  isComplete: boolean;
}

export type VerdictStatus = 'confirmed' | 'missed' | 'inconclusive' | 'unavailable';

export const PredictionVerdict: React.FC<PredictionVerdictProps> = ({
  sessions,
  predictedAlgo,
  judgeBy,
  isComplete,
}) => {
  if (!isComplete || sessions.length === 0 || predictedAlgo === null) {
    return null;
  }

  const metricLabel =
    judgeBy === JUDGE_COMPARISONS
      ? 'comparisons'
      : judgeBy === JUDGE_WRITES
      ? 'writes'
      : 'total operations';

  const hasOverflow = sessions.some((s) => s.cOverflow);

  // Determine actual minimum key metric value
  const getKeyVal = (s: TraceSession) =>
    judgeBy === JUDGE_COMPARISONS
      ? s.cComparisons
      : judgeBy === JUDGE_WRITES
      ? s.cWrites
      : s.cComparisons + s.cWrites;

  let minVal = Infinity;
  for (const s of sessions) {
    const val = getKeyVal(s);
    if (val < minVal) {
      minVal = val;
    }
  }

  const winners = sessions.filter((s) => getKeyVal(s) === minVal);
  const predictedName = ALGORITHM_NAMES[predictedAlgo] ?? 'Predicted';

  let status: VerdictStatus = 'confirmed';
  let title = '';
  let description = '';
  let badgeVariant: 'emerald' | 'amber' | 'neutral' | 'rose' = 'emerald';
  let badgeText = '';

  if (hasOverflow) {
    status = 'unavailable';
    badgeVariant = 'rose';
    badgeText = 'VERDICT UNAVAILABLE';
    title = 'Execution Overflow Detected';
    description =
      'One or more algorithm lanes exceeded the allocated trace recording buffer. Final operations were truncated before natural termination, so a verified winner verdict cannot be certified.';
  } else if (winners.length > 1) {
    status = 'inconclusive';
    badgeVariant = 'neutral';
    badgeText = 'INCONCLUSIVE (TIE)';
    const winnerNames = winners.map((w) => ALGORITHM_NAMES[w.algo]).join(' & ');
    title = `Tied Race Outcome (${winnerNames})`;
    description = `Multiple algorithms completed with the exact same lowest ${metricLabel} count (${minVal.toLocaleString()}). The empirical model predicts a unique optimal algorithm, yielding an inconclusive tie.`;
  } else if (winners.length === 1 && winners[0]!.algo === predictedAlgo) {
    status = 'confirmed';
    badgeVariant = 'emerald';
    badgeText = 'PREDICTION CONFIRMED';
    title = `Model Prediction Confirmed: ${predictedName} Won`;
    description = `The C99 cost model accurately predicted ${predictedName} based on the input dataset's structural metrics. It achieved Rank 1 with ${minVal.toLocaleString()} ${metricLabel}.`;
  } else {
    status = 'missed';
    badgeVariant = 'amber';
    badgeText = 'PREDICTION MISSED';
    const actualWinner = ALGORITHM_NAMES[winners[0]!.algo];
    title = `Model Prediction Missed: ${actualWinner} Won`;
    description = `The cost model predicted ${predictedName}, but ${actualWinner} achieved fewer ${metricLabel} (${minVal.toLocaleString()}). In accordance with SortLens academic honesty, empirical prediction limits are explicitly reported.`;
  }

  return (
    <section
      className={`sl-verdict-banner sl-verdict-${status}`}
      role="region"
      aria-label="Empirical Prediction Verification Verdict"
    >
      <div className="sl-verdict-header">
        <h3 className="sl-verdict-title sl-text-primary" style={{ margin: 0 }}>
          {title}
        </h3>
        <Badge variant={badgeVariant} withDot>
          {badgeText}
        </Badge>
      </div>

      <p className="sl-verdict-desc" style={{ margin: 0 }}>
        {description}
      </p>
    </section>
  );
};
