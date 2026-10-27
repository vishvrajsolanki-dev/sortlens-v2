import React, { useState, useEffect, useCallback } from 'react';
import type { CoreClient, ShapeAnalysisResult, HashTableData, JudgeMetric } from '../../core/adapter/types';
import { useAppStore } from '../../state/appStore';
import { generateDataset, parseCustomArray } from '../../core/dataset/generator';
import { SectionHeading } from '../ui/SectionHeading';
import { Badge } from '../ui/Badge';
import { Panel } from '../ui/Panel';
import { DatasetControls } from '../arena/DatasetControls';
import { ShapeAnalysisPanel } from './ShapeAnalysisPanel';
import { PredictionPanel } from './PredictionPanel';

export interface AnalysisViewProps {
  client: CoreClient | null;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ client }) => {
  const arraySize = useAppStore((s) => s.arraySize);
  const setArraySize = useAppStore((s) => s.setArraySize);
  const pattern = useAppStore((s) => s.datasetPattern);
  const setPattern = useAppStore((s) => s.setDatasetPattern);
  const judgeBy = useAppStore((s) => s.judgeBy);
  const setJudgeBy = useAppStore((s) => s.setJudgeBy);

  const [currentArray, setCurrentArray] = useState<number[]>([]);
  const [customInput, setCustomInput] = useState<string>('10, 3, 18, 5, 12, 1, 15, 7, 20, 2');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ShapeAnalysisResult | null>(null);
  const [htData, setHtData] = useState<HashTableData | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  const analyzeDataset = useCallback(
    (arr: number[], metric: JudgeMetric = judgeBy) => {
      if (!client) return;
      try {
        const res = client.analyze(arr, metric);
        const ht = client.getHashTableData();
        setAnalysis(res);
        setHtData(ht);
        setCurrentArray([...arr]);
        setError(null);
        setIsRevealed(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [client, judgeBy]
  );

  useEffect(() => {
    if (!client) return;
    const initial = generateDataset(pattern, arraySize);
    analyzeDataset(initial, judgeBy);
  }, [client, pattern, arraySize, judgeBy, analyzeDataset]);

  const handleGenerate = () => {
    try {
      let arr: number[];
      if (pattern === 'custom') {
        arr = parseCustomArray(customInput);
        setArraySize(arr.length);
      } else {
        arr = generateDataset(pattern, arraySize);
      }
      analyzeDataset(arr, judgeBy);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleJudgeByChange = (newMetric: JudgeMetric) => {
    setJudgeBy(newMetric);
    if (client && currentArray.length >= 2) {
      analyzeDataset(currentArray, newMetric);
    }
  };

  return (
    <div>
      <SectionHeading
        title="Dataset Shape & Cost Model Analyzer"
        badge={<Badge variant="amber">ANALYTICAL WORKBENCH</Badge>}
        description="Explores the mathematical structure of the dataset prior to sorting execution. Calculates inversions, displacement, duplicate clustering, and cost-model predictions."
      />

      <DatasetControls
        arraySize={arraySize}
        pattern={pattern}
        customInput={customInput}
        isGenerating={false}
        error={error}
        judgeBy={judgeBy}
        onSizeChange={(s) => setArraySize(s)}
        onPatternChange={(p) => setPattern(p)}
        onCustomInputChange={(val) => setCustomInput(val)}
        onGenerateNew={handleGenerate}
        onJudgeByChange={handleJudgeByChange}
      />

      <div className="sl-analysis-grid">
        <ShapeAnalysisPanel
          analysis={analysis}
          htData={htData}
          arrayLength={currentArray.length}
        />
        <PredictionPanel
          analysis={analysis}
          judgeBy={judgeBy}
          isRevealed={isRevealed}
          onToggleReveal={() => setIsRevealed((prev) => !prev)}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <Panel
          title="Syllabus Invariants & Mathematical Formulations"
          subtitle="Course 102040304 Data Structures — Graded viva concepts"
          badge={<Badge variant="neutral">THEORY REFERENCE</Badge>}
        >
          <div className="sl-syllabus-box">
            <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: '1.8' }}>
            <li>
              <strong>Inversion Counting ($O(n \log n)$)</strong>: Measured via modified merge sort. Each out-of-order pair during merging increments $I$ by $(mid - i + 1)$.
            </li>
            <li>
              <strong>Max Leftward Displacement ($p$)</strong>: Bounds Bubble Sort passes to $\min(p + 1, n - 1)$. If $p$ is small, early-exit terminates in $O(p \cdot n)$.
            </li>
            <li>
              <strong>Separate-Chaining Hash Table (Practical 10)</strong>: 11 buckets using division hash h(k) = k mod 11. Measures duplicate ratio d = (n - distinct) / (n - 1).
            </li>
            <li>
              <strong>Cost Model Prediction</strong>: Evaluates closed-form formulas for each algorithm and predicts the cheapest based on the active judging criterion.
            </li>
          </ul>
        </div>
      </Panel>
    </div>
  </div>
  );
};
