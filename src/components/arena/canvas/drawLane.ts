import type { PlaybackFrame } from '../../../engine/types';
import { calculateBarLayout } from './calculateBarLayout';

export function drawLane(
  ctx: CanvasRenderingContext2D,
  frame: PlaybackFrame,
  cssWidth: number,
  cssHeight: number,
  dpr = 1,
  globalMaxVal?: number
): void {
  if (cssWidth <= 0 || cssHeight <= 0) return;

  // Clear canvas
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const { bars, showLabels } = calculateBarLayout(frame, cssWidth, cssHeight, globalMaxVal);

  // 1. Draw range highlight backdrop if present
  const [rLow, rHigh] = frame.range;
  if (rLow >= 0 && rHigh >= rLow && bars[rLow] && bars[rHigh]) {
    const startX = bars[rLow]!.x;
    const endX = bars[rHigh]!.x + bars[rHigh]!.width;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)'; // Subtle indigo tint
    ctx.fillRect(startX - 2, 4, endX - startX + 4, cssHeight - 8);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX - 2, 4, endX - startX + 4, cssHeight - 8);
  }

  // 2. Draw bars
  for (const bar of bars) {
    ctx.fillStyle = bar.fill;
    ctx.fillRect(bar.x, bar.y, bar.width, bar.height);

    // Subtle outline on active items
    if (bar.isHighlighted || bar.isPivot) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bar.x, bar.y, bar.width, bar.height);
    }

    // 3. Draw values if legible
    if (showLabels) {
      ctx.fillStyle = bar.isHighlighted ? '#ffffff' : '#9ca3af';
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'center';
      const textX = bar.x + bar.width / 2;
      const textY = Math.max(12, bar.y - 4);
      ctx.fillText(String(bar.value), textX, textY);
    }
  }

  // 4. Subtle baseline line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, cssHeight - 7.5);
  ctx.lineTo(cssWidth - 4, cssHeight - 7.5);
  ctx.stroke();

  ctx.restore();
}
