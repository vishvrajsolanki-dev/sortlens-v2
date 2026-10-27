import React, { useState, useEffect, useCallback } from 'react';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SectionHeading } from '../ui/SectionHeading';
import { ScalingChart } from './ScalingChart';
import { ScalingDataTable } from './ScalingDataTable';
import { runScalingBenchmark, DEFAULT_SIZES } from './ScalingBenchmark';
import type { BenchmarkPattern, ScalingBenchmarkResult } from './types';
import type { CoreClient, JudgeMetric } from '../../core/adapter/types';
import { JUDGE_COMPARISONS, JUDGE_WRITES, JUDGE_TOTAL } from '../../core/adapter/types';

export interface ScalingLabProps {
  client?: CoreClient | null;
}

export const ScalingLab: React.FC<ScalingLabProps> = ({ client = null }) => {
  const [pattern, setPattern] = useState<BenchmarkPattern>('random');
  const [judgeBy, setJudgeBy] = useState<JudgeMetric>(JUDGE_COMPARISONS);
  const [seed, setSeed] = useState<number>(42);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  // Chart overlay toggles
  const [showTheoretical, setShowTheoretical] = useState<boolean>(true);
  const [showEstimates, setShowEstimates] = useState<boolean>(false);
  const [useLogScale, setUseLogScale] = useState<boolean>(false);

  // Benchmark state
  const [benchmarkResult, setBenchmarkResult] = useState<ScalingBenchmarkResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executeBenchmark = useCallback(
    async (pat: BenchmarkPattern, metric: JudgeMetric, s: number) => {
      if (!client || !client.isReady()) return;
      setIsRunning(true);
      setErrorMsg(null);

      try {
        const res = await runScalingBenchmark(client, {
          pattern: pat,
          judgeBy: metric,
          seed: s,
          sizes: DEFAULT_SIZES,
        });
        setBenchmarkResult(res);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Benchmark execution failed.');
      } finally {
        setIsRunning(false);
      }
    },
    [client]
  );

  // Initial execution when client ready
  useEffect(() => {
    if (client && client.isReady() && !benchmarkResult) {
      executeBenchmark(pattern, judgeBy, seed);
    }
  }, [client]);

  return (
    <div className="sl-scaling-lab-workbench">
      <SectionHeading
        title="Empirical Complexity Scaling Lab — O(n²) vs. O(n log n)"
        badge={<Badge variant="indigo">UNIT 1 SYLLABUS</Badge>}
        description="Run live empirical benchmarks across input sizes N ∈ [10, 100] using the authoritative C99 core. Compare measured operations against asymptotic theoretical curves and closed-form model predictions."
      />

      {/* Benchmark Controls Panel */}
      <Panel title="Benchmark Configuration & Parameters" className="sl-scaling-controls-panel">
        <div className="sl-scaling-controls-grid">
          {/* Dataset Pattern Selection */}
          <div className="sl-scaling-col" style={{ flex: 2 }}>
            <span className="sl-control-label">DATASET PATTERN:</span>
            <div className="sl-pattern-button-group" role="radiogroup" aria-label="Scaling Pattern Selection">
              {(
                [
                  ['random', 'Random (Uniform)'],
                  ['nearly', 'Nearly Sorted (~10% inv)'],
                  ['reverse', 'Monotonically Reversed'],
                  ['sorted', 'Monotonically Sorted'],
                  ['few_unique', 'High Duplicate Density'],
                ] as const
              ).map(([pat, label]) => (
                <button
                  key={pat}
                  type="button"
                  role="radio"
                  aria-checked={pattern === pat}
                  className={`sl-pattern-chip ${pattern === pat ? 'sl-pattern-chip-active' : ''}`}
                  onClick={() => {
                    setPattern(pat as BenchmarkPattern);
                    executeBenchmark(pat as BenchmarkPattern, judgeBy, seed);
                  }}
                  title={label}
                >
                  {pat === 'nearly'
                    ? 'Nearly Sorted'
                    : pat === 'few_unique'
                    ? 'Few Unique'
                    : pat.charAt(0).toUpperCase() + pat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Judging Metric Selection */}
          <div className="sl-scaling-col" style={{ flex: 1.5 }}>
            <span className="sl-control-label">METRIC MEASURED:</span>
            <div className="sl-pattern-button-group" role="radiogroup" aria-label="Metric Selection">
              <button
                type="button"
                role="radio"
                aria-checked={judgeBy === JUDGE_COMPARISONS}
                className={`sl-pattern-chip ${judgeBy === JUDGE_COMPARISONS ? 'sl-pattern-chip-active' : ''}`}
                onClick={() => {
                  setJudgeBy(JUDGE_COMPARISONS);
                  executeBenchmark(pattern, JUDGE_COMPARISONS, seed);
                }}
              >
                Comparisons
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={judgeBy === JUDGE_WRITES}
                className={`sl-pattern-chip ${judgeBy === JUDGE_WRITES ? 'sl-pattern-chip-active' : ''}`}
                onClick={() => {
                  setJudgeBy(JUDGE_WRITES);
                  executeBenchmark(pattern, JUDGE_WRITES, seed);
                }}
              >
                Writes
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={judgeBy === JUDGE_TOTAL}
                className={`sl-pattern-chip ${judgeBy === JUDGE_TOTAL ? 'sl-pattern-chip-active' : ''}`}
                onClick={() => {
                  setJudgeBy(JUDGE_TOTAL);
                  executeBenchmark(pattern, JUDGE_TOTAL, seed);
                }}
              >
                Total Ops
              </button>
            </div>
          </div>

          {/* Seed and Run Action */}
          <div className="sl-scaling-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => executeBenchmark(pattern, judgeBy, seed)}
                disabled={isRunning}
              >
                {isRunning ? '⏳ Running...' : '⚡ Re-run Benchmark'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const newSeed = (seed + 101) % 10000;
                  setSeed(newSeed);
                  executeBenchmark(pattern, judgeBy, newSeed);
                }}
                disabled={isRunning}
                title="Generate with a new deterministic seed"
              >
                🎲 New Seed ({seed})
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {/* Layer Toggles & View Mode Switcher */}
      <div className="sl-scaling-toolbar">
        <div className="sl-scaling-layer-toggles">
          <label className="sl-checkbox-label">
            <input
              type="checkbox"
              checked={showTheoretical}
              onChange={(e) => setShowTheoretical(e.target.checked)}
            />
            <span>Show Theoretical Asymptotics ($O(n^2), O(n \log n)$)</span>
          </label>

          <label className="sl-checkbox-label">
            <input
              type="checkbox"
              checked={showEstimates}
              onChange={(e) => setShowEstimates(e.target.checked)}
            />
            <span>Show C Cost Model Predictions (O_est)</span>
          </label>

          <label className="sl-checkbox-label">
            <input
              type="checkbox"
              checked={useLogScale}
              onChange={(e) => setUseLogScale(e.target.checked)}
            />
            <span>Logarithmic Y Scale</span>
          </label>
        </div>

        <div className="sl-scaling-view-tabs" role="tablist" aria-label="Scaling View Tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'chart'}
            className={`sl-view-tab ${activeTab === 'chart' ? 'sl-view-tab-active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            📈 Empirical Chart
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'table'}
            className={`sl-view-tab ${activeTab === 'table' ? 'sl-view-tab-active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            📋 Data Table
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="sl-alert-banner sl-alert-rose" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Main Visualization Display */}
      {benchmarkResult && (
        <>
          {activeTab === 'chart' ? (
            <ScalingChart
              result={benchmarkResult}
              judgeBy={judgeBy}
              showTheoretical={showTheoretical}
              showEstimates={showEstimates}
              useLogScale={useLogScale}
            />
          ) : (
            <ScalingDataTable result={benchmarkResult} judgeBy={judgeBy} />
          )}

          {/* Benchmark Metadata Card */}
          <div className="sl-benchmark-meta-card">
            <div className="sl-meta-header">
              <span className="sl-text-xs sl-text-muted" style={{ fontWeight: 600 }}>
                BENCHMARK EXPERIMENT METADATA:
              </span>
              <Badge variant="emerald" withDot>
                VERIFIED REPRODUCIBLE RUN
              </Badge>
            </div>
            <div className="sl-meta-grid sl-font-mono sl-text-xs">
              <div>
                <span className="sl-text-muted">SESSION ID:</span> {benchmarkResult.sessionId}
              </div>
              <div>
                <span className="sl-text-muted">SEED:</span> {benchmarkResult.seed}
              </div>
              <div>
                <span className="sl-text-muted">DATASET PATTERN:</span>{' '}
                {benchmarkResult.pattern.toUpperCase()}
              </div>
              <div>
                <span className="sl-text-muted">TESTED SIZES:</span> N ∈ [
                {benchmarkResult.sizes.join(', ')}]
              </div>
              <div>
                <span className="sl-text-muted">TOTAL VALID MEASUREMENTS:</span>{' '}
                {benchmarkResult.validCount} (5 algos × {benchmarkResult.sizes.length} sizes)
              </div>
              <div>
                <span className="sl-text-muted">EXECUTION ENGINE:</span> WebAssembly C99
                Core (Native counts, <code>recordTrace = 0</code>)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
