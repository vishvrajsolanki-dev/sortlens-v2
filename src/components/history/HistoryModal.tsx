import React, { useState, useEffect, useRef } from 'react';
import { IconButton } from '../ui/IconButton';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  loadHistory,
  clearHistory,
  exportHistoryJson,
  MAX_HISTORY_RECORDS,
  type CompletedRunRecord,
} from '../../state/persistence';
import {
  ALGORITHM_NAMES,
  JUDGE_COMPARISONS,
  JUDGE_WRITES,
} from '../../core/adapter/types';

export interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [records, setRecords] = useState<CompletedRunRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const refreshHistory = () => {
    setRecords(loadHistory());
  };

  useEffect(() => {
    if (isOpen) {
      refreshHistory();
      setConfirmClear(false);
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearHistory();
    setConfirmClear(false);
    refreshHistory();
  };

  const handleExport = () => {
    const jsonStr = exportHistoryJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sortlens-telemetry-history-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (ts: number): string => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return String(ts);
    }
  };

  const getMetricName = (metric: number): string => {
    if (metric === JUDGE_COMPARISONS) return 'Comparisons';
    if (metric === JUDGE_WRITES) return 'Writes';
    return 'Total Ops';
  };

  return (
    <div
      className="sl-modal-backdrop"
      onClick={onClose}
      data-testid="history-modal-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-dialog-title"
        className="sl-modal-container sl-modal-container-lg"
        onClick={(e) => e.stopPropagation()}
        data-testid="history-modal-container"
      >
        <div className="sl-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 id="history-dialog-title" className="sl-modal-title">
              <span>📜</span> Race Telemetry History
            </h2>
            <Badge variant="cyan">
              {records.length} / {MAX_HISTORY_RECORDS} Runs
            </Badge>
          </div>
          <IconButton
            ref={closeButtonRef}
            ariaLabel="Close telemetry history dialog"
            onClick={onClose}
            size="sm"
          >
            ✕
          </IconButton>
        </div>

        <div className="sl-modal-body">
          {records.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--sl-color-text-muted)',
                background: 'var(--sl-color-surface-2)',
                borderRadius: '8px',
                border: '1px dashed var(--sl-color-border-base)',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏁</div>
              <p className="sl-text-sm" style={{ fontWeight: 600, color: 'var(--sl-color-text-primary)' }}>
                No Completed Runs Logged
              </p>
              <p className="sl-text-xs" style={{ marginTop: '4px' }}>
                Complete a verified 5-algorithm race in the Race Arena to automatically record empirical telemetry.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span className="sl-text-xs sl-text-muted">
                  Stored locally in browser storage (bounded to {MAX_HISTORY_RECORDS} latest runs).
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" size="sm" onClick={handleExport}>
                    📥 Export JSON
                  </Button>
                  <Button
                    variant={confirmClear ? 'danger' : 'ghost'}
                    size="sm"
                    onClick={handleClear}
                  >
                    {confirmClear ? '⚠️ Confirm Clear All' : '🗑️ Clear History'}
                  </Button>
                </div>
              </div>

              {/* Records List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {records.map((rec) => {
                  const isExpanded = expandedId === rec.id;
                  const winnerName = ALGORITHM_NAMES[rec.winnerAlgo] || 'Unknown';
                  const metricStr = getMetricName(rec.judgeBy);

                  return (
                    <div
                      key={rec.id}
                      style={{
                        background: 'var(--sl-color-surface-2)',
                        border: '1px solid var(--sl-color-border-base)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                      data-testid={`history-item-${rec.id}`}
                    >
                      <div
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          gap: '12px',
                        }}
                        onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpandedId(isExpanded ? null : rec.id);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span className="sl-font-mono sl-text-xs sl-text-muted">
                            {formatTimestamp(rec.timestamp)}
                          </span>
                          <Badge variant="neutral">
                            N={rec.arraySize} • {rec.pattern}
                          </Badge>
                          <Badge variant="cyan">{metricStr}</Badge>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span className="sl-text-xs" style={{ fontWeight: 600, color: 'var(--sl-color-accent-emerald)' }}>
                              🏆 {winnerName}
                            </span>
                            <span className="sl-text-xs sl-font-mono sl-text-muted" style={{ marginLeft: '6px' }}>
                              ({rec.winnerCost})
                            </span>
                          </div>

                          {rec.predictionCorrect !== null && (
                            <Badge variant={rec.predictionCorrect ? 'emerald' : 'amber'}>
                              {rec.predictionCorrect ? 'PREDICTION HIT' : 'SURPRISED'}
                            </Badge>
                          )}

                          <span className="sl-text-xs sl-text-muted" aria-hidden="true">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Lane Breakdown */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: '12px 14px',
                            background: 'var(--sl-color-surface-3)',
                            borderTop: '1px solid var(--sl-color-border-subtle)',
                          }}
                        >
                          <table
                            style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '12px',
                            }}
                          >
                            <thead>
                              <tr style={{ color: 'var(--sl-color-text-muted)', textAlign: 'left', borderBottom: '1px solid var(--sl-color-border-subtle)' }}>
                                <th style={{ padding: '4px 8px' }}>Rank</th>
                                <th style={{ padding: '4px 8px' }}>Algorithm</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Comparisons</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Writes</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total Ops</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Max Depth</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rec.lanes.map((lane) => (
                                <tr
                                  key={lane.algo}
                                  style={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                                    fontWeight: lane.rank === 1 ? 600 : 400,
                                    color: lane.rank === 1 ? 'var(--sl-color-accent-emerald)' : 'var(--sl-color-text-primary)',
                                  }}
                                >
                                  <td style={{ padding: '6px 8px' }}>
                                    {lane.tie ? `T-${lane.rank}` : `#${lane.rank}`}
                                  </td>
                                  <td style={{ padding: '6px 8px' }}>
                                    {ALGORITHM_NAMES[lane.algo]}
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--sl-font-mono)' }}>
                                    {lane.comparisons.toLocaleString()}
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--sl-font-mono)' }}>
                                    {lane.writes.toLocaleString()}
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--sl-font-mono)' }}>
                                    {lane.totalOps.toLocaleString()}
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--sl-font-mono)' }}>
                                    {lane.maxDepth}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="sl-modal-footer">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
