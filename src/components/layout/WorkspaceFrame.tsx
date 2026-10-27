import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../state/appStore';
import { SectionHeading } from '../ui/SectionHeading';
import { Badge } from '../ui/Badge';

import { CoreDiagnosticPanel } from '../diagnostics/CoreDiagnosticPanel';
import { SortingArena } from '../arena/SortingArena';
import { AnalysisView } from '../analysis/AnalysisView';
import { SearchLab } from '../search/SearchLab';
import { ScalingLab } from '../scaling/ScalingLab';
import { VivaDemoView } from '../../features/viva/VivaDemoView';
import { VivaDemoBar } from '../../features/viva/VivaDemoBar';
import { getVivaDemoController } from '../../features/viva/VivaDemoController';
import type { VivaDemoState } from '../../features/viva/types';
import type { CoreClient } from '../../core/adapter/types';

export interface WorkspaceFrameProps {
  client?: CoreClient | null;
}

export const WorkspaceFrame: React.FC<WorkspaceFrameProps> = ({ client = null }) => {
  const activeSection = useAppStore((s) => s.activeSection);
  const [demoState, setDemoState] = useState<VivaDemoState>(() =>
    getVivaDemoController().getState()
  );

  useEffect(() => {
    const controller = getVivaDemoController((state) => {
      setDemoState({ ...state });
    });
    setDemoState(controller.getState());
  }, []);

  return (
    <main className="sl-workspace-frame" id="main-content">
      <div className="sl-workspace-inner">
        {activeSection === 'arena' && renderArenaSection(client)}
        {activeSection === 'analysis' && <AnalysisView client={client} />}
        {activeSection === 'search' && <SearchLab client={client} />}
        {activeSection === 'scaling' && <ScalingLab client={client} />}
        {activeSection === 'viva' && <VivaDemoView demoState={demoState} />}
      </div>

      {/* Floating Viva Demonstration Bar when active */}
      <VivaDemoBar demoState={demoState} />
    </main>
  );
};

function renderArenaSection(client: CoreClient | null) {
  return (
    <>
      <SectionHeading
        title={
          <>
            Race Arena
            <span className="sl-sr-only"> — SortLens Rebuild — 5-Algorithm Sorting Arena</span>
          </>
        }
        badge={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant="violet">v2.0</Badge>
            <Badge variant="neutral">ENGINEERING WORKBENCH</Badge>
          </div>
        }
        description="Deterministic concurrent execution across the 5 syllabus sorting algorithms. Track comparison counts, writes, and recursion depth in lockstep."
      />

      <SortingArena client={client} />

      <CoreDiagnosticPanel client={client} />
    </>
  );
}
