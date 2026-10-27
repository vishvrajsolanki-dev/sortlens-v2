import React from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getVivaDemoController, VIVA_STAGES } from './VivaDemoController';
import type { VivaDemoState } from './types';

export interface VivaDemoBarProps {
  demoState: VivaDemoState;
}

export const VivaDemoBar: React.FC<VivaDemoBarProps> = ({ demoState }) => {
  if (demoState.status === 'idle') return null;

  const controller = getVivaDemoController();
  const currentStage = VIVA_STAGES[demoState.currentStageIndex];
  if (!currentStage) return null;

  const isPaused = demoState.status === 'paused';
  const isCompleted = demoState.status === 'completed';

  return (
    <aside
      className="sl-viva-floating-bar"
      role="region"
      aria-label="Active Viva Demonstration Navigation Toolbar"
    >
      <div className="sl-viva-bar-left">
        <Badge variant={isCompleted ? 'emerald' : isPaused ? 'amber' : 'indigo'} withDot>
          {isCompleted ? 'DEMO COMPLETED' : isPaused ? 'PAUSED' : 'VIVA TOUR ACTIVE'}
        </Badge>
        <div className="sl-viva-bar-title-group">
          <span className="sl-viva-stage-num sl-font-mono">
            STAGE {currentStage.stageNumber} OF {demoState.totalStages}:
          </span>
          <span className="sl-viva-stage-title">{currentStage.title}</span>
        </div>
      </div>

      <div className="sl-viva-bar-center">
        {!isCompleted && (
          <span className="sl-viva-timer-chip sl-font-mono">
            ⏳ {demoState.secondsRemaining}s
          </span>
        )}
        <span className="sl-viva-syllabus-chip sl-text-xs sl-text-muted">
          {currentStage.syllabusUnit}
        </span>
      </div>

      <div className="sl-viva-bar-actions">
        {!isCompleted && (
          <Button
            variant={isPaused ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => (isPaused ? controller.resume() : controller.pause())}
            aria-label={isPaused ? 'Resume viva demonstration' : 'Pause viva demonstration'}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => controller.prevStage()}
          disabled={demoState.currentStageIndex === 0}
          aria-label="Go to previous viva stage"
        >
          ⏮ Prev
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => controller.nextStage()}
          disabled={isCompleted}
          aria-label="Advance to next viva stage"
        >
          ⏭ Next
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => controller.stop()}
          aria-label="Exit viva demonstration"
        >
          ✕ Exit Demo
        </Button>
      </div>
    </aside>
  );
};
