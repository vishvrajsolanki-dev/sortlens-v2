import React from 'react';
import type { PlaybackStatus } from '../../engine/types';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';

export interface RaceToolbarProps {
  status: PlaybackStatus;
  currentStep: number;
  maxSteps: number;
  progress: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onRestart: () => void;
  onSeek: (step: number) => void;
  onSpeedChange: (speed: number) => void;
}

const SPEED_OPTIONS = [1, 5, 20, 60, 120, 300, 600, 1000];

export const RaceToolbar: React.FC<RaceToolbarProps> = ({
  status,
  currentStep,
  maxSteps,
  progress,
  speed,
  onPlay,
  onPause,
  onStepBackward,
  onStepForward,
  onRestart,
  onSeek,
  onSpeedChange,
}) => {
  const isPlaying = status === 'playing';
  const isCompleted = status === 'completed';

  let statusBadgeVariant: 'neutral' | 'amber' | 'cyan' | 'emerald' | 'rose' = 'neutral';
  if (isPlaying) statusBadgeVariant = 'cyan';
  else if (isCompleted) statusBadgeVariant = 'emerald';
  else if (status === 'paused') statusBadgeVariant = 'amber';

  return (
    <div className="sl-race-toolbar" role="region" aria-label="Playback Controls">
      {/* Primary Action Buttons */}
      <div className="sl-toolbar-actions">
        <IconButton
          ariaLabel="Restart playback to step 0"
          onClick={onRestart}
          size="md"
          title="Restart (Step 0)"
        >
          ⏮
        </IconButton>

        <IconButton
          ariaLabel="Step backward one event"
          onClick={onStepBackward}
          disabled={currentStep <= 0 || isPlaying}
          size="md"
          title="Step Backward"
        >
          ⏪
        </IconButton>

        {isPlaying ? (
          <Button
            variant="secondary"
            onClick={onPause}
            className="sl-toolbar-play-btn"
            aria-label="Pause Race"
          >
            ⏸ Pause
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onPlay}
            className="sl-toolbar-play-btn"
            aria-label="Play Race"
          >
            ▶ {isCompleted ? 'Replay' : 'Play'}
          </Button>
        )}

        <IconButton
          ariaLabel="Step forward one event"
          onClick={onStepForward}
          disabled={currentStep >= maxSteps || isPlaying}
          size="md"
          title="Step Forward"
        >
          ⏩
        </IconButton>

        <Badge variant={statusBadgeVariant} withDot>
          {status.toUpperCase()}
        </Badge>
      </div>

      {/* Shared Timeline Scrubber */}
      <div className="sl-toolbar-scrubber-wrap">
        <div className="sl-scrubber-meta">
          <span className="sl-scrubber-label">TIMELINE</span>
          <span className="sl-scrubber-step sl-font-mono">
            Step {currentStep.toLocaleString()} / {maxSteps.toLocaleString()} ({Math.round(progress * 100)}%)
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(1, maxSteps)}
          value={currentStep}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="sl-timeline-slider"
          aria-label="Shared race timeline position"
        />
      </div>

      {/* Speed Controls */}
      <div className="sl-toolbar-speed-wrap">
        <label htmlFor="speed-select" className="sl-speed-label">
          SPEED:
        </label>
        <select
          id="speed-select"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="sl-speed-select sl-font-mono"
          aria-label="Playback simulation speed"
        >
          {SPEED_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s} ev/s
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
