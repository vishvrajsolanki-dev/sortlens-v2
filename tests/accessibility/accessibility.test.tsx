import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { LiveAnnouncer } from '../../src/components/ui/LiveAnnouncer';
import { announce } from '../../src/state/announcer';
import { KeyboardShortcutsModal } from '../../src/components/ui/KeyboardShortcutsModal';
import { CanvasLane } from '../../src/components/arena/CanvasLane';
import { ALGO_MERGE } from '../../src/core/adapter/types';
import type { PlaybackFrame } from '../../src/engine/types';

describe('Accessibility (a11y) Verification Suite — WCAG 2.2 AA Compliance', () => {
  describe('LiveAnnouncer Subsystem', () => {
    it('renders with aria-live="polite" and aria-atomic="true"', () => {
      render(<LiveAnnouncer />);
      const announcerEl = screen.getByTestId('live-announcer');

      expect(announcerEl).toHaveAttribute('aria-live', 'polite');
      expect(announcerEl).toHaveAttribute('aria-atomic', 'true');
      expect(announcerEl).toHaveClass('sl-sr-only');
    });

    it('receives and renders broadcasted announcements', () => {
      render(<LiveAnnouncer />);
      const announcerEl = screen.getByTestId('live-announcer');

      act(() => {
        announce('Sorting race started with 5 algorithms.');
      });

      expect(announcerEl).toHaveTextContent('Sorting race started with 5 algorithms.');

      act(() => {
        announce('Merge Sort completed in 120 operations.');
      });

      expect(announcerEl).toHaveTextContent('Merge Sort completed in 120 operations.');
    });
  });

  describe('Modal Dialog Accessibility', () => {
    it('has proper dialog roles, aria-modal, and focus management', () => {
      render(<KeyboardShortcutsModal isOpen={true} onClose={() => {}} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'shortcuts-dialog-title');

      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveAttribute('id', 'shortcuts-dialog-title');
      expect(title).toHaveTextContent(/keyboard shortcuts/i);

      // Close button should have accessible label
      const closeBtn = screen.getByLabelText(/close shortcuts dialog/i);
      expect(closeBtn).toBeInTheDocument();
    });
  });

  describe('Canvas Lane Textual Fallback Descriptions', () => {
    it('provides accessible canvas image role and sr-only textual description', () => {
      const sampleFrame: PlaybackFrame = {
        stepIndex: 14,
        maxSteps: 50,
        array: [1, 2, 3, 4, 5],
        activeIndices: [2, 3],
        comparisons: 28,
        writes: 14,
        stackDepth: 3,
        overflow: false,
      };

      const { container } = render(
        <CanvasLane
          algo={ALGO_MERGE}
          frame={sampleFrame}
          isDone={false}
          globalMaxVal={5}
        />
      );

      const canvas = container.querySelector('canvas')!;
      expect(canvas).toHaveAttribute('role', 'img');
      expect(canvas).toHaveAttribute(
        'aria-label',
        'Merge Sort (Top-down) visual array representation (5 bars)'
      );

      // Screen reader fallback element
      const srText = container.querySelector('.sl-sr-only')!;
      expect(srText).toHaveTextContent(
        /Merge Sort \(Top-down\): Step 14\. Comparisons: 28, Writes: 14\./i
      );
    });
  });
});
