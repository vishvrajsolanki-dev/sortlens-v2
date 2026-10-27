import React, { useEffect, useRef, useState, useCallback } from 'react';
import type {
  CoreClient,
  AlgorithmId,
  ShapeAnalysisResult,
  HashTableData,
  JudgeMetric,
} from '../../core/adapter/types';
import {
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
} from '../../core/adapter/types';
import { RaceCoordinator } from '../../engine/RaceCoordinator';
import type { RaceSnapshot, TraceSession } from '../../engine/types';
import { useAppStore } from '../../state/appStore';
import { generateDataset, parseCustomArray } from '../../core/dataset/generator';
import { DatasetControls } from './DatasetControls';
import { RaceToolbar } from './RaceToolbar';
import { CanvasLane } from './CanvasLane';
import { ShapeAnalysisPanel } from '../analysis/ShapeAnalysisPanel';
import { PredictionPanel } from '../analysis/PredictionPanel';
import { Scoreboard } from '../results/Scoreboard';
import { PredictionVerdict } from '../results/PredictionVerdict';
import { registerPlaybackDelegate } from '../../hooks/useKeyboardShortcuts';
import { saveCompletedRun, createCompletedRunRecord } from '../../state/persistence';
import { announce } from '../../state/announcer';
import { ALGORITHM_NAMES } from '../../core/adapter/types';

const SYLLABUS_ALGOS: AlgorithmId[] = [
  ALGO_BUBBLE,
  ALGO_SELECTION,
  ALGO_INSERTION,
  ALGO_QUICK,
  ALGO_MERGE,
];

export interface SortingArenaProps {
  client: CoreClient | null;
}

