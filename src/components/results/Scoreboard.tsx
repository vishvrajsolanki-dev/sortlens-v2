import React from 'react';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';
import type { TraceSession } from '../../engine/types';
import type { JudgeMetric, AlgorithmId } from '../../core/adapter/types';
import {
  ALGORITHM_NAMES,
  ALGO_QUICK,
  ALGO_MERGE,
  JUDGE_COMPARISONS,
  JUDGE_WRITES,
} from '../../core/adapter/types';

export interface ScoreboardProps {
  sessions: TraceSession[];
  judgeBy: JudgeMetric;
  predictedAlgo: AlgorithmId | null;
  isComplete: boolean;
}

interface RankedResult {
  rank: number;
  isTie: boolean;
  algo: AlgorithmId;
  name: string;
  comparisons: number;
  writes: number;
  totalOps: number;
  maxDepth: number;
  overflow: boolean;
  isPredicted: boolean;
  keyMetricValue: number;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  sessions,
  judgeBy,
  predictedAlgo,
  isComplete,
}) => {
  // CRITICAL REQUIREMENT: Scoreboard is completely unavailable before race completion
  if (!isComplete || sessions.length === 0) {
    return null;
  }

  const metricLabel =
    judgeBy === JUDGE_COMPARISONS
      ? 'Comparisons'
      : judgeBy === JUDGE_WRITES
      ? 'Writes'
      : 'Total Operations';

  // 1. Calculate key metric value for each algorithm
  const results: RankedResult[] = sessions.map((s) => {
    let keyVal: number;
    if (judgeBy === JUDGE_COMPARISONS) {
      keyVal = s.cComparisons;
    } else if (judgeBy === JUDGE_WRITES) {
      keyVal = s.cWrites;
    } else {
      keyVal = s.cComparisons + s.cWrites;
    }

    return {
      rank: 1,
      isTie: false,
      algo: s.algo,
      name: ALGORITHM_NAMES[s.algo],
      comparisons: s.cComparisons,
      writes: s.cWrites,
      totalOps: s.cComparisons + s.cWrites,
      maxDepth: s.cMaxDepth,
      overflow: s.cOverflow,
      isPredicted: s.algo === predictedAlgo,
      keyMetricValue: keyVal,
    };
  });

  // 2. Sort results ascending by judged metric value
  results.sort((a, b) => a.keyMetricValue - b.keyMetricValue);

  // 3. Compute standard competition ranks (with honest tie detection)
  for (let i = 0; i < results.length; i++) {
    if (i === 0) {
      results[i]!.rank = 1;
    } else if (results[i]!.keyMetricValue === results[i - 1]!.keyMetricValue) {
      results[i]!.rank = results[i - 1]!.rank;
      results[i]!.isTie = true;
      results[i - 1]!.isTie = true;
    } else {
      results[i]!.rank = i + 1;
    }
  }

  const hasAnyOverflow = sessions.some((s) => s.cOverflow);

  return (
    <Panel
      title="Race Telemetry Scoreboard"
      subtitle={`Verified final operation counts ranked by ${metricLabel} (Ascending)`}
      badge={<Badge variant="emerald">VERIFIED OUTCOME</Badge>}
    >
      {hasAnyOverflow && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            background: 'var(--sl-color-accent-rose-subtle)',
            border: '1px solid var(--sl-color-accent-rose-border)',
            borderRadius: 'var(--sl-radius-md)',
            color: 'var(--sl-color-accent-rose)',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          <strong>Notice:</strong> One or more algorithms reached maximum trace recording limit. Final counts reflect recorded trace capacity.
        </div>
      )}

      <div className="sl-scoreboard-table-wrap">
        <table className="sl-scoreboard-table" aria-label="Final Race Results">
          <thead>
            <tr>
              <th style={{ width: '70px', textAlign: 'center' }}>Rank</th>
              <th>Algorithm</th>
              <th style={{ textAlign: 'right' }}>Comparisons</th>
              <th style={{ textAlign: 'right' }}>Writes</th>
              <th style={{ textAlign: 'right' }}>Total Ops</th>
              <th style={{ textAlign: 'center' }}>Call Stack</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center' }}>Model Pick</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => {
              const isWinner = row.rank === 1;
              const hasStack = row.algo === ALGO_QUICK || row.algo === ALGO_MERGE;

              return (
                <tr
                  key={row.algo}
                  className={isWinner ? 'sl-scoreboard-row-winner' : ''}
                >
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`sl-rank-badge ${
                        isWinner ? 'sl-rank-1' : 'sl-rank-other'
                      }`}
                    >
                      {row.isTie ? `T-${row.rank}` : `${row.rank}`}
                    </span>
                  </td>
                  <td>
                    <strong className={isWinner ? 'sl-text-primary' : 'sl-text-secondary'}>
                      {row.name}
                    </strong>
                  </td>
                  <td className="sl-font-mono" style={{ textAlign: 'right' }}>
                    {row.comparisons.toLocaleString()}
                  </td>
                  <td className="sl-font-mono" style={{ textAlign: 'right' }}>
                    {row.writes.toLocaleString()}
                  </td>
                  <td className="sl-font-mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                    {row.totalOps.toLocaleString()}
                  </td>
                  <td className="sl-font-mono" style={{ textAlign: 'center' }}>
                    {hasStack ? `${row.maxDepth} frames` : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {row.overflow ? (
                      <Badge variant="rose">OVERFLOW</Badge>
                    ) : (
                      <Badge variant="emerald">COMPLETED</Badge>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {row.isPredicted ? (
                      <Badge variant="amber">★ PREDICTED</Badge>
                    ) : (
                      <span className="sl-text-dim">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="sl-text-xs sl-text-muted" style={{ marginTop: '12px' }}>
        *All operation counts are collected directly from instrumented C99 kernel executions. Wall-clock times are omitted in accordance with academic rigor.
      </p>
    </Panel>
  );
};
