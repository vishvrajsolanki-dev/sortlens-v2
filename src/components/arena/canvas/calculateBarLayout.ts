import type { PlaybackFrame } from '../../../engine/types';
import type { BarLayoutItem, LaneLayoutResult } from './types';

export const COLOR_DEFAULT = '#374151'; // Slate gray
export const COLOR_RANGE = '#4338ca'; // Subtle indigo
export const COLOR_COMPARE = '#f59e0b'; // Amber
export const COLOR_WRITE = '#f43f5e'; // Rose
export const COLOR_PIVOT = '#8b5cf6'; // Violet (strictly distinct from Amber prediction signal)
export const COLOR_DONE = '#10b981'; // Emerald

export function calculateBarLayout(
  frame: PlaybackFrame,
  canvasWidth: number,
  canvasHeight: number,
  globalMaxVal?: number
): LaneLayoutResult {
  const n = frame.array.length;
  if (n === 0 || canvasWidth <= 0 || canvasHeight <= 0) {
    return { bars: [], maxVal: 1, showLabels: false };
  }

  // Determine vertical scale
  const localMax = frame.array.reduce((acc, v) => (v > acc ? v : acc), 1);
  const maxVal = Math.max(1, globalMaxVal !== undefined && globalMaxVal > 0 ? globalMaxVal : localMax);

  // Layout metrics
  const paddingX = 4;
  const paddingY = 8;
  const availableWidth = Math.max(10, canvasWidth - paddingX * 2);
  const availableHeight = Math.max(10, canvasHeight - paddingY * 2);

  // Compute gap and bar width
  const gap = n > 50 ? 1 : n > 25 ? 2 : 3;
  const totalGaps = gap * (n - 1);
  const barWidth = Math.max(1, (availableWidth - totalGaps) / n);
  const showLabels = n <= 25 && barWidth >= 16 && availableHeight >= 40;

  const activeSet = new Set(frame.activeIndices);
  const [rangeLow, rangeHigh] = frame.range;
  const hasRange = rangeLow >= 0 && rangeHigh >= rangeLow;

  const bars: BarLayoutItem[] = [];

  for (let i = 0; i < n; i++) {
    const val = frame.array[i] ?? 0;
    const barHeight = Math.max(2, Math.round((val / maxVal) * (availableHeight - (showLabels ? 16 : 0))));
    const x = paddingX + i * (barWidth + gap);
    const y = canvasHeight - paddingY - barHeight;

    const isHighlighted = activeSet.has(i);
    const isPivot = i === frame.pivotIndex;
    const isInRange = hasRange && i >= rangeLow && i <= rangeHigh;

    let fill = COLOR_DEFAULT;

    if (frame.isComplete) {
      fill = COLOR_DONE;
    } else if (isPivot) {
      fill = COLOR_PIVOT;
    } else if (isHighlighted) {
      fill = frame.highlightType === 'compare' ? COLOR_COMPARE : COLOR_WRITE;
    } else if (isInRange) {
      fill = COLOR_RANGE;
    }

    bars.push({
      index: i,
      value: val,
      x,
      y,
      width: barWidth,
      height: barHeight,
      fill,
      isHighlighted,
      isPivot,
      isInRange,
    });
  }

  return { bars, maxVal, showLabels };
}
