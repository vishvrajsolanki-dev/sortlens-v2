import React from 'react';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { ShapeAnalysisResult, JudgeMetric, AlgorithmId } from '../../core/adapter/types';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
  ALGORITHM_NAMES,
  JUDGE_COMPARISONS,
  JUDGE_WRITES,
} from '../../core/adapter/types';

export interface PredictionPanelProps {
  analysis: ShapeAnalysisResult | null;
  judgeBy: JudgeMetric;
  isRevealed: boolean;
  onToggleReveal: () => void;
}

const ALGOS_IN_ORDER: AlgorithmId[] = [
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
];

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  analysis,
  judgeBy,
  isRevealed,
  onToggleReveal,
}) => {
  const metricLabel =
    judgeBy === JUDGE_COMPARISONS
      ? 'Comparisons'
      : judgeBy === JUDGE_WRITES
      ? 'Writes'
      : 'Total Operations';

  if (!analysis) {
    return (
      <Panel
        title="Empirical Cost Model Prediction"
        subtitle="Calibrated mathematical predictions (96.5% baseline accuracy)"
        badge={<Badge variant="amber">SIGNAL</Badge>}
        className="sl-prediction-panel"
      >
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--sl-color-text-muted)' }}>
          Awaiting dataset selection to compute cost model estimates.
        </div>
      </Panel>
    );
  }

  const predictedName = ALGORITHM_NAMES[analysis.predictedAlgo] ?? 'Unknown Algorithm';

  return (
    <Panel
      title="Empirical Cost Model Prediction"
      subtitle={`Judging criterion: ${metricLabel} (Calibrated C99 model)`}
      badge={<Badge variant="amber">PREDICTION SIGNAL</Badge>}
      className="sl-prediction-panel"
      action={
        <Button
          variant={isRevealed ? 'secondary' : 'primary'}
          size="sm"
          onClick={onToggleReveal}
          aria-label={isRevealed ? 'Hide model prediction' : 'Reveal model prediction'}
        >
          {isRevealed ? '👁 Hide Prediction' : '⚡ Reveal Model Prediction'}
        </Button>
      }
    >
      {!isRevealed ? (
        /* Hidden Prediction State: Zero information leakage */
        <div className="sl-prediction-hidden-box">
          <div style={{ fontSize: '32px' }} aria-hidden="true">
            🎯
          </div>
          <div>
            <h3 className="sl-text-base sl-text-primary" style={{ margin: '0 0 6px 0' }}>
              Hypothesize Before Revealing
            </h3>
            <p className="sl-text-xs sl-text-secondary" style={{ margin: 0, maxWidth: '340px' }}>
              Inspect the dataset shape metrics on the left. Which algorithm do you predict will achieve the lowest {metricLabel.toLowerCase()}?
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={onToggleReveal} aria-label="Reveal model prediction">
            Reveal Model Prediction
          </Button>
        </div>
      ) : (
        /* Revealed Prediction State */
        <div className="sl-prediction-revealed-box">
          <div className="sl-prediction-banner">
            <div>
              <span className="sl-text-xs sl-text-muted" style={{ display: 'block', marginBottom: '2px' }}>
                PREDICTED CHEAPEST ALGORITHM:
              </span>
              <span className="sl-prediction-algo-title">
                {predictedName}
              </span>
            </div>
            <Badge variant="amber" withDot>
              PREDICTED WINNER
            </Badge>
          </div>

          <div>
            <span className="sl-text-xs sl-text-muted" style={{ fontWeight: 600 }}>
              MODEL RATIONALE:
            </span>
            <p
              className="sl-text-sm sl-text-primary"
              style={{
                marginTop: '4px',
                padding: '8px 12px',
                background: 'var(--sl-color-surface-2)',
                borderRadius: 'var(--sl-radius-md)',
                borderLeft: '3px solid var(--sl-color-accent-amber)',
              }}
            >
              {analysis.reason}
            </p>
          </div>

          {/* Pre-run Operation Estimates Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="sl-text-xs sl-text-muted" style={{ fontWeight: 600 }}>
                CLOSED-FORM COST ESTIMATES ({metricLabel.toUpperCase()}):
              </span>
              <span className="sl-text-xs sl-text-dim">
                *Pre-run estimates, not actual counters
              </span>
            </div>

            <table className="sl-estimates-table" aria-label="Pre-run algorithm cost estimates">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th style={{ textAlign: 'right' }}>Estimated {metricLabel}</th>
                  <th style={{ textAlign: 'center' }}>Model Pick</th>
                </tr>
              </thead>
              <tbody>
                {ALGOS_IN_ORDER.map((algo) => {
                  const isPredicted = algo === analysis.predictedAlgo;
                  const est = analysis.estimates[algo] ?? 0;

                  return (
                    <tr key={algo} className={isPredicted ? 'sl-predicted-row' : ''}>
                      <td>{ALGORITHM_NAMES[algo]}</td>
                      <td className="sl-font-mono" style={{ textAlign: 'right' }}>
                        {est.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isPredicted ? (
                          <span style={{ color: 'var(--sl-color-accent-amber)', fontWeight: 700 }}>
                            ★ PREDICTED
                          </span>
                        ) : (
                          <span className="sl-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Panel>
  );
};
