import React from 'react';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';
import type { ShapeAnalysisResult, HashTableData } from '../../core/adapter/types';
import { HashTableVisualization } from './HashTableVisualization';

export interface ShapeAnalysisPanelProps {
  analysis: ShapeAnalysisResult | null;
  htData: HashTableData | null;
  arrayLength: number;
}

export const ShapeAnalysisPanel: React.FC<ShapeAnalysisPanelProps> = ({
  analysis,
  htData,
  arrayLength,
}) => {
  if (!analysis) {
    return (
      <Panel
        title="Dataset Shape Analysis"
        subtitle="Structural metrics computed via authoritative C99 core"
        badge={<Badge variant="neutral">STANDBY</Badge>}
      >
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--sl-color-text-muted)' }}>
          Select or generate a dataset to compute structural shape metrics.
        </div>
      </Panel>
    );
  }

  const n = arrayLength;
  const totalPairs = (n * (n - 1)) / 2;
  const inversionPercent = Math.round(analysis.inversionRatio * 100);
  const dupPercent = Math.round(analysis.duplicateRatio * 100);

  return (
    <Panel
      title="Dataset Shape Analysis"
      subtitle={`Pre-run mathematical inspection (N = ${n}, Total Pairs = ${totalPairs.toLocaleString()})`}
      badge={<Badge variant="violet">SHAPE METRICS</Badge>}
    >
      {/* Key Metric Rows */}
      <div className="sl-metric-row">
        <span className="sl-metric-label">
          <strong>Inversions (I):</strong>
          <span className="sl-text-xs sl-text-muted">Out-of-order pairs</span>
        </span>
        <span className="sl-metric-value sl-font-mono">
          {analysis.inversions.toLocaleString()} / {totalPairs.toLocaleString()}
        </span>
      </div>

      {/* Inversion Ratio Gauge */}
      <div className="sl-gauge-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
          <span className="sl-text-muted">Inversion Ratio: {analysis.inversionRatio.toFixed(3)} ({inversionPercent}%)</span>
          <span className="sl-text-muted">{inversionPercent === 0 ? 'Sorted' : inversionPercent === 100 ? 'Reversed' : 'Mixed'}</span>
        </div>
        <div
          className="sl-gauge-bar-track"
          role="progressbar"
          aria-valuenow={inversionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Inversion Ratio Gauge"
        >
          <div
            className="sl-gauge-bar-fill"
            style={{ width: `${inversionPercent}%` }}
          />
        </div>
      </div>

      <div className="sl-metric-row">
        <span className="sl-metric-label">
          <strong>Max Leftward Displacement (p):</strong>
          <span className="sl-text-xs sl-text-muted">max_left_greater</span>
        </span>
        <span className="sl-metric-value sl-font-mono">
          {analysis.maxLeftGreater}
        </span>
      </div>

      <div className="sl-metric-row">
        <span className="sl-metric-label">
          <strong>Distinct Elements:</strong>
          <span className="sl-text-xs sl-text-muted">Unique values</span>
        </span>
        <span className="sl-metric-value sl-font-mono">
          {analysis.distinct} / {n} ({dupPercent}% duplicates)
        </span>
      </div>

      {/* Separate-Chaining Hash Table Inspection */}
      <HashTableVisualization data={htData} />

      {/* Syllabus Pedagogical Impact Note */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--sl-color-surface-2)',
          borderRadius: 'var(--sl-radius-md)',
          borderLeft: '3px solid var(--sl-color-primary)',
          fontSize: '12px',
          color: 'var(--sl-color-text-secondary)',
          lineHeight: 'var(--sl-leading-relaxed)',
        }}
      >
        <strong className="sl-text-primary">Algorithmic Correlation:</strong>
        <ul style={{ paddingLeft: '16px', marginTop: '4px', marginBlockEnd: '0' }}>
          <li>
            <strong>Insertion Sort:</strong> Comparisons $= I + (N - 1)$. Lowest when $I \approx 0$.
          </li>
          <li>
            <strong>Bubble Sort:</strong> Terminates in $\min(p + 1, N - 1)$ passes. Exact writes $= 2 \times I$.
          </li>
          <li>
            <strong>Lomuto Quick Sort:</strong> Degrades to $O(N^2)$ when $r \to 0$, $r \to 1$, or $d \to 1$.
          </li>
        </ul>
      </div>
    </Panel>
  );
};
