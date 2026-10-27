import React from 'react';
import type { HashTableData } from '../../core/adapter/types';

export interface HashTableVisualizationProps {
  data: HashTableData | null;
}

export const HashTableVisualization: React.FC<HashTableVisualizationProps> = ({ data }) => {
  if (!data || data.size === 0) {
    return (
      <div className="sl-text-xs sl-text-muted">
        Hash table inspection data unavailable.
      </div>
    );
  }

  const { distinctCount, collisionCount, buckets } = data;

  return (
    <div className="sl-hashtable-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="sl-text-xs sl-text-muted" style={{ fontWeight: 600 }}>
          SEPARATE-CHAINING HASH TABLE (11 BUCKETS, h(k) = k mod 11)
        </span>
        <span className="sl-text-xs sl-font-mono sl-text-secondary">
          Distinct: {distinctCount} | Collisions: {collisionCount}
        </span>
      </div>

      <div
        className="sl-hashtable-grid"
        role="region"
        aria-label="11-bucket separate chaining hash table visualization"
      >
        {buckets.map((chain, bIdx) => {
          const hasChain = chain.length > 0;
          const hasCollision = chain.length > 1;

          return (
            <div
              key={bIdx}
              className={`sl-hash-bucket ${hasChain ? 'sl-hash-bucket-has-chain' : ''} ${
                hasCollision ? 'sl-hash-bucket-collision' : ''
              }`}
              title={`Bucket [${bIdx}]: ${chain.length} element(s)${
                hasCollision ? ' (Collision)' : ''
              }`}
            >
              <div className="sl-bucket-index sl-font-mono">[{bIdx}]</div>
              <div className="sl-bucket-count sl-font-mono">
                {chain.length}
              </div>
              {hasChain && (
                <div className="sl-bucket-values">
                  {chain.slice(0, 4).map((val, kIdx) => (
                    <span key={kIdx} className="sl-bucket-val-chip sl-font-mono">
                      {val}
                    </span>
                  ))}
                  {chain.length > 4 && (
                    <span className="sl-bucket-val-chip sl-font-mono">
                      +{chain.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="sl-text-xs sl-text-muted" style={{ marginTop: '8px' }}>
        Used in Course Practical 10 to measure duplicate ratio d = (N - distinct) / (N - 1) and detect non-uniform clustering prior to execution.
      </p>
    </div>
  );
};
