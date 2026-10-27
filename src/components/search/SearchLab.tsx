import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Panel } from '../ui/Panel';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SectionHeading } from '../ui/SectionHeading';
import { SearchVisualizer } from './SearchVisualizer';
import { SearchStepPlayer } from './SearchStepPlayer';
import type { CoreClient, SearchStep, SearchResult } from '../../core/adapter/types';
import { SEARCH_LINEAR, SEARCH_BINARY } from '../../core/adapter/types';
import { generateDataset } from '../../core/dataset/generator';

export interface SearchLabProps {
  client?: CoreClient | null;
  initialArray?: number[];
}

export const SearchLab: React.FC<SearchLabProps> = ({ client = null, initialArray }) => {
  // Array parameters
  const [arraySize, setArraySize] = useState<number>(() => initialArray?.length ?? 20);
  const [pattern, setPattern] = useState<'random' | 'nearly' | 'reverse' | 'sorted'>('random');
  const [seed, setSeed] = useState<number>(42);

  // Original dataset and C-prepared sorted search buffer
  const [originalArray, setOriginalArray] = useState<number[]>(() => {
    return initialArray ?? generateDataset('random', 20, 42);
  });
  const [searchBuffer, setSearchBuffer] = useState<number[]>([]);

  // Search target value
  const [target, setTarget] = useState<number>(() => {
    return originalArray[Math.floor(originalArray.length / 2)] ?? 42;
  });
  const [targetInputStr, setTargetInputStr] = useState<string>(String(target));
  const [targetError, setTargetError] = useState<string | null>(null);

  // Search execution results from C core
  const [linearResult, setLinearResult] = useState<SearchResult | null>(null);
  const [binaryResult, setBinaryResult] = useState<SearchResult | null>(null);

  // Step playback state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.5); // steps per second

  // Step player reference
  const playerRef = useRef<SearchStepPlayer | null>(null);

  // Prepare and run search through C core
  const executeSearch = useCallback((arr: number[], searchTarget: number) => {
    if (!client || !client.isReady() || arr.length === 0) return;

    try {
      // 1. Prepare search buffer in C WASM (sorts array via Merge Sort)
      const sorted = client.prepareSearch(arr);
      setSearchBuffer(sorted);

      // 2. Execute Linear Search on C core
      const linRes = client.search(SEARCH_LINEAR, searchTarget, sorted.length);
      setLinearResult(linRes);

      // 3. Execute Binary Search on C core
      const binRes = client.search(SEARCH_BINARY, searchTarget, sorted.length);
      setBinaryResult(binRes);

      // 4. Calculate total steps required (max of linear and binary for synchronized playback)
      const maxSteps = Math.max(linRes.steps.length, binRes.steps.length);

      // 5. Initialize or reset player
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      const player = new SearchStepPlayer({
        totalSteps: maxSteps,
        initialSpeed: speed,
        onStepChange: (idx) => {
          setCurrentStepIndex(idx);
        },
        onComplete: () => {
          setIsPlaying(false);
        },
      });

      playerRef.current = player;
      setCurrentStepIndex(0);
      setIsPlaying(false);
    } catch (err: unknown) {
      console.error('Failed to execute search in C core:', err);
    }
  }, [client, speed]);

  // Regenerate dataset on size or pattern change
  const handleRegenerate = useCallback((size: number, pat: 'random' | 'nearly' | 'reverse' | 'sorted', s: number) => {
    const genPattern = pat === 'nearly' ? 'nearly_sorted' : pat;
    const newArr = generateDataset(genPattern, size, s);
    setOriginalArray(newArr);
    // Pick an existing element or keep valid target
    const newTarget = newArr[Math.floor(newArr.length / 2)] ?? 42;
    setTarget(newTarget);
    setTargetInputStr(String(newTarget));
    setTargetError(null);
    executeSearch(newArr, newTarget);
  }, [executeSearch]);

  // Initial execution when client is ready
  useEffect(() => {
    if (client && client.isReady()) {
      executeSearch(originalArray, target);
    }
  }, [client]);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Playback handlers
  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStepForward = () => {
    if (!playerRef.current) return;
    playerRef.current.stepForward();
    setIsPlaying(false);
  };

  const handleStepBackward = () => {
    if (!playerRef.current) return;
    playerRef.current.stepBackward();
    setIsPlaying(false);
  };

  const handleRestart = () => {
    if (!playerRef.current) return;
    playerRef.current.restart();
    setIsPlaying(false);
  };

  const handleSeek = (step: number) => {
    if (!playerRef.current) return;
    playerRef.current.seek(step);
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (playerRef.current) {
      playerRef.current.setSpeed(newSpeed);
    }
  };

  // Target input change
  const handleTargetCommit = (newVal: number) => {
    if (isNaN(newVal) || !Number.isInteger(newVal) || newVal < 1 || newVal > 99) {
      setTargetError('Target must be an integer between 1 and 99');
      return;
    }
    setTargetError(null);
    setTarget(newVal);
    setTargetInputStr(String(newVal));
    executeSearch(originalArray, newVal);
  };

  // Active step for Linear and Binary searches
  const totalSteps = useMemo(() => {
    if (!linearResult || !binaryResult) return 0;
    return Math.max(linearResult.steps.length, binaryResult.steps.length);
  }, [linearResult, binaryResult]);

  const linearStep: SearchStep | null = useMemo(() => {
    if (!linearResult || linearResult.steps.length === 0) return null;
    const idx = Math.min(currentStepIndex, linearResult.steps.length - 1);
    return linearResult.steps[idx] ?? null;
  }, [linearResult, currentStepIndex]);

  const binaryStep: SearchStep | null = useMemo(() => {
    if (!binaryResult || binaryResult.steps.length === 0) return null;
    const idx = Math.min(currentStepIndex, binaryResult.steps.length - 1);
    return binaryResult.steps[idx] ?? null;
  }, [binaryResult, currentStepIndex]);

  const isLinearComplete = linearResult !== null && currentStepIndex >= linearResult.steps.length - 1;
  const isBinaryComplete = binaryResult !== null && currentStepIndex >= binaryResult.steps.length - 1;
  const isAllComplete = currentStepIndex >= totalSteps - 1 && totalSteps > 0;

  return (
    <div className="sl-search-lab-workbench">
      <SectionHeading
        title="Search Laboratory — Linear vs. Binary Search"
        badge={<Badge variant="cyan">UNIT 6 SYLLABUS</Badge>}
        description="Side-by-step comparative analysis of sequential Linear Search ($O(n)$) against divide-and-conquer Binary Search ($O(\log n)$) using the authoritative C99 core."
      />

      {/* Control Panel */}
      <Panel title="Search Configuration & Parameters" className="sl-search-controls-panel">
        <div className="sl-search-controls-grid">
          {/* Target Input and Preset Buttons */}
          <div className="sl-search-control-col">
            <label className="sl-control-label" htmlFor="search-target-input">
              SEARCH TARGET VALUE (V ∈ [1, 99]):
            </label>
            <div className="sl-search-target-input-row">
              <input
                id="search-target-input"
                type="number"
                min="1"
                max="99"
                value={targetInputStr}
                onChange={(e) => {
                  setTargetInputStr(e.target.value);
                  const parsed = parseInt(e.target.value, 10);
                  if (!isNaN(parsed) && parsed >= 1 && parsed <= 99) {
                    setTargetError(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTargetCommit(parseInt(targetInputStr, 10));
                  }
                }}
                className="sl-input sl-search-target-input"
                aria-label="Target search value"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleTargetCommit(parseInt(targetInputStr, 10))}
              >
                Set Target
              </Button>
            </div>
            {targetError && (
              <span className="sl-text-xs sl-text-amber" role="alert">
                {targetError}
              </span>
            )}
            <div className="sl-search-quick-targets">
              <span className="sl-text-xs sl-text-muted">QUICK TARGETS:</span>
              <button
                type="button"
                className="sl-quick-target-chip"
                onClick={() => searchBuffer.length > 0 && handleTargetCommit(searchBuffer[0]!)}
                title="First element in sorted buffer"
              >
                First ({searchBuffer[0] ?? '-'})
              </button>
              <button
                type="button"
                className="sl-quick-target-chip"
                onClick={() =>
                  searchBuffer.length > 0 &&
                  handleTargetCommit(searchBuffer[Math.floor(searchBuffer.length / 2)]!)
                }
                title="Midpoint element in sorted buffer"
              >
                Mid ({searchBuffer[Math.floor(searchBuffer.length / 2)] ?? '-'})
              </button>
              <button
                type="button"
                className="sl-quick-target-chip"
                onClick={() =>
                  searchBuffer.length > 0 &&
                  handleTargetCommit(searchBuffer[searchBuffer.length - 1]!)
                }
                title="Last element in sorted buffer"
              >
                Last ({searchBuffer[searchBuffer.length - 1] ?? '-'})
              </button>
              <button
                type="button"
                className="sl-quick-target-chip sl-quick-target-absent"
                onClick={() => handleTargetCommit(999 > 99 ? 1 : 99)} // Valid absent or extreme
                title="Test element not in array"
              >
                Absent (99)
              </button>
            </div>
          </div>

          {/* Dataset Generator Settings */}
          <div className="sl-search-control-col">
            <label className="sl-control-label" htmlFor="search-size-slider">
              ARRAY SIZE: <span className="sl-control-value sl-font-mono">N = {arraySize}</span>
            </label>
            <input
              id="search-size-slider"
              type="range"
              min="5"
              max="40"
              value={arraySize}
              onChange={(e) => {
                const s = parseInt(e.target.value, 10);
                setArraySize(s);
                handleRegenerate(s, pattern, seed);
              }}
              className="sl-size-slider"
              aria-label="Array size slider"
            />
            <div className="sl-pattern-button-group" role="radiogroup" aria-label="Dataset Pattern">
              {(['random', 'nearly', 'reverse', 'sorted'] as const).map((pat) => (
                <button
                  key={pat}
                  type="button"
                  role="radio"
                  aria-checked={pattern === pat}
                  className={`sl-pattern-chip ${pattern === pat ? 'sl-pattern-chip-active' : ''}`}
                  onClick={() => {
                    setPattern(pat);
                    handleRegenerate(arraySize, pat, seed);
                  }}
                >
                  {pat === 'nearly' ? 'Nearly Sorted' : pat.charAt(0).toUpperCase() + pat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Seed and Actions */}
          <div className="sl-search-control-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const newSeed = (seed + 17) % 10000;
                setSeed(newSeed);
                handleRegenerate(arraySize, pattern, newSeed);
              }}
            >
              🎲 New Random Array
            </Button>
            <span className="sl-text-xs sl-text-dim" style={{ marginTop: '8px' }}>
              *Click any array cell below to immediately set it as search target.
            </span>
          </div>
        </div>
      </Panel>

      {/* Array Synchronization Callout: Original vs C Search Buffer */}
      <div className="sl-search-sync-card">
        <div className="sl-sync-header">
          <span className="sl-text-xs sl-text-muted" style={{ fontWeight: 600 }}>
            ARRAY SYNCHRONIZATION GUARANTEE (C99 MEMORY BUFFER):
          </span>
          <Badge variant="indigo">VERIFIED SYNC</Badge>
        </div>
        <p className="sl-text-xs sl-text-secondary" style={{ margin: '4px 0 0 0' }}>
          <strong>Binary Search Precondition</strong>: Binary search mathematically requires elements to be strictly sorted ascending ($O(n \log n)$ preparation). In the C99 core, <code>sl_make_sorted(n)</code> runs Merge Sort and stores the verified array in <code>g_sorted_array</code>.
          Both searches below operate against this exact sorted buffer so that probed indices, range bounds <code>[low, high]</code>, and found indices are perfectly synchronized with zero cell mismatch.
        </p>
      </div>

      {/* Playback Controls Toolbar */}
      <div className="sl-search-toolbar">
        <div className="sl-search-toolbar-buttons">
          <Button
            variant={isPlaying ? 'secondary' : 'primary'}
            size="sm"
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Pause search animation' : 'Play search animation'}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleStepBackward}
            disabled={currentStepIndex === 0}
            aria-label="Step backward one comparison"
          >
            ⏮ Step Back
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleStepForward}
            disabled={currentStepIndex >= totalSteps - 1}
            aria-label="Step forward one comparison"
          >
            ⏭ Step Forward
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestart}
            aria-label="Restart search animation to step 0"
          >
            ↺ Restart
          </Button>
        </div>

        {/* Timeline Scrubber */}
        <div className="sl-search-scrubber-group">
          <label htmlFor="search-timeline-scrubber" className="sl-text-xs sl-text-muted">
            STEP: <span className="sl-font-mono sl-text-primary">{totalSteps > 0 ? currentStepIndex + 1 : 0} / {totalSteps}</span>
          </label>
          <input
            id="search-timeline-scrubber"
            type="range"
            min="0"
            max={Math.max(0, totalSteps - 1)}
            value={currentStepIndex}
            onChange={(e) => handleSeek(parseInt(e.target.value, 10))}
            className="sl-size-slider"
            aria-label="Search timeline scrubber"
          />
        </div>

        {/* Playback Speed Multiplier */}
        <div className="sl-search-speed-group">
          <span className="sl-text-xs sl-text-muted">SPEED:</span>
          {[0.75, 1.5, 3, 6].map((spd) => (
            <button
              key={spd}
              type="button"
              className={`sl-speed-chip ${speed === spd ? 'sl-speed-chip-active' : ''}`}
              onClick={() => handleSpeedChange(spd)}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Search Visualizers */}
      <div className="sl-search-viz-grid">
        <SearchVisualizer
          title="Linear Search"
          badge={<Badge variant="neutral">SEQUENTIAL SCAN</Badge>}
          complexity="O(n)"
          array={searchBuffer}
          target={target}
          currentStep={linearStep}
          stepIndex={currentStepIndex}
          totalSteps={linearResult?.steps.length ?? 0}
          finalFoundIndex={linearResult?.foundIndex ?? -1}
          finalComparisons={linearResult?.comparisons ?? 0}
          isComplete={isLinearComplete}
          isBinary={false}
          onCellClick={handleTargetCommit}
        />

        <SearchVisualizer
          title="Binary Search"
          badge={<Badge variant="indigo">DIVIDE & CONQUER</Badge>}
          complexity="O(log n)"
          array={searchBuffer}
          target={target}
          currentStep={binaryStep}
          stepIndex={currentStepIndex}
          totalSteps={binaryResult?.steps.length ?? 0}
          finalFoundIndex={binaryResult?.foundIndex ?? -1}
          finalComparisons={binaryResult?.comparisons ?? 0}
          isComplete={isBinaryComplete}
          isBinary={true}
          onCellClick={handleTargetCommit}
        />
      </div>

      {/* Pedagogical Takeaway Summary Banner */}
      {isAllComplete && linearResult && binaryResult && (
        <section
          className="sl-search-takeaway-banner"
          aria-label="Comparative Search Analysis Takeaway"
        >
          <div className="sl-takeaway-header">
            <span className="sl-badge sl-badge-indigo">
              <span className="sl-badge-dot" aria-hidden="true" />
              ALGORITHMIC EFFICIENCY COMPARISON
            </span>
            <span className="sl-text-sm sl-text-primary" style={{ fontWeight: 600 }}>
              Target: {target} | Array Size: N = {searchBuffer.length}
            </span>
          </div>
          <div className="sl-takeaway-content">
            <div className="sl-takeaway-stat">
              <span className="sl-text-xs sl-text-muted">LINEAR SEARCH COMPARISONS:</span>
              <span className="sl-takeaway-num sl-font-mono sl-text-rose">
                {linearResult.comparisons}
              </span>
              <span className="sl-text-xs sl-text-dim">
                Probed {((linearResult.comparisons / searchBuffer.length) * 100).toFixed(0)}% of dataset
              </span>
            </div>
            <div className="sl-takeaway-stat">
              <span className="sl-text-xs sl-text-muted">BINARY SEARCH COMPARISONS:</span>
              <span className="sl-takeaway-num sl-font-mono sl-text-emerald">
                {binaryResult.comparisons}
              </span>
              <span className="sl-text-xs sl-text-dim">
                Probed {((binaryResult.comparisons / searchBuffer.length) * 100).toFixed(0)}% of dataset
              </span>
            </div>
            <div className="sl-takeaway-stat" style={{ flex: 1.5 }}>
              <span className="sl-text-xs sl-text-muted">SEARCH ADVANTAGE:</span>
              <span className="sl-takeaway-advantage sl-text-emerald">
                {linearResult.comparisons > binaryResult.comparisons
                  ? `Saved ${linearResult.comparisons - binaryResult.comparisons} comparisons (${(
                      (1 - binaryResult.comparisons / linearResult.comparisons) *
                      100
                    ).toFixed(0)}% reduction)`
                  : 'Identical comparisons on this specific index'}
              </span>
              <span className="sl-text-xs sl-text-secondary">
                Binary search eliminates half the remaining search window at each comparison step, requiring at most $\lceil \log_2({searchBuffer.length}) \rceil = {Math.ceil(Math.log2(searchBuffer.length))}$ inspections.
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
