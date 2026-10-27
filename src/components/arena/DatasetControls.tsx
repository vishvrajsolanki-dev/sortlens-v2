import React from 'react';
import type { DatasetPattern } from '../../state/appStore';
import type { JudgeMetric } from '../../core/adapter/types';
import {
  JUDGE_COMPARISONS,
  JUDGE_WRITES,
  JUDGE_TOTAL,
} from '../../core/adapter/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface DatasetControlsProps {
  arraySize: number;
  pattern: DatasetPattern;
  customInput: string;
  isGenerating: boolean;
  error: string | null;
  judgeBy?: JudgeMetric;
  onSizeChange: (size: number) => void;
  onPatternChange: (pattern: DatasetPattern) => void;
  onCustomInputChange: (val: string) => void;
  onGenerateNew: () => void;
  onJudgeByChange?: (metric: JudgeMetric) => void;
}

const PATTERNS: Array<{ id: DatasetPattern; label: string; desc: string }> = [
  { id: 'random', label: 'Random', desc: 'Uniform random distribution' },
  { id: 'nearly_sorted', label: 'Nearly Sorted', desc: '~10% adjacent inversions' },
  { id: 'reverse', label: 'Reverse', desc: 'Monotonically descending' },
  { id: 'sorted', label: 'Already Sorted', desc: 'Monotonically ascending' },
  { id: 'few_unique', label: 'Few Unique', desc: 'High duplicate density' },
  { id: 'custom', label: 'Custom', desc: 'User-specified array' },
];

const JUDGE_METRICS: Array<{ id: JudgeMetric; label: string; desc: string }> = [
  { id: JUDGE_COMPARISONS, label: 'Comparisons', desc: 'Rank by comparison operations' },
  { id: JUDGE_WRITES, label: 'Writes', desc: 'Rank by memory write assignments' },
  { id: JUDGE_TOTAL, label: 'Total Ops', desc: 'Rank by sum of comparisons and writes' },
];

export const DatasetControls: React.FC<DatasetControlsProps> = ({
  arraySize,
  pattern,
  customInput,
  isGenerating,
  error,
  judgeBy = JUDGE_COMPARISONS,
  onSizeChange,
  onPatternChange,
  onCustomInputChange,
  onGenerateNew,
  onJudgeByChange,
}) => {
  return (
    <section className="sl-dataset-toolbar-card" aria-label="Dataset Configuration Toolbar">
      <div className="sl-dataset-toolbar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="sl-dataset-title">Dataset Configuration</span>
          <span className="sl-dataset-subtitle">
            (N ∈ [2, 100], Values ∈ [1, 99])
          </span>
        </div>
        <Badge variant="neutral">INPUT PARAMETERS</Badge>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            background: 'var(--sl-color-accent-rose-subtle)',
            border: '1px solid var(--sl-color-accent-rose-border)',
            borderRadius: '4px',
            color: 'var(--sl-color-accent-rose)',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      <div className="sl-dataset-toolbar-row">
        {/* Array Size Slider */}
        <div className="sl-control-col">
          <label htmlFor="dataset-size-slider" className="sl-control-label">
            ARRAY SIZE: <span className="sl-control-value sl-font-mono">N = {arraySize}</span>
          </label>
          <input
            id="dataset-size-slider"
            type="range"
            min={2}
            max={100}
            value={arraySize}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            disabled={pattern === 'custom' || isGenerating}
            className="sl-size-slider"
            aria-label="Array size slider from 2 to 100"
          />
        </div>

        <div className="sl-toolbar-divider" aria-hidden="true" />

        {/* Pattern Selector */}
        <div className="sl-control-col" style={{ flex: 1, minWidth: '280px' }}>
          <span className="sl-control-label">DATASET PATTERN:</span>
          <div className="sl-pattern-button-group" role="radiogroup" aria-label="Dataset Pattern Selection">
            {PATTERNS.map((p) => {
              const isSelected = pattern === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`sl-pattern-chip ${isSelected ? 'sl-pattern-chip-active' : ''}`}
                  onClick={() => onPatternChange(p.id)}
                  disabled={isGenerating}
                  title={p.desc}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Judging Criterion Selector */}
        {onJudgeByChange && (
          <>
            <div className="sl-toolbar-divider" aria-hidden="true" />
            <div className="sl-control-col">
              <span className="sl-control-label">JUDGING CRITERION:</span>
              <div className="sl-pattern-button-group" role="radiogroup" aria-label="Judging Metric Selection">
                {JUDGE_METRICS.map((m) => {
                  const isSelected = judgeBy === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`sl-pattern-chip ${isSelected ? 'sl-pattern-chip-active' : ''}`}
                      onClick={() => onJudgeByChange(m.id)}
                      disabled={isGenerating}
                      title={m.desc}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', paddingTop: '4px' }}>
          <Button
            variant="primary"
            size="md"
            onClick={onGenerateNew}
            disabled={isGenerating}
            aria-label="Generate & Stage Race"
          >
            {isGenerating ? 'Staging Race...' : '⚡ Generate & Stage Race'}
          </Button>
        </div>
      </div>

      {/* Custom Input Field when pattern === 'custom' */}
      {pattern === 'custom' && (
        <div className="sl-custom-input-box" style={{ marginTop: '8px' }}>
          <label htmlFor="custom-array-input" className="sl-control-label">
            ENTER COMMA-SEPARATED INTEGERS (2 to 100 elements, values 1..99):
          </label>
          <input
            id="custom-array-input"
            type="text"
            value={customInput}
            onChange={(e) => onCustomInputChange(e.target.value)}
            placeholder="e.g. 42, 17, 88, 3, 99, 12, 55, 30"
            className="sl-custom-array-field sl-font-mono"
            disabled={isGenerating}
          />
        </div>
      )}
    </section>
  );
};
