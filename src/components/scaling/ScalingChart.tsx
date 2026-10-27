import React, { useState, useMemo } from 'react';
import type { ScalingBenchmarkResult, ScalingDataPoint } from './types';
import type { JudgeMetric, AlgorithmId } from '../../core/adapter/types';
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

export interface ScalingChartProps {
  result: ScalingBenchmarkResult;
  judgeBy: JudgeMetric;
  showTheoretical: boolean;
  showEstimates: boolean;
  useLogScale: boolean;
}

const ALGO_COLORS: Record<AlgorithmId, string> = {
  [ALGO_BUBBLE]: '#38bdf8',    // Sky
  [ALGO_SELECTION]: '#f97316', // Orange
  [ALGO_INSERTION]: '#10b981', // Emerald
  [ALGO_QUICK]: '#8b5cf6',     // Violet
  [ALGO_MERGE]: '#ec4899',     // Rose
};

export const ScalingChart: React.FC<ScalingChartProps> = ({
  result,
  judgeBy,
  showTheoretical,
  showEstimates,
  useLogScale,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ScalingDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dimensions
  const svgWidth = 840;
  const svgHeight = 480;
  const padL = 70;
  const padR = 40;
  const padT = 40;
  const padB = 60;
  const plotW = svgWidth - padL - padR;
  const plotH = svgHeight - padT - padB;

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

  const sizes = result.sizes;
  const minN = sizes[0] ?? 10;
  const maxN = sizes[sizes.length - 1] ?? 100;

  // Maximum value for scaling Y
  const maxVal = useMemo(() => {
    let max = 100;
    for (const p of result.points) {
      const val = p[metricKey];
      if (val > max) max = val;
      if (showEstimates && p.estimate > max) max = p.estimate;
    }
    // Round up to nearest nice interval
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / magnitude) * magnitude;
  }, [result.points, metricKey, showEstimates]);

  // Coordinate mappers
  const getX = (n: number) => {
    if (maxN === minN) return padL + plotW / 2;
    return padL + ((n - minN) / (maxN - minN)) * plotW;
  };

  const getY = (val: number) => {
    if (useLogScale) {
      const minLog = 0;
      const maxLog = Math.log10(Math.max(10, maxVal));
      const valLog = Math.log10(Math.max(1, val));
      const norm = (valLog - minLog) / (maxLog - minLog);
      return padT + plotH - norm * plotH;
    }
    const clamped = Math.max(0, val);
    return padT + plotH - (clamped / maxVal) * plotH;
  };

  // Group points by algorithm
  const pointsByAlgo = useMemo(() => {
    const map: Record<number, ScalingDataPoint[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    for (const p of result.points) {
      if (map[p.algo]) {
        map[p.algo]!.push(p);
      }
    }
    // Sort by N ascending
    for (let a = 0; a < 5; a++) {
      map[a]!.sort((a1, a2) => a1.n - a2.n);
    }
    return map;
  }, [result.points]);

  // Theoretical reference curves normalized to peak
  const theoreticalCurves = useMemo(() => {
    if (!showTheoretical) return null;
    const nPoints = sizes.map((n) => ({
      n,
      n2: (n * (n - 1)) / 2, // Standard quadratic reference
      nlogn: n * Math.log2(Math.max(2, n)), // Standard n log n reference
    }));

    // Find scaling constants to fit nicely on the chart
    const maxN2 = nPoints[nPoints.length - 1]!.n2;
    const maxNLogN = nPoints[nPoints.length - 1]!.nlogn;
    const targetPeak = maxVal * 0.9;

    const scaleN2 = targetPeak / maxN2;
    const scaleNLogN = targetPeak / (maxNLogN * 2);

    const pathN2 = nPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.n)} ${getY(p.n2 * scaleN2)}`)
      .join(' ');
    const pathNLogN = nPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.n)} ${getY(p.nlogn * scaleNLogN)}`)
      .join(' ');

    return { pathN2, pathNLogN };
  }, [showTheoretical, sizes, maxVal, useLogScale]);

  // Y-axis grid ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
    const val = Math.round(maxVal * frac);
    const y = getY(val);
    return { val, y };
  });

  return (
    <div className="sl-scaling-chart-container">
      <svg
        className="sl-scaling-svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img"
        aria-label={`Empirical Algorithm Scaling Chart for ${result.pattern} dataset. Measured operations vs input size N.`}
      >
        {/* Chart Background and Grid */}
        <rect x={padL} y={padT} width={plotW} height={plotH} fill="var(--sl-color-surface-1)" rx="4" />

        {/* Horizontal Gridlines & Y-axis labels */}
        {yTicks.map((tick, idx) => (
          <g key={idx} className="sl-grid-line-group">
            <line
              x1={padL}
              y1={tick.y}
              x2={padL + plotW}
              y2={tick.y}
              stroke="var(--sl-color-border-subtle)"
              strokeDasharray="3 3"
            />
            <text
              x={padL - 10}
              y={tick.y + 4}
              textAnchor="end"
              className="sl-svg-tick-label sl-font-mono"
              fill="var(--sl-color-text-muted)"
              fontSize="11"
            >
              {tick.val.toLocaleString()}
            </text>
          </g>
        ))}

        {/* Vertical Gridlines & X-axis labels */}
        {sizes.map((n) => {
          const x = getX(n);
          return (
            <g key={n} className="sl-grid-line-group">
              <line
                x1={x}
                y1={padT}
                x2={x}
                y2={padT + plotH}
                stroke="var(--sl-color-border-subtle)"
                strokeDasharray="2 4"
                opacity="0.6"
              />
              <text
                x={x}
                y={padT + plotH + 20}
                textAnchor="middle"
                className="sl-svg-tick-label sl-font-mono"
                fill="var(--sl-color-text-secondary)"
                fontSize="11"
              >
                {n}
              </text>
            </g>
          );
        })}

        {/* Axis Labels */}
        <text
          x={padL + plotW / 2}
          y={padT + plotH + 46}
          textAnchor="middle"
          fill="var(--sl-color-text-muted)"
          fontSize="12"
          fontWeight="600"
        >
          INPUT DATASET SIZE (N)
        </text>

        <text
          x={-(padT + plotH / 2)}
          y="20"
          transform="rotate(-90)"
          textAnchor="middle"
          fill="var(--sl-color-text-muted)"
          fontSize="12"
          fontWeight="600"
        >
          MEASURED {metricLabel.toUpperCase()}
        </text>

        {/* Theoretical Asymptotic Curves (Dashed) */}
        {showTheoretical && theoreticalCurves && (
          <g className="sl-theoretical-layer" opacity="0.65">
            <path
              d={theoreticalCurves.pathN2}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <path
              d={theoreticalCurves.pathNLogN}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          </g>
        )}

        {/* Cost Model Predictions Layer (Dotted) */}
        {showEstimates && (
          <g className="sl-estimates-layer" opacity="0.75">
            {[0, 1, 2, 3, 4].map((algo) => {
              const pts = pointsByAlgo[algo]!;
              if (pts.length < 2) return null;
              const pathD = pts
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.n)} ${getY(p.estimate)}`)
                .join(' ');
              return (
                <path
                  key={`est_${algo}`}
                  d={pathD}
                  fill="none"
                  stroke={ALGO_COLORS[algo as AlgorithmId]}
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                />
              );
            })}
          </g>
        )}

        {/* Empirical Measured Curves (Solid) */}
        {[0, 1, 2, 3, 4].map((algo) => {
          const pts = pointsByAlgo[algo]!;
          if (pts.length < 2) return null;
          const pathD = pts
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.n)} ${getY(p[metricKey])}`)
            .join(' ');
          const color = ALGO_COLORS[algo as AlgorithmId];

          return (
            <g key={`series_${algo}`} className="sl-series-group">
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Circular Data Markers */}
              {pts.map((p) => {
                const cx = getX(p.n);
                const cy = getY(p[metricKey]);
                const isHovered = hoveredPoint?.algo === p.algo && hoveredPoint.n === p.n;

                return (
                  <circle
                    key={`${algo}_${p.n}`}
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 4}
                    fill={color}
                    stroke="var(--sl-color-surface-0)"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="sl-chart-point"
                    tabIndex={0}
                    role="button"
                    aria-label={`${ALGORITHM_NAMES[p.algo]}: N=${p.n}, ${metricLabel}=${p[metricKey]}`}
                    onMouseEnter={() => {
                      setHoveredPoint(p);
                      setTooltipPos({ x: cx, y: cy });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onFocus={() => {
                      setHoveredPoint(p);
                      setTooltipPos({ x: cx, y: cy });
                    }}
                    onBlur={() => setHoveredPoint(null)}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Interactive Hover Tooltip */}
      {hoveredPoint && (
        <div
          className="sl-chart-tooltip"
          style={{
            left: `${(tooltipPos.x / svgWidth) * 100}%`,
            top: `${(tooltipPos.y / svgHeight) * 100}%`,
          }}
          role="tooltip"
        >
          <div className="sl-tooltip-header">
            <span
              className="sl-tooltip-dot"
              style={{ backgroundColor: ALGO_COLORS[hoveredPoint.algo] }}
            />
            <span className="sl-tooltip-title">
              {ALGORITHM_NAMES[hoveredPoint.algo]}
            </span>
          </div>
          <div className="sl-tooltip-body sl-font-mono">
            <div>
              <span>Input Size:</span> <strong>N = {hoveredPoint.n}</strong>
            </div>
            <div>
              <span>Measured {metricLabel}:</span>{' '}
              <strong style={{ color: ALGO_COLORS[hoveredPoint.algo] }}>
                {hoveredPoint[metricKey].toLocaleString()}
              </strong>
            </div>
            {showEstimates && (
              <div>
                <span>C Cost Model Est:</span>{' '}
                <strong>{hoveredPoint.estimate.toLocaleString()}</strong>
              </div>
            )}
            <div className="sl-tooltip-sub">
              <span>Dataset Inversions:</span> {hoveredPoint.inversions} (r ={' '}
              {hoveredPoint.inversionRatio.toFixed(2)})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
