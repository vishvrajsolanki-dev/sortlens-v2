import { describe, it, expect } from 'vitest';
import { VivaDemoController, VIVA_STAGES } from '../../src/features/viva/VivaDemoController';
import { useAppStore } from '../../src/state/appStore';

describe('Viva Demo Mode Controller Suite', () => {
  it('initializes with 10 explicit syllabus-compliant stages in idle state', () => {
    const controller = new VivaDemoController();
    const state = controller.getState();

    expect(state.status).toBe('idle');
    expect(state.currentStageIndex).toBe(0);
    expect(state.totalStages).toBe(10);
    expect(VIVA_STAGES).toHaveLength(10);

    // Verify stage 1 starts with overview
    expect(VIVA_STAGES[0]!.id).toBe('stage_overview');
    // Verify stage 10 finishes with conclusion
    expect(VIVA_STAGES[9]!.id).toBe('stage_conclusion');

    controller.destroy();
  });

  it('progresses through stages, pauses, resumes, and updates appStore activeSection', () => {
    let notifiedState = null;
    const controller = new VivaDemoController((s) => {
      notifiedState = s;
    });

    // Start demo
    controller.start();
    let state = controller.getState();
    expect(state.status).toBe('running');
    expect(state.currentStageIndex).toBe(0);
    expect(useAppStore.getState().activeSection).toBe('arena');

    // Pause demo
    controller.pause();
    state = controller.getState();
    expect(state.status).toBe('paused');

    // Resume demo
    controller.resume();
    state = controller.getState();
    expect(state.status).toBe('running');

    // Advance to stage 3 (Shape Analysis) -> should switch section to 'analysis'
    controller.skipToStage(2);
    state = controller.getState();
    expect(state.currentStageIndex).toBe(2);
    expect(useAppStore.getState().activeSection).toBe('analysis');

    // Advance to stage 8 (Search Lab) -> should switch section to 'search'
    controller.skipToStage(7);
    expect(useAppStore.getState().activeSection).toBe('search');

    // Advance to stage 9 (Scaling Lab) -> should switch section to 'scaling'
    controller.skipToStage(8);
    expect(useAppStore.getState().activeSection).toBe('scaling');

    // Step backward
    expect(controller.prevStage()).toBe(true);
    expect(controller.getState().currentStageIndex).toBe(7);

    // Stop demo cleanly
    controller.stop();
    expect(controller.getState().status).toBe('idle');
    expect(controller.getState().currentStageIndex).toBe(0);

    controller.destroy();
  });

  it('completes gracefully when reaching the final stage', () => {
    const controller = new VivaDemoController();
    controller.start();

    // Skip to last stage (Stage 10: Conclusion)
    controller.skipToStage(9);
    expect(controller.getState().currentStageIndex).toBe(9);

    // Advance past end
    const advanced = controller.nextStage();
    expect(advanced).toBe(false);
    expect(controller.getState().status).toBe('completed');

    controller.destroy();
  });
});
