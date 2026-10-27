import React from 'react';
import { useAppStore } from '../../state/appStore';
import { Badge } from '../ui/Badge';

export const EngineStatusBadge: React.FC = () => {
  const status = useAppStore((s) => s.runtimeStatus);
  const error = useAppStore((s) => s.runtimeError);

  let variant: 'neutral' | 'amber' | 'cyan' | 'emerald' | 'rose' = 'neutral';
  let label = 'CORE IDLE';

  switch (status) {
    case 'initializing':
      variant = 'amber';
      label = 'CORE INITIALIZING';
      break;
    case 'ready':
      variant = 'emerald';
      label = 'CORE READY (C99 / WASM)';
      break;
    case 'error':
      variant = 'rose';
      label = 'RUNTIME ERROR';
      break;
    default:
      variant = 'neutral';
      label = 'CORE UNINITIALIZED';
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sl-engine-status-wrap"
      title={error ? `Error: ${error}` : `Runtime status: ${label}`}
    >
      <Badge variant={variant} withDot>
        {label}
      </Badge>
    </div>
  );
};
