import React from 'react';
import { Badge } from '../ui/Badge';
import type { SearchStep } from '../../core/adapter/types';

export interface SearchVisualizerProps {
  title: string;
  badge: React.ReactNode;
  complexity: string;
  array: number[];
  target: number;
  currentStep: SearchStep | null;
  stepIndex: number;
  totalSteps: number;
  finalFoundIndex: number;
  finalComparisons: number;
  isComplete: boolean;
  isBinary: boolean;
  onCellClick?: (value: number) => void;
}

export const SearchVisualizer: React.FC<SearchVisualizerProps> = ({
  title,
  badge,
  complexity,
  array,
  target,
  currentStep,
  stepIndex,
  totalSteps,
  finalFoundIndex,
  finalComparisons,
  isComplete,
  isBinary,
  onCellClick,
}) => {
  const currentProbedIndex = currentStep ? currentStep.index : -1;
  const low = currentStep ? currentStep.low : 0;
  const high = currentStep ? currentStep.high : array.length - 1;

  // Comparisons elapsed up to this step
  const elapsedComps = currentStep ? stepIndex + 1 : 0;

  // Found state at current step
  const isFoundCurrent =
    currentStep !== null && array[currentStep.index] === target;
  const isFinalFound = isComplete && finalFoundIndex !== -1;
  const isFinalNotFound = isComplete && finalFoundIndex === -1;

  return (
    <div className="sl-search-viz-card">
      <div className="sl-search-viz-header">
        <div className="sl-search-viz-title-group">
          <h3 className="sl-search-viz-title">{title}</h3>
          <div className="sl-search-viz-badges">
            {badge}
            <span className="sl-search-complexity-pill">{complexity}</span>
          </div>
        </div>
        <div className="sl-search-viz-telemetry">
          <div className="sl-telemetry-item">
            <span className="sl-telemetry-label">COMPARISONS:</span>
            <span className="sl-telemetry-val sl-font-mono">
              {isComplete ? finalComparisons : elapsedComps}
            </span>
          </div>
          <div className="sl-telemetry-item">
            <span className="sl-telemetry-label">STEP:</span>
            <span className="sl-telemetry-val sl-font-mono">
              {totalSteps > 0 ? stepIndex + 1 : 0} / {totalSteps}
            </span>
          </div>
          {isBinary && currentStep && (
            <div className="sl-telemetry-item">
              <span className="sl-telemetry-label">WINDOW [L, H]:</span>
              <span className="sl-telemetry-val sl-font-mono">
                [{low}, {high}]
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Array Cells Display */}
      <div className="sl-search-cells-container">
        <div
          className="sl-search-cells-grid"
          role="list"
          aria-label={`${title} Array Probes`}
        >
          {array.map((value, idx) => {
            const isProbed = idx === currentProbedIndex;
            const isOutsideWindow = isBinary && currentStep !== null && (idx < low || idx > high);
            const isInspectedLinear = !isBinary && currentStep !== null && idx < currentProbedIndex;
            const isFoundTarget =
              (isFoundCurrent && idx === currentProbedIndex) ||
              (isComplete && idx === finalFoundIndex);

            let cellClass = 'sl-search-cell';
            if (isFoundTarget) cellClass += ' sl-search-cell-found';
            else if (isProbed) cellClass += ' sl-search-cell-probed';
            else if (isOutsideWindow) cellClass += ' sl-search-cell-dimmed';
            else if (isInspectedLinear) cellClass += ' sl-search-cell-inspected';

            return (
              <button
                key={idx}
                type="button"
                className={cellClass}
                onClick={() => onCellClick?.(value)}
                title={`Index ${idx}: Value ${value}. Click to set as search target.`}
                aria-label={`Index ${idx}, Value ${value}`}
              >
                <span className="sl-search-cell-index">{idx}</span>
                <span className="sl-search-cell-value">{value}</span>
                {isProbed && (
                  <span className="sl-search-probe-indicator" aria-hidden="true">
                    ▼
                  </span>
                )}
                {isBinary && idx === low && (
                  <span className="sl-search-bound-tag sl-bound-low">L</span>
                )}
                {isBinary && idx === high && (
                  <span className="sl-search-bound-tag sl-bound-high">H</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Step & Status Takeaway */}
      <div className="sl-search-status-bar">
        {isFinalFound && (
          <div className="sl-search-status-badge sl-status-found">
            <Badge variant="emerald" withDot>
              FOUND AT INDEX {finalFoundIndex}
            </Badge>
            <span className="sl-text-xs sl-text-secondary">
              Verified element <code>A[{finalFoundIndex}] = {target}</code> in{' '}
              {finalComparisons} {finalComparisons === 1 ? 'comparison' : 'comparisons'}.
            </span>
          </div>
        )}
        {isFinalNotFound && (
          <div className="sl-search-status-badge sl-status-notfound">
            <Badge variant="amber" withDot>
              NOT FOUND (-1)
            </Badge>
            <span className="sl-text-xs sl-text-secondary">
              Target {target} does not exist in array after {finalComparisons} comparisons.
            </span>
          </div>
        )}
        {!isComplete && currentStep && (
          <div className="sl-search-step-desc">
            {isBinary ? (
              <span>
                Midpoint <strong>A[{currentStep.index}] = {array[currentStep.index]}</strong> probed against target <strong>{target}</strong>.{' '}
                {array[currentStep.index] === target
                  ? 'Target match confirmed!'
                  : array[currentStep.index]! < target
                  ? `Value < target (${target}): discarding left window [${low}..${currentStep.index}].`
                  : `Value > target (${target}): discarding right window [${currentStep.index}..${high}].`}
              </span>
            ) : (
              <span>
                Scanning sequential index <strong>A[{currentStep.index}] = {array[currentStep.index]}</strong>.{' '}
                {array[currentStep.index] === target
                  ? 'Target match confirmed!'
                  : `A[${currentStep.index}] ≠ ${target}: continuing forward.`}
              </span>
            )}
          </div>
        )}
        {!isComplete && !currentStep && (
          <div className="sl-search-step-desc sl-text-muted">
            Press Play or Step Forward to begin execution.
          </div>
        )}
      </div>
    </div>
  );
};
