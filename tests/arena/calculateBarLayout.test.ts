import { describe, it, expect } from 'vitest';
import {
  calculateBarLayout,
  COLOR_DEFAULT,
  COLOR_COMPARE,
  COLOR_WRITE,
  COLOR_PIVOT,
  COLOR_DONE,
  COLOR_RANGE,
} from '../../src/components/arena/canvas/calculateBarLayout';
import type { PlaybackFrame } from '../../src/engine/types';

function createMockFrame(overrides: Partial<PlaybackFrame> = {}): PlaybackFrame {
  return {
    stepIndex: 0,
    totalSteps: 10,
    array: [10, 20, 30],
    comparisons: 0,
    writes: 0,
    stackDepth: 0,
    activeIndices: [],
    highlightType: 'none',
    pivotIndex: -1,
    range: [-1, -1],
    latestEvent: null,
    isComplete: false,
    overflow: false,
    ...overrides,
  };
}

describe('calculateBarLayout — Pure Geometry & Layout Engine', () => {
  it('returns empty bars when array is empty or dimensions are invalid', () => {
    const frame = createMockFrame({ array: [] });
    const layout = calculateBarLayout(frame, 800, 200);
    expect(layout.bars).toHaveLength(0);
    expect(layout.showLabels).toBe(false);

    const layoutZeroWidth = calculateBarLayout(createMockFrame(), 0, 200);
    expect(layoutZeroWidth.bars).toHaveLength(0);
  });

  it('handles minimum application array size N=2 without overlap', () => {
    const frame = createMockFrame({ array: [10, 50] });
    const width = 600;
    const height = 150;
    const layout = calculateBarLayout(frame, width, height, 50);

    expect(layout.bars).toHaveLength(2);
    expect(layout.bars[0].width).toBeGreaterThan(0);

    const [b0, b1] = layout.bars;
    expect(b0.x + b0.width).toBeLessThanOrEqual(b1.x);
    expect(b1.x + b1.width).toBeLessThanOrEqual(width);
    expect(b1.height).toBeGreaterThan(b0.height);
  });

  it('handles maximum application array size N=100 without negative width or bar overlap', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i + 1);
    const frame = createMockFrame({ array: arr });
    const width = 1000;
    const height = 180;
    const layout = calculateBarLayout(frame, width, height, 100);

    expect(layout.bars).toHaveLength(100);
    expect(layout.bars[0].width).toBeGreaterThan(0);

    for (let i = 0; i < layout.bars.length - 1; i++) {
      const cur = layout.bars[i];
      const next = layout.bars[i + 1];
      expect(cur.x + cur.width).toBeLessThanOrEqual(next.x);
    }

    const last = layout.bars[99];
    expect(last.x + last.width).toBeLessThanOrEqual(width);
  });

  it('accurately maps semantic highlight colors to bars', () => {
    // Compare highlight
    const compareFrame = createMockFrame({
      array: [10, 20, 30],
      activeIndices: [0, 1],
      highlightType: 'compare',
    });
    const compareLayout = calculateBarLayout(compareFrame, 500, 150);
    expect(compareLayout.bars[0].fill).toBe(COLOR_COMPARE);
    expect(compareLayout.bars[1].fill).toBe(COLOR_COMPARE);
    expect(compareLayout.bars[2].fill).toBe(COLOR_DEFAULT);

    // Swap / Write highlight
    const writeFrame = createMockFrame({
      array: [10, 20, 30],
      activeIndices: [1],
      highlightType: 'write',
    });
    const writeLayout = calculateBarLayout(writeFrame, 500, 150);
    expect(writeLayout.bars[1].fill).toBe(COLOR_WRITE);

    // Pivot highlight
    const pivotFrame = createMockFrame({
      array: [10, 20, 30],
      pivotIndex: 2,
    });
    const pivotLayout = calculateBarLayout(pivotFrame, 500, 150);
    expect(pivotLayout.bars[2].fill).toBe(COLOR_PIVOT);

    // Done highlight
    const doneFrame = createMockFrame({
      array: [10, 20, 30],
      isComplete: true,
    });
    const doneLayout = calculateBarLayout(doneFrame, 500, 150);
    expect(doneLayout.bars.every((b) => b.fill === COLOR_DONE)).toBe(true);

    // Range highlight
    const rangeFrame = createMockFrame({
      array: [10, 20, 30, 40, 50],
      range: [1, 3],
    });
    const rangeLayout = calculateBarLayout(rangeFrame, 500, 150);
    expect(rangeLayout.bars[0].fill).toBe(COLOR_DEFAULT);
    expect(rangeLayout.bars[1].fill).toBe(COLOR_RANGE);
    expect(rangeLayout.bars[2].fill).toBe(COLOR_RANGE);
    expect(rangeLayout.bars[3].fill).toBe(COLOR_RANGE);
    expect(rangeLayout.bars[4].fill).toBe(COLOR_DEFAULT);
  });

  it('defaults to slate color when bar has no highlight', () => {
    const frame = createMockFrame({ array: [15, 25] });
    const layout = calculateBarLayout(frame, 400, 100);
    expect(layout.bars[0].fill).toBe(COLOR_DEFAULT);
    expect(layout.bars[1].fill).toBe(COLOR_DEFAULT);
  });

  it('suppresses value labels when N > 25 or bar width < 16px', () => {
    const arr = Array.from({ length: 50 }, (_, i) => i + 1);
    const frame = createMockFrame({ array: arr });
    const layout = calculateBarLayout(frame, 400, 120);

    expect(layout.showLabels).toBe(false);
  });

  it('shows value labels when N <= 25 and bar width >= 16px', () => {
    const arr = [5, 15, 25, 35, 45];
    const frame = createMockFrame({ array: arr });
    const layout = calculateBarLayout(frame, 600, 120);

    expect(layout.showLabels).toBe(true);
  });
});
