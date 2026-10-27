import React, { useState } from 'react';
import type {
  AlgorithmId,
  CoreClient,
  ShapeAnalysisResult,
  SortRunResult,
} from '../../core/adapter/types';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
  ALGORITHM_NAMES,
} from '../../core/adapter/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const DEFAULT_ARRAY = [10, 3, 18, 5, 12, 1, 15, 7, 20, 2];

interface CoreDiagnosticPanelProps {
  client: CoreClient | null;
}

export const CoreDiagnosticPanel: React.FC<CoreDiagnosticPanelProps> = ({ client }) => {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmId>(ALGO_BUBBLE);
  const [inputArrayStr, setInputArrayStr] = useState<string>(DEFAULT_ARRAY.join(', '));
  const [analysisResult, setAnalysisResult] = useState<ShapeAnalysisResult | null>(null);
  const [sortResult, setSortResult] = useState<SortRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const parseInputArray = (): number[] => {
    const raw = inputArrayStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => Number(s));

    if (raw.some((n) => Number.isNaN(n) || !Number.isInteger(n))) {
      throw new Error('All array items must be valid integers.');
    }
    if (raw.length < 2 || raw.length > 100) {
      throw new Error(`Array size (${raw.length}) must be between 2 and 100.`);
    }
    return raw;
  };

  const handleRunAnalysis = () => {
    if (!client) return;
    try {
      setIsProcessing(true);
      const arr = parseInputArray();
      const res = client.analyze(arr);
      setAnalysisResult(res);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunSort = () => {
    if (!client) return;
    try {
      setIsProcessing(true);
      const arr = parseInputArray();
      client.setInputArray(arr);
      const res = client.runSort(selectedAlgo, arr.length, true);
      setSortResult(res);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="sl-panel sl-panel-elevated"
      style={{ marginTop: '24px' }}
      role="region"
      aria-label="WebAssembly Engine Diagnostic Console"
    >
      <div
        className="sl-panel-header"
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          padding: '12px 16px',
        }}
        onClick={() => setIsExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
      >
        <div className="sl-panel-title-area" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--sl-color-primary-hover)', fontSize: '12px' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="sl-panel-title">WebAssembly Engine Diagnostic Console</span>
          <Badge variant="violet">WASM ADAPTER</Badge>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          aria-label={isExpanded ? 'Collapse Diagnostic Console' : 'Expand Diagnostic Console'}
        >
          {isExpanded ? '▼ Collapse Console' : '▶ Expand Console'}
        </Button>
      </div>

      <div
        className="sl-panel-body"
        style={
          isExpanded
            ? { display: 'block', padding: '16px' }
            : { maxHeight: 0, padding: 0, overflow: 'hidden', opacity: 0 }
        }
      >
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
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="diagnostic-input-array"
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--sl-color-text-muted)',
            marginBottom: '6px',
            fontFamily: 'var(--sl-font-mono)',
          }}
        >
          CUSTOM ARRAY INPUT (2 to 100 integers, comma-separated):
        </label>
        <input
          id="diagnostic-input-array"
          type="text"
          value={inputArrayStr}
          onChange={(e) => setInputArrayStr(e.target.value)}
          disabled={!client || isProcessing}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--sl-color-surface-elevated)',
            border: '1px solid var(--sl-color-border-base)',
            color: 'var(--sl-color-text-primary)',
            borderRadius: '6px',
            fontFamily: 'var(--sl-font-mono)',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label
            htmlFor="diagnostic-algo-select"
            style={{
              display: 'block',
              fontSize: '12px',
              color: 'var(--sl-color-text-muted)',
              marginBottom: '6px',
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            TARGET ALGORITHM:
          </label>
          <select
            id="diagnostic-algo-select"
            value={selectedAlgo}
            onChange={(e) => setSelectedAlgo(Number(e.target.value) as AlgorithmId)}
            disabled={!client || isProcessing}
            style={{
              padding: '8px 12px',
              background: 'var(--sl-color-surface-elevated)',
              border: '1px solid var(--sl-color-border-base)',
              color: 'var(--sl-color-text-primary)',
              borderRadius: '6px',
              fontFamily: 'var(--sl-font-mono)',
              fontSize: '13px',
            }}
          >
            <option value={ALGO_BUBBLE}>{ALGORITHM_NAMES[ALGO_BUBBLE]}</option>
            <option value={ALGO_SELECTION}>{ALGORITHM_NAMES[ALGO_SELECTION]}</option>
            <option value={ALGO_INSERTION}>{ALGORITHM_NAMES[ALGO_INSERTION]}</option>
            <option value={ALGO_QUICK}>{ALGORITHM_NAMES[ALGO_QUICK]}</option>
            <option value={ALGO_MERGE}>{ALGORITHM_NAMES[ALGO_MERGE]}</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleRunAnalysis}
            disabled={!client || isProcessing}
          >
            Run Shape Analysis
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleRunSort}
            disabled={!client || isProcessing}
          >
            Execute Sort in WASM
          </Button>
        </div>
      </div>

      {analysisResult && (
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--sl-color-border-subtle)', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--sl-color-text-primary)', marginBottom: '12px' }}>
            Live Shape Analysis Telemetry
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--sl-color-surface-elevated)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--sl-color-text-muted)' }}>INVERSIONS</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-color-accent-cyan)', fontWeight: 600 }}>
                {analysisResult.inversions}
              </div>
            </div>
            <div style={{ padding: '10px', background: 'var(--sl-color-surface-elevated)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--sl-color-text-muted)' }}>DUPLICATE RATIO</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-color-accent-amber)', fontWeight: 600 }}>
                {(analysisResult.duplicateRatio * 100).toFixed(1)}% ({analysisResult.distinct} unique)
              </div>
            </div>
            <div style={{ padding: '10px', background: 'var(--sl-color-surface-elevated)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--sl-color-text-muted)' }}>MAX LEFT GREATER</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-color-text-primary)', fontWeight: 600 }}>
                {analysisResult.maxLeftGreater}
              </div>
            </div>
            <div style={{ padding: '10px', background: 'var(--sl-color-surface-elevated)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--sl-color-text-muted)' }}>PREDICTED WINNER</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-color-accent-emerald)', fontWeight: 600 }}>
                {ALGORITHM_NAMES[analysisResult.predictedAlgo]}
              </div>
            </div>
          </div>
          <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--sl-color-text-secondary)' }}>
            <strong>Model Rationale:</strong> {analysisResult.reason}
          </p>
        </div>
      )}

      {sortResult && (
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--sl-color-border-subtle)', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--sl-color-text-primary)', marginBottom: '12px' }}>
            WASM Execution Output: {ALGORITHM_NAMES[sortResult.algo]}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--sl-color-surface-elevated)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--sl-color-text-muted)' }}>COMPARISONS</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-color-accent-cyan)', fontWeight: 600 }}>
                {sortResult.comparisons}
              </div>
            </div>
            <div style={{ padding: '10px', background: 'var(--sl-color-surface-elevated)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--sl-color-text-muted)' }}>ARRAY WRITES</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-color-accent-rose)', fontWeight: 600 }}>
                {sortResult.writes}
              </div>
            </div>
            <div style={{ padding: '10px', background: 'var(--sl-color-surface-elevated)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--sl-color-text-muted)' }}>LOGGED EVENTS</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-color-text-primary)', fontWeight: 600 }}>
                {sortResult.eventCount} {sortResult.overflow ? '(OVERFLOW)' : ''}
              </div>
            </div>
            <div style={{ padding: '10px', background: 'var(--sl-color-surface-elevated)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--sl-color-text-muted)' }}>MAX STACK DEPTH</div>
              <div style={{ fontSize: '15px', fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-color-accent-indigo)', fontWeight: 600 }}>
                {sortResult.maxDepth}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--sl-color-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
              VERIFIED SORTED RESULT:
            </div>
            <div
              style={{
                fontFamily: 'var(--sl-font-mono)',
                fontSize: '13px',
                padding: '8px 12px',
                background: 'var(--sl-color-surface-elevated)',
                borderRadius: '6px',
                marginTop: '4px',
                color: 'var(--sl-color-accent-emerald)',
                wordBreak: 'break-all',
              }}
            >
              [{sortResult.sortedArray.join(', ')}]
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
