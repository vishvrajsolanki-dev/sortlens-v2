import React from 'react';
import type { ScalingBenchmarkResult } from './types';
import type { JudgeMetric } from '../../core/adapter/types';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
  JUDGE_COMPARISONS,
  JUDGE_WRITES,
} from '../../core/adapter/types';

export interface ScalingDataTableProps {
  result: ScalingBenchmarkResult;
  judgeBy: JudgeMetric;
}

export const ScalingDataTable: React.FC<ScalingDataTableProps> = ({ result, judgeBy }) => {
  const metricKey =
    judgeBy === JUDGE_COMPARISONS
      ? 'comparisons'
      : judgeBy === JUDGE_WRITES
      ? 'writes'
      : 'total';

  const metricLabel =
    judgeBy === JUDGE_COMPARISONS
      ? 'Comparisons'
      : judgeBy === JUDGE_WRITES
      ? 'Writes'
      : 'Total Operations';

  // Group by N
  const rows = result.sizes.map((n) => {
    const pts = result.points.filter((p) => p.n === n);
    const bubble = pts.find((p) => p.algo === ALGO_BUBBLE)?.[metricKey] ?? 0;
    const selection = pts.find((p) => p.algo === ALGO_SELECTION)?.[metricKey] ?? 0;
    const insertion = pts.find((p) => p.algo === ALGO_INSERTION)?.[metricKey] ?? 0;
    const quick = pts.find((p) => p.algo === ALGO_QUICK)?.[metricKey] ?? 0;
    const merge = pts.find((p) => p.algo === ALGO_MERGE)?.[metricKey] ?? 0;
    const inversions = pts[0]?.inversions ?? 0;

    const minVal = Math.min(bubble, selection, insertion, quick, merge);

    return {
      n,
      inversions,
      bubble,
      selection,
      insertion,
      quick,
      merge,
      minVal,
    };
  });

  return (
    <div className="sl-scaling-table-container">
      <table
        className="sl-scoreboard-table"
        role="table"
        aria-label={`Empirical Measurements Data Table: ${metricLabel} across input sizes N`}
      >
        <thead>
          <tr>
            <th style={{ width: '60px' }}>Size (N)</th>
            <th style={{ width: '90px' }}>Inversions (I)</th>
            <th style={{ color: '#38bdf8' }}>Bubble Sort</th>
            <th style={{ color: '#f97316' }}>Selection Sort</th>
            <th style={{ color: '#10b981' }}>Insertion Sort</th>
            <th style={{ color: '#8b5cf6' }}>Quick (Lomuto)</th>
            <th style={{ color: '#ec4899' }}>Merge (Top-down)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.n}>
              <td className="sl-font-mono" style={{ fontWeight: 600 }}>
                N={row.n}
              </td>
              <td className="sl-font-mono sl-text-muted">{row.inversions.toLocaleString()}</td>
              <td
                className={`sl-font-mono ${row.bubble === row.minVal ? 'sl-cell-winner' : ''}`}
              >
                {row.bubble.toLocaleString()}
                {row.bubble === row.minVal && <span className="sl-winner-star"> ★</span>}
              </td>
              <td
                className={`sl-font-mono ${row.selection === row.minVal ? 'sl-cell-winner' : ''}`}
              >
                {row.selection.toLocaleString()}
                {row.selection === row.minVal && <span className="sl-winner-star"> ★</span>}
              </td>
              <td
                className={`sl-font-mono ${row.insertion === row.minVal ? 'sl-cell-winner' : ''}`}
              >
                {row.insertion.toLocaleString()}
                {row.insertion === row.minVal && <span className="sl-winner-star"> ★</span>}
              </td>
              <td
                className={`sl-font-mono ${row.quick === row.minVal ? 'sl-cell-winner' : ''}`}
              >
                {row.quick.toLocaleString()}
                {row.quick === row.minVal && <span className="sl-winner-star"> ★</span>}
              </td>
              <td
                className={`sl-font-mono ${row.merge === row.minVal ? 'sl-cell-winner' : ''}`}
              >
                {row.merge.toLocaleString()}
                {row.merge === row.minVal && <span className="sl-winner-star"> ★</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