export const SortingArena: React.FC<SortingArenaProps> = ({ client }) => {
  const arraySize = useAppStore((s) => s.arraySize);
  const setArraySize = useAppStore((s) => s.setArraySize);
  const pattern = useAppStore((s) => s.datasetPattern);
  const setPattern = useAppStore((s) => s.setDatasetPattern);
  const judgeBy = useAppStore((s) => s.judgeBy);
  const setJudgeBy = useAppStore((s) => s.setJudgeBy);

  const coordinatorRef = useRef<RaceCoordinator | null>(null);
  const currentRunIdRef = useRef<string>('');
  const hasRecordedRunRef = useRef<boolean>(false);
  const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null);
  const [speed, setSpeed] = useState<number>(60);
  const [currentArray, setCurrentArray] = useState<number[]>([]);
  const [customInput, setCustomInput] = useState<string>('10, 3, 18, 5, 12, 1, 15, 7, 20, 2');
  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Analysis & Prediction state
  const [analysis, setAnalysis] = useState<ShapeAnalysisResult | null>(null);
  const [htData, setHtData] = useState<HashTableData | null>(null);
  const [sessions, setSessions] = useState<TraceSession[]>([]);
  const [isPredictionRevealed, setIsPredictionRevealed] = useState<boolean>(false);

  // Core staging function: executes shape analysis, all 5 sorts, and builds a new RaceCoordinator
  const stageRaceWithArray = useCallback(
    (arr: number[], metric: JudgeMetric = judgeBy) => {
      if (!client) return;

      try {
        setIsGenerating(true);

        // 1. Dispose existing coordinator
        if (coordinatorRef.current) {
          coordinatorRef.current.dispose();
          coordinatorRef.current = null;
        }

        // Generate unique run ID for idempotency and reset record guard
        currentRunIdRef.current = `run-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        hasRecordedRunRef.current = false;

        // 2. Perform authoritative pre-run C99 shape analysis & hash table build
        const shapeAnalysis = client.analyze(arr, metric);
        const hashTable = client.getHashTableData();

        // 3. Execute all 5 sorts in WASM kernel
        const stagedSessions: TraceSession[] = [];
        for (const algo of SYLLABUS_ALGOS) {
          client.setInputArray(arr);
          const res = client.runSort(algo, arr.length, true);

          stagedSessions.push({
            algo,
            initialArray: [...arr],
            events: res.events,
            cComparisons: res.comparisons,
            cWrites: res.writes,
            cMaxDepth: res.maxDepth,
            cOverflow: res.overflow,
            sortedArray: res.sortedArray,
          });
        }

        // 4. Build deterministic race coordinator
        const coordinator = new RaceCoordinator(stagedSessions);
        coordinator.setSpeed(speed);

        coordinator.subscribe((snap) => {
          setSnapshot(snap);
        });

        coordinatorRef.current = coordinator;
        setCurrentArray([...arr]);
        setSessions(stagedSessions);
        setAnalysis(shapeAnalysis);
        setHtData(hashTable);
        setIsPredictionRevealed(false); // Reset reveal on new dataset
        setDatasetError(null);
        announce(`Staged ${pattern} dataset with ${arr.length} elements.`);
      } catch (err: unknown) {
        setDatasetError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsGenerating(false);
      }
    },
    [client, judgeBy, speed, pattern]
  );

  // Register playback delegate for global keyboard shortcuts (Space, Arrows, Home)
  useEffect(() => {
    return registerPlaybackDelegate({
      togglePlay: () => {
        if (!coordinatorRef.current) return;
        const snap = coordinatorRef.current.getSnapshot();
        if (snap.status === 'playing') {
          coordinatorRef.current.pause();
        } else {
          coordinatorRef.current.play();
        }
      },
      stepForward: () => coordinatorRef.current?.stepForward(),
      stepBackward: () => coordinatorRef.current?.stepBackward(),
      restart: () => coordinatorRef.current?.restart(),
    });
  }, []);

  // Initialize race automatically once client becomes ready
  useEffect(() => {
    if (!client || coordinatorRef.current) return;
    const initial = generateDataset(pattern, arraySize);
    stageRaceWithArray(initial, judgeBy);

    return () => {
      if (coordinatorRef.current) {
        coordinatorRef.current.dispose();
        coordinatorRef.current = null;
      }
    };
  }, [client, pattern, arraySize, judgeBy, stageRaceWithArray]);

  // Clean disposal on unmount
  useEffect(() => {
    return () => {
      if (coordinatorRef.current) {
        coordinatorRef.current.dispose();
        coordinatorRef.current = null;
      }
    };
  }, []);

  // Handle judging metric change
  const handleJudgeByChange = (newMetric: JudgeMetric) => {
    setJudgeBy(newMetric);
    if (client && currentArray.length >= 2) {
      // Re-run analysis with new judging metric
      const updatedAnalysis = client.analyze(currentArray, newMetric);
      setAnalysis(updatedAnalysis);
    }
  };

  const handleGenerateNew = () => {
    try {
      let arr: number[];
      if (pattern === 'custom') {
        arr = parseCustomArray(customInput);
        setArraySize(arr.length);
      } else {
        arr = generateDataset(pattern, arraySize);
      }
      stageRaceWithArray(arr, judgeBy);
    } catch (err: unknown) {
      setDatasetError(err instanceof Error ? err.message : String(err));
    }
  };

  const handlePlay = () => coordinatorRef.current?.play();
  const handlePause = () => coordinatorRef.current?.pause();
  const handleStepBackward = () => coordinatorRef.current?.stepBackward();
  const handleStepForward = () => coordinatorRef.current?.stepForward();
  const handleRestart = () => coordinatorRef.current?.restart();
  const handleSeek = (step: number) => coordinatorRef.current?.seek(step);
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    coordinatorRef.current?.setSpeed(newSpeed);
  };

  const globalMaxVal = currentArray.reduce((acc, v) => (v > acc ? v : acc), 1);
  const isRaceComplete = snapshot?.status === 'completed';

  // Automatically record completed race run into persistent history (once per staged run)
  useEffect(() => {
    if (isRaceComplete && !hasRecordedRunRef.current && sessions.length === 5) {
      const record = createCompletedRunRecord({
        runId: currentRunIdRef.current || `run-${Date.now()}`,
        arraySize: currentArray.length,
        pattern,
        judgeBy,
        predictedAlgo: analysis?.predictedAlgo ?? null,
        sessions,
      });

      if (record) {
        saveCompletedRun(record);
        hasRecordedRunRef.current = true;
        const winnerName = ALGORITHM_NAMES[record.winnerAlgo] || 'Algorithm';
        announce(
          `Sorting race completed. ${winnerName} took first place with ${record.winnerCost} operations.`
        );
      }
    }
  }, [isRaceComplete, sessions, currentArray.length, pattern, judgeBy, analysis]);


  return (
    <div className="sl-arena-workbench">
      {/* Dataset & Metric Controls */}
      <DatasetControls
        arraySize={arraySize}
        pattern={pattern}
        customInput={customInput}
        isGenerating={isGenerating}
        error={datasetError}
        judgeBy={judgeBy}
        onSizeChange={(s) => setArraySize(s)}
        onPatternChange={(p) => setPattern(p)}
        onCustomInputChange={(val) => setCustomInput(val)}
        onGenerateNew={handleGenerateNew}
        onJudgeByChange={handleJudgeByChange}
      />

      {/* Pre-Run Shape Analysis & Cost-Model Prediction */}
      <div className="sl-analysis-grid">
        <ShapeAnalysisPanel
          analysis={analysis}
          htData={htData}
          arrayLength={currentArray.length}
        />
        <PredictionPanel
          analysis={analysis}
          judgeBy={judgeBy}
          isRevealed={isPredictionRevealed}
          onToggleReveal={() => setIsPredictionRevealed((prev) => !prev)}
        />
      </div>

      {/* Playback Controls Toolbar */}
      {snapshot && (
        <div style={{ marginTop: '20px' }}>
          <RaceToolbar
            status={snapshot.status}
            currentStep={snapshot.currentStep}
            maxSteps={snapshot.maxSteps}
            progress={snapshot.progress}
            speed={speed}
            onPlay={handlePlay}
            onPause={handlePause}
            onStepBackward={handleStepBackward}
            onStepForward={handleStepForward}
            onRestart={handleRestart}
            onSeek={handleSeek}
            onSpeedChange={handleSpeedChange}
          />
        </div>
      )}

      {/* Shared Race Header & Legend */}
      {snapshot && (
        <div className="sl-race-header-card">
          <div className="sl-race-header-top">
            <div className="sl-race-header-title-group">
              <span className="sl-race-header-title">Algorithm Race (5 Algorithms)</span>
              <span className="sl-race-header-counter">
                {Math.round(snapshot.progress * 100)}% ({snapshot.currentStep.toLocaleString()} / {snapshot.maxSteps.toLocaleString()} events)
              </span>
            </div>

            <div className="sl-color-legend" aria-label="Highlight Color Legend">
              <div className="sl-legend-item">
                <span className="sl-legend-dot" style={{ backgroundColor: '#374151' }} />
                <span>Default</span>
              </div>
              <div className="sl-legend-item">
                <span className="sl-legend-dot" style={{ backgroundColor: '#f59e0b' }} />
                <span>Compared</span>
              </div>
              <div className="sl-legend-item">
                <span className="sl-legend-dot" style={{ backgroundColor: '#f43f5e' }} />
                <span>Written</span>
              </div>
              <div className="sl-legend-item">
                <span className="sl-legend-dot" style={{ backgroundColor: '#8b5cf6' }} />
                <span>Pivot</span>
              </div>
              <div className="sl-legend-item">
                <span className="sl-legend-dot" style={{ backgroundColor: '#10b981' }} />
                <span>Sorted</span>
              </div>
            </div>
          </div>

          <div
            className="sl-global-race-progress-track"
            role="progressbar"
            aria-valuenow={Math.round(snapshot.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Global Race Progress"
          >
            <div
              className="sl-global-race-progress-bar"
              style={{ width: `${Math.round(snapshot.progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* 5 Synchronized Canvas Sorting Lanes (Desktop 5-Column Grid) */}
      <div className="sl-arena-5col-grid">
        {snapshot ? (
          snapshot.lanes.map((lane) => (
            <CanvasLane
              key={lane.algo}
              algo={lane.algo}
              frame={lane.frame}
              isDone={lane.isDone}
              globalMaxVal={globalMaxVal}
            />
          ))
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '32px',
              textAlign: 'center',
              color: 'var(--sl-color-text-muted)',
              background: 'var(--sl-color-surface-1)',
              borderRadius: '8px',
            }}
          >
            {client ? 'Staging 5-lane sorting arena...' : 'Waiting for WebAssembly algorithmic engine...'}
          </div>
        )}
      </div>

      {/* Post-Run Final Results & Scoreboard (Strictly hidden until verified completion!) */}
      {isRaceComplete && (
        <div className="sl-results-section">
          <Scoreboard
            sessions={sessions}
            judgeBy={judgeBy}
            predictedAlgo={analysis?.predictedAlgo ?? null}
            isComplete={isRaceComplete}
          />
          <PredictionVerdict
            sessions={sessions}
            predictedAlgo={analysis?.predictedAlgo ?? null}
            judgeBy={judgeBy}
            isComplete={isRaceComplete}
          />
        </div>
      )}
    </div>
  );
};
