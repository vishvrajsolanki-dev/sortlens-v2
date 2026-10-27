import React, { useEffect, useRef, useState } from 'react';
import type { AlgorithmId } from '../../core/adapter/types';
import {
  ALGORITHM_NAMES,
  ALGO_QUICK,
  ALGO_MERGE,
  EV_COMPARE,
  EV_SWAP,
  EV_WRITE,
  EV_PIVOT,
  EV_RANGE,
  EV_PUSH,
  EV_POP,
  EV_DONE,
} from '../../core/adapter/types';
import type { PlaybackFrame } from '../../engine/types';
import { Badge } from '../ui/Badge';
import { drawLane } from './canvas/drawLane';

export interface CanvasLaneProps {
  algo: AlgorithmId;
  frame: PlaybackFrame;
  isDone: boolean;
  globalMaxVal?: number;
  className?: string;
}

const ALGO_COLORS: Record<AlgorithmId, string> = {
  0: '#f43f5e', // Bubble: Rose
  1: '#0ea5e9', // Selection: Sky
  2: '#10b981', // Insertion: Emerald
  3: '#8b5cf6', // Quick: Violet
  4: '#f59e0b', // Merge: Amber
};

function formatOperation(frame: PlaybackFrame, isDone: boolean): string {
  if (frame.overflow) return 'stack overflow';
  if (isDone) return 'sorted';
  if (frame.stepIndex === 0) return 'ready';
  const ev = frame.latestEvent;
  if (!ev) return 'active';
  switch (ev.type) {
    case EV_COMPARE:
      return `cmp [${ev.a}] < [${ev.b}]`;
    case EV_SWAP:
      return `swap [${ev.a}] ↔ [${ev.b}]`;
    case EV_WRITE:
      return `write [${ev.a}] = ${ev.b}`;
    case EV_PIVOT:
      return `pivot [${ev.a}]`;
    case EV_RANGE:
      return `range [${ev.a}..${ev.b}]`;
    case EV_PUSH:
      return `call [${ev.a}..${ev.b}]`;
    case EV_POP:
      return `return [${ev.a}..${ev.b}]`;
    case EV_DONE:
      return 'sorted';
    default:
      return 'running';
  }
}

export const CanvasLane: React.FC<CanvasLaneProps> = ({
  algo,
  frame,
  isDone,
  globalMaxVal,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 190,
  });

  // Observe container resizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (typeof ResizeObserver === 'undefined') {
      const w = container.clientWidth || 240;
      const h = container.clientHeight || 190;
      setDimensions({ width: w, height: h });
      return;
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Redraw canvas whenever frame, dimensions, or maxVal changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width <= 0 || dimensions.height <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;

    drawLane(ctx, frame, dimensions.width, dimensions.height, dpr, globalMaxVal);
  }, [frame, dimensions, globalMaxVal]);

  const showStackDepth = algo === ALGO_QUICK || algo === ALGO_MERGE;

  let statusBadgeVariant: 'neutral' | 'amber' | 'cyan' | 'emerald' | 'rose' | 'indigo' | 'violet' = 'neutral';
  let statusBadgeText = 'READY';

  if (frame.overflow) {
    statusBadgeVariant = 'rose';
    statusBadgeText = 'OVERFLOW';
  } else if (isDone) {
    statusBadgeVariant = 'emerald';
    statusBadgeText = 'COMPLETED';
  } else if (frame.stepIndex > 0) {
    statusBadgeVariant = 'violet';
    statusBadgeText = `STEP ${frame.stepIndex}`;
  }

  const opText = formatOperation(frame, isDone);
  const laneProgress = frame.totalSteps > 0 ? Math.min(1, frame.stepIndex / frame.totalSteps) : isDone ? 1 : 0;
  const algoColor = ALGO_COLORS[algo] || 'var(--sl-color-primary)';

  return (
    <div className={`sl-lane-col-card ${className}`}>
      {/* Lane Header */}
      <div className="sl-lane-col-header">
        <div className="sl-lane-col-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`sl-algo-num-badge sl-algo-num-${algo + 1}`}>{algo + 1}</span>
            <span className="sl-lane-name">{ALGORITHM_NAMES[algo]}</span>
          </div>
          <Badge variant={statusBadgeVariant} withDot={isDone || frame.stepIndex > 0}>
            {statusBadgeText}
          </Badge>
        </div>

        {/* Telemetry Pills */}
        <div className="sl-lane-telemetry-grid">
          <div className="sl-col-metric" title="Comparisons count">
            <span className="sl-col-metric-label">Comps</span>
            <span className="sl-col-metric-val">{frame.comparisons.toLocaleString()}</span>
          </div>

          <div className="sl-col-metric" title="Array writes / swaps count">
            <span className="sl-col-metric-label">Writes</span>
            <span className="sl-col-metric-val sl-text-rose">{frame.writes.toLocaleString()}</span>
          </div>

          {showStackDepth && (
            <div
              className="sl-col-metric"
              style={{ gridColumn: 'span 2' }}
              title="Recursion call stack depth"
            >
              <span className="sl-col-metric-label">Stack Depth</span>
              <span className="sl-col-metric-val sl-text-indigo">{frame.stackDepth}</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div ref={containerRef} className="sl-lane-canvas-col-wrap">
        <canvas
          ref={canvasRef}
          className="sl-lane-canvas"
          style={{ width: '100%', height: '100%' }}
          role="img"
          aria-label={`${ALGORITHM_NAMES[algo]} visual array representation (${frame.array.length} bars)`}
        />
      </div>

      {/* Card Footer: Live Operation & Progress */}
      <div className="sl-lane-col-footer">
        <div className="sl-lane-op-label" title={opText}>
          <span style={{ color: 'var(--sl-color-text-dim)', marginRight: '4px' }}>op:</span>
          {opText}
        </div>
        <div className="sl-lane-col-progress-track">
          <div
            className="sl-lane-col-progress-bar"
            style={{
              width: `${Math.round(laneProgress * 100)}%`,
              backgroundColor: isDone ? 'var(--sl-color-accent-emerald)' : algoColor,
            }}
          />
        </div>
      </div>

      {/* Screen reader accessible summary */}
      <div className="sl-sr-only" aria-live="polite">
        {ALGORITHM_NAMES[algo]}: {isDone ? 'Completed.' : `Step ${frame.stepIndex}.`} Comparisons: {frame.comparisons}, Writes: {frame.writes}.
      </div>
    </div>
  );
};
