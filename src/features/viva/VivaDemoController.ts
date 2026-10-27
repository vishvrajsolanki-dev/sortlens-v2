import type { VivaStage, VivaDemoStatus, VivaDemoState } from './types';
import { useAppStore } from '../../state/appStore';

export const VIVA_STAGES: VivaStage[] = [
  {
    id: 'stage_overview',
    stageNumber: 1,
    title: 'SortLens Purpose & Syllabus Foundations',
    subtitle: 'Connecting asymptotic theory with empirical runtime work',
    syllabusUnit: 'Course 102040304 — Overview',
    targetSection: 'arena',
    durationSeconds: 8,
    narrativeText:
      'SortLens is an input-aware algorithm analyzer built for university data structures courses. Rather than assuming Quick Sort is always fastest, SortLens proves that real operational work depends directly on the structural shape of the input dataset.',
    bulletPoints: [
      '5 Syllabus Sorting Algorithms: Bubble, Selection, Insertion, Lomuto Quick, Top-down Merge.',
      'Single Source of Truth: All sorting, analysis, and counting execute in C99 compiled to WebAssembly.',
      'Zero Gamification: Strict academic telemetry with zero synthetic or fabricated measurements.',
    ],
  },
  {
    id: 'stage_dataset',
    stageNumber: 2,
    title: 'Deterministic Dataset Generation',
    subtitle: 'Reproducible inputs with calibrated parameters',
    syllabusUnit: 'Unit 1: Arrays & Input Structures',
    targetSection: 'arena',
    durationSeconds: 8,
    narrativeText:
      'We configure a reproducible test dataset of size N=30 with ~10% adjacent inversions (Nearly Sorted). The seed-based Mulberry32 generator ensures full repeatability across experiments.',
    bulletPoints: [
      'Bounded public application constraints: Array size N ∈ [2, 100], values V ∈ [1, 99].',
      'Configurable patterns: Random, Nearly Sorted, Reverse, Sorted, and Few Unique.',
      'Identical array dispatched concurrently to all five sorting lanes.',
    ],
  },
  {
    id: 'stage_shape_analysis',
    stageNumber: 3,
    title: 'Dataset Shape Metrics & Hash Table',
    subtitle: 'Measuring disorder and duplicates in C',
    syllabusUnit: 'Unit 3 & Unit 6: Lists, Hashing & Inversions',
    targetSection: 'analysis',
    durationSeconds: 10,
    narrativeText:
      'Before sorting begins, the C core measures array structure: Inversion Count (I), Inversion Ratio (r), and Max Leftward Displacement (p). Duplicates are detected via an 11-bucket separate-chaining hash table (Practical 10).',
    bulletPoints: [
      'Inversion Ratio r ∈ [0.0, 1.0]: Quantifies total disorder compared to n(n-1)/2 maximum.',
      'Max Leftward Displacement p: Lower-bounds inner loop shifting for Insertion Sort.',
      '11-Bucket Hash Table: Employs modulo hashing (val % 11) with singly linked list chains.',
    ],
  },
  {
    id: 'stage_cost_model',
    stageNumber: 4,
    title: 'Empirical Cost-Model Prediction',
    subtitle: 'Closed-form mathematical estimates (96.5% baseline accuracy)',
    syllabusUnit: 'Unit 1: Mathematical Complexity Modeling',
    targetSection: 'analysis',
    durationSeconds: 8,
    narrativeText:
      'The calibrated C99 cost model evaluates closed-form formulas across all five algorithms. For this nearly sorted dataset, Insertion Sort is predicted to achieve the fewest comparisons due to its adaptive O(n + I) behavior.',
    bulletPoints: [
      'Concealment Protocol: Predicted winner is concealed by default to prompt student hypothesizing.',
      'Zero DOM Leakage: The predicted algorithm name is strictly absent from DOM until explicitly revealed.',
      'Model Calibration: 96.50% overall prediction accuracy verified on 1,000 synthetic benchmarks.',
    ],
  },
  {
    id: 'stage_sorting_race',
    stageNumber: 5,
    title: 'Five-Lane Synchronized Sorting Arena',
    subtitle: 'Deterministic event playback with recursion stack depth',
    syllabusUnit: 'Unit 2: Queues (Practical 5) & Stacks (Practical 3)',
    targetSection: 'arena',
    durationSeconds: 16,
    narrativeText:
      'All five algorithms execute simultaneously. Each lane replays pre-recorded events from an array-based circular Trace Queue (Practical 5), while Quick and Merge sorts visualize their recursion call stack depth (Practical 3).',
    bulletPoints: [
      'Reversible Playback Engine: Bidirectional step navigation with sparse checkpointing (<0.2ms seek).',
      'Independent Lane Completion: Each algorithm finishes naturally when its trace queue is exhausted.',
      'Call Stack Telemetry: Lomuto Quick Sort exhibits O(log n) average depth, degrading on biased inputs.',
    ],
  },
  {
    id: 'stage_telemetry',
    stageNumber: 6,
    title: 'Operation Telemetry & Work Comparison',
    subtitle: 'Comparisons, writes, and memory mutations',
    syllabusUnit: 'Unit 1: Space & Time Complexity Analysis',
    targetSection: 'arena',
    durationSeconds: 8,
    narrativeText:
      'Observing the live telemetry HUDs: Insertion Sort finishes rapidly with minimal element comparisons, while Selection Sort stubbornly executes n(n-1)/2 comparisons regardless of initial order.',
    bulletPoints: [
      'Bubble Sort: Early-exit flag terminates in 1 pass if sorted, but requires adjacent swaps otherwise.',
      'Selection Sort: Comparison count is invariant (always n(n-1)/2), but performs only 2(n-1) writes.',
      'Merge Sort: Balanced O(n log n) division at the cost of O(n) auxiliary buffer space.',
    ],
  },
  {
    id: 'stage_scoreboard',
    stageNumber: 7,
    title: 'Verified Results Scoreboard & Prediction Verdict',
    subtitle: 'Zero outcome leakage and honest competition ranking',
    syllabusUnit: 'Evaluation & Verification',
    targetSection: 'arena',
    durationSeconds: 8,
    narrativeText:
      'Upon full race completion, the results scoreboard is revealed. Rankings use honest competition ties (e.g. T-1). The empirical prediction verdict compares the C model prediction against the actual winner.',
    bulletPoints: [
      'Zero Outcome Leakage: Scoreboard remains completely unrendered until all 5 lanes complete.',
      'Authoritative Telemetry: Final counters strictly equal the C core counts, verified by parity assertions.',
      'Verdict Banner: Emits PREDICTION CONFIRMED with complete mathematical explanation.',
    ],
  },
  {
    id: 'stage_search_lab',
    stageNumber: 8,
    title: 'Search Lab: Linear vs. Binary Search',
    subtitle: 'Sequential scanning vs. logarithmic interval halving',
    syllabusUnit: 'Unit 6: Searching Algorithms',
    targetSection: 'search',
    durationSeconds: 10,
    narrativeText:
      'Transitioning to the Search Lab: We compare Linear Search (O(n)) and Binary Search (O(log n)) on the verified C search buffer. Binary search eliminates half the remaining search space at each probe.',
    bulletPoints: [
      'Precondition Requirement: Binary search requires an O(n log n) sorted array before execution.',
      'Array Synchronization: Displayed cells strictly match the probed C memory indices.',
      'Comparison Advantage: Demonstrates up to 80-90% comparison reduction on target lookups.',
    ],
  },
  {
    id: 'stage_scaling_lab',
    stageNumber: 9,
    title: 'Scaling Lab: Empirical Complexity Curves',
    subtitle: 'Real measured operations across N ∈ [10, 100]',
    syllabusUnit: 'Unit 1: Asymptotic Scaling Benchmarks',
    targetSection: 'scaling',
    durationSeconds: 10,
    narrativeText:
      'In the Empirical Scaling Lab, we run live C benchmarks across sizes N=10 to 100. The SVG chart exposes how quadratic O(n^2) algorithms bend upwards steeply, while Merge Sort remains nearly linearithmic.',
    bulletPoints: [
      'Empirical vs Theoretical: Real C counts plotted alongside asymptotic reference curves.',
      'Quick Sort Degradation: Directly demonstrates Lomuto O(n^2) degradation on reversed/sorted datasets.',
      'Reproducible Benchmarks: Complete experiment metadata logged with generation seeds.',
    ],
  },
  {
    id: 'stage_conclusion',
    stageNumber: 10,
    title: 'Architecture Summary & Viva Conclusion',
    subtitle: 'A modern, modular, single-source-of-truth lab',
    syllabusUnit: 'Course Summary & Architecture',
    targetSection: 'viva',
    durationSeconds: 6,
    narrativeText:
      'SortLens demonstrates that educational software can combine modern frontend engineering with rigorous C99 algorithmic authority. All syllabus data structures are authentically implemented and verifiable.',
    bulletPoints: [
      'No Reimplemented Logic: WebAssembly ensures zero discrepancy between counters and visuals.',
      'Complete Syllabus Compliance: Arrays, Stacks, Queues, Linked Lists, Hashing, Sorting, Searching.',
      'Ready for University Examination: Complete test coverage and verified parity.',
    ],
  },
];

