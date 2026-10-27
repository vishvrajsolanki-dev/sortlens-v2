export interface BarLayoutItem {
  index: number;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  isHighlighted: boolean;
  isPivot: boolean;
  isInRange: boolean;
}

export interface LaneLayoutResult {
  bars: BarLayoutItem[];
  maxVal: number;
  showLabels: boolean;
}
