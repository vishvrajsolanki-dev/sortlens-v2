import React from 'react';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { getVivaDemoController, VIVA_STAGES } from './VivaDemoController';
import type { VivaDemoState } from './types';

export interface VivaDemoViewProps {
  demoState: VivaDemoState;
}

export const VivaDemoView: React.FC<VivaDemoViewProps> = ({ demoState }) => {
  const controller = getVivaDemoController();
  const isRunning = demoState.status === 'running' || demoState.status === 'paused';

  return (
    <div className="sl-viva-view-workbench">
      <SectionHeading
        title="Automated Viva Demonstration & Examiner Study Guide"
        badge={<Badge variant="emerald">ACADEMIC VIVA MODE</Badge>}
        description="A scripted 90-second automated walkthrough designed for oral examinations and practical evaluations. Explores all course syllabus units with authentic C WebAssembly telemetry."
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isRunning ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => controller.start()}
                aria-label="Start automated 90-second viva tour"
              >
                ⏱ Start 90s Academic Viva Tour
              </Button>
            ) : (
              <Button
                variant="danger"
                size="md"
                onClick={() => controller.stop()}
                aria-label="Stop viva demonstration"
              >
                ⏹ Stop Demonstration
              </Button>
            )}
          </div>
        }
      />

      {/* 10-Stage Academic Tour Overview */}
      <Panel
        title="Demonstration Stage Roadmap (10 Guided Steps)"
        subtitle="Each stage exercises authentic C99 operations and highlights specific syllabus concepts"
        badge={<Badge variant="indigo">92s TOTAL DURATION</Badge>}
        className="sl-viva-stages-panel"
      >
        <div className="sl-viva-stages-list" role="list" aria-label="Viva Tour Stages">
          {VIVA_STAGES.map((stage, idx) => {
            const isActive = isRunning && demoState.currentStageIndex === idx;
            const isDone = isRunning && demoState.currentStageIndex > idx;

            return (
              <div
                key={stage.id}
                role="listitem"
                className={`sl-viva-stage-card ${isActive ? 'sl-stage-active' : ''} ${
                  isDone ? 'sl-stage-done' : ''
                }`}
              >
                <div className="sl-stage-card-header">
                  <div className="sl-stage-num-badge">
                    {isDone ? '✓' : `0${stage.stageNumber}`}
                  </div>
                  <div className="sl-stage-header-text">
                    <h4 className="sl-stage-title">{stage.title}</h4>
                    <span className="sl-stage-syllabus">{stage.syllabusUnit}</span>
                  </div>
                  <span className="sl-stage-duration sl-font-mono">{stage.durationSeconds}s</span>
                </div>
                <p className="sl-stage-narrative">{stage.narrativeText}</p>
                <ul className="sl-stage-bullets">
                  {stage.bulletPoints.map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
                <div className="sl-stage-card-footer">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!isRunning) controller.start();
                      controller.skipToStage(idx);
                    }}
                  >
                    🚀 Jump to Stage
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Examiner Q&A Study Guide Panel */}
      <Panel
        title="University Practical & Viva Q&A Guide"
        subtitle="Core conceptual answers aligned with Data Structures Course 102040304"
        badge={<Badge variant="cyan">EXAMINER PREPARATION</Badge>}
        className="sl-viva-qa-panel"
      >
        <div className="sl-viva-qa-accordion">
          <div className="sl-qa-item">
            <h4 className="sl-qa-q">Q1: What is an Inversion, and why does it govern sorting work?</h4>
            <p className="sl-qa-a">
              An inversion is any pair $(i, j)$ such that $i &lt; j$ but $A[i] &gt; A[j]$. A sorted
              array has 0 inversions, whereas a reversed array has $n(n-1)/2$. In Bubble Sort, every
              adjacent swap eliminates exactly 1 inversion (writes equal $3I$ on swap). In
              Insertion Sort, the number of shifts is directly proportional to inversions to the
              left.
            </p>
          </div>

          <div className="sl-qa-item">
            <h4 className="sl-qa-q">
              Q2: Why does Lomuto Quick Sort lose on already sorted or reversed data?
            </h4>
            <p className="sl-qa-a">
              With syllabus-standard Lomuto partitioning, the pivot is fixed at the last element
              (<code>arr[high]</code>). On sorted inputs, the pivot is always the maximal element,
              creating maximally unbalanced partitions of size $n-1$ and $0$. The comparisons
              degrade to sum(i=1..n-1) = n(n-1)/2 ($O(n^2)$), and recursion stack depth
              degrades from $O(\log n)$ to $O(n)$, which our call stack visualizer proves.
            </p>
          </div>

          <div className="sl-qa-item">
            <h4 className="sl-qa-q">
              Q3: How is duplicate detection implemented, and why not use an $O(n^2)$ loop?
            </h4>
            <p className="sl-qa-a">
              Duplicate detection uses a Separate-Chaining Hash Table (Unit 6 / Practical 10) with 11
              buckets. The hash function is <code>val % 11</code>, and each bucket is a singly
              linked list (Unit 3). Inserting elements traverses the bucket chain; duplicates are
              recognized without insertion, and bucket collisions are counted when distinct keys map
              to the same bucket.
            </p>
          </div>

          <div className="sl-qa-item">
            <h4 className="sl-qa-q">
              Q4: How do you guarantee the browser animation counters strictly match C counts?
            </h4>
            <p className="sl-qa-a">
              In legacy v1, sorting was re-implemented in JavaScript, which allowed counters and
              visuals to disagree. In SortLens v2, sorting logic runs solely in C compiled to
              WebAssembly, emitting event structs into an array-based circular Trace Queue (Practical
              5). The frontend reconstructs exact frames from this queue, and asserts on the final
              frame that the frame counters match the C core counters with 100% parity.
            </p>
          </div>

          <div className="sl-qa-item">
            <h4 className="sl-qa-q">
              Q5: How does Binary Search compare to Linear Search in the Search Lab?
            </h4>
            <p className="sl-qa-a">
              Binary Search requires an $O(n \log n)$ sorted search buffer as a strict precondition.
              Once sorted, it halves the search interval <code>[low, high]</code> at each step,
              guaranteeing at most $\lceil \log_2 n \rceil$ comparisons compared to Linear Search's
              $O(n)$ sequential probe.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
};