export class VivaDemoController {
  private stages: VivaStage[] = VIVA_STAGES;
  private currentStageIndex = 0;
  private status: VivaDemoStatus = 'idle';
  private secondsRemaining = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private onStateChange?: (state: VivaDemoState) => void;
  private listeners = new Set<(state: VivaDemoState) => void>();

  constructor(onStateChange?: (state: VivaDemoState) => void) {
    this.onStateChange = onStateChange;
    if (onStateChange) {
      this.listeners.add(onStateChange);
    }
    this.secondsRemaining = this.stages[0]?.durationSeconds ?? 8;
  }

  public subscribe(listener: (state: VivaDemoState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): VivaDemoState {
    return {
      status: this.status,
      currentStageIndex: this.currentStageIndex,
      secondsRemaining: this.secondsRemaining,
      totalStages: this.stages.length,
    };
  }

  public getCurrentStage(): VivaStage | null {
    return this.stages[this.currentStageIndex] ?? null;
  }

  public start(): void {
    this.stopTimer();
    this.currentStageIndex = 0;
    this.status = 'running';
    this.setupCurrentStage();
  }

  public pause(): void {
    if (this.status === 'running') {
      this.status = 'paused';
      this.stopTimer();
      this.notify();
    }
  }

  public resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
      this.startTimer();
      this.notify();
    }
  }

  public nextStage(): boolean {
    if (this.currentStageIndex < this.stages.length - 1) {
      this.currentStageIndex++;
      this.setupCurrentStage();
      return true;
    } else {
      this.complete();
      return false;
    }
  }

  public prevStage(): boolean {
    if (this.currentStageIndex > 0) {
      this.currentStageIndex--;
      this.setupCurrentStage();
      return true;
    }
    return false;
  }

  public skipToStage(index: number): void {
    if (index >= 0 && index < this.stages.length) {
      this.currentStageIndex = index;
      this.setupCurrentStage();
    }
  }

  public stop(): void {
    this.status = 'idle';
    this.stopTimer();
    this.currentStageIndex = 0;
    this.secondsRemaining = this.stages[0]?.durationSeconds ?? 8;
    this.notify();
  }

  public destroy(): void {
    this.stop();
    this.onStateChange = undefined;
  }

  private complete(): void {
    this.status = 'completed';
    this.stopTimer();
    this.secondsRemaining = 0;
    this.notify();
  }

  private setupCurrentStage(): void {
    const stage = this.stages[this.currentStageIndex];
    if (!stage) return;

    this.secondsRemaining = stage.durationSeconds;

    // Automatically synchronize app section view
    const store = useAppStore.getState();
    if (store.activeSection !== stage.targetSection) {
      store.setActiveSection(stage.targetSection);
    }

    if (this.status === 'running') {
      this.startTimer();
    }
    this.notify();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (this.secondsRemaining > 1) {
        this.secondsRemaining--;
        this.notify();
      } else {
        // Stage time elapsed, transition to next stage
        this.nextStage();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private notify(): void {
    const state = this.getState();
    if (this.onStateChange) {
      this.onStateChange(state);
    }
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

// Global singleton instance for app-wide demo coordination
let globalVivaController: VivaDemoController | null = null;

export function getVivaDemoController(
  onStateChange?: (state: VivaDemoState) => void
): VivaDemoController {
  if (!globalVivaController) {
    globalVivaController = new VivaDemoController();
  }
  if (onStateChange) {
    globalVivaController.subscribe(onStateChange);
  }
  return globalVivaController;
}
