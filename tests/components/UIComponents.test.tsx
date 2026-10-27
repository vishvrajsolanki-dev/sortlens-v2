import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Button } from '../../src/components/ui/Button';
import { IconButton } from '../../src/components/ui/IconButton';
import { Badge } from '../../src/components/ui/Badge';
import { Panel } from '../../src/components/ui/Panel';
import { Tooltip } from '../../src/components/ui/Tooltip';
import { SectionHeading } from '../../src/components/ui/SectionHeading';
import { EngineStatusBadge } from '../../src/components/status/EngineStatusBadge';
import { useAppStore } from '../../src/state/appStore';

describe('UI Component Library', () => {
  describe('Button', () => {
    it('renders text and handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies variant classes and respects disabled prop', () => {
      const handleClick = vi.fn();
      render(
        <Button variant="danger" disabled onClick={handleClick}>
          Delete
        </Button>
      );

      const btn = screen.getByRole('button', { name: /delete/i });
      expect(btn).toHaveClass('sl-btn-danger');
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('IconButton', () => {
    it('renders with accessible name from ariaLabel', () => {
      render(
        <IconButton ariaLabel="Settings Panel">
          <span>⚙</span>
        </IconButton>
      );

      const btn = screen.getByRole('button', { name: /settings panel/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('aria-label', 'Settings Panel');
    });
  });

  describe('Badge', () => {
    it('renders with dot and variant classes', () => {
      render(
        <Badge variant="amber" withDot>
          PREDICTION
        </Badge>
      );

      const badge = screen.getByText(/prediction/i);
      expect(badge).toHaveClass('sl-badge-amber');
      expect(badge.querySelector('.sl-badge-dot')).not.toBeNull();
    });
  });

  describe('Panel', () => {
    it('renders title, badge, action and children', () => {
      render(
        <Panel
          title="Telemetry Analysis"
          badge={<Badge variant="cyan">LIVE</Badge>}
          action={<Button size="sm">Export</Button>}
          footer={<div>Footer Content</div>}
        >
          <p>Body Content</p>
        </Panel>
      );

      expect(screen.getByRole('heading', { level: 2, name: /telemetry analysis/i })).toBeInTheDocument();
      expect(screen.getByText(/live/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      expect(screen.getByText(/body content/i)).toBeInTheDocument();
      expect(screen.getByText(/footer content/i)).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('attaches aria-describedby on hover/focus', () => {
      render(
        <Tooltip content="Helper message">
          <button>Hover Target</button>
        </Tooltip>
      );

      const btn = screen.getByRole('button', { name: /hover target/i });
      expect(btn).not.toHaveAttribute('aria-describedby');

      fireEvent.mouseEnter(btn.parentElement!);
      expect(btn).toHaveAttribute('aria-describedby');
      expect(screen.getByRole('tooltip')).toHaveTextContent(/helper message/i);

      fireEvent.mouseLeave(btn.parentElement!);
      expect(btn).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('SectionHeading', () => {
    it('renders title and descriptive subtitle', () => {
      render(
        <SectionHeading
          title="Search Laboratory"
          badge={<Badge variant="indigo">PHASE 6</Badge>}
          description="Sequential and logarithmic search step exploration."
        />
      );

      expect(screen.getByRole('heading', { level: 1, name: /search laboratory/i })).toBeInTheDocument();
      expect(screen.getByText(/sequential and logarithmic search/i)).toBeInTheDocument();
    });
  });

  describe('EngineStatusBadge', () => {
    it('reflects initializing, ready, and error states dynamically', () => {
      const { rerender } = render(<EngineStatusBadge />);

      // Uninitialized
      act(() => {
        useAppStore.setState({ runtimeStatus: 'uninitialized' });
      });
      rerender(<EngineStatusBadge />);
      expect(screen.getByRole('status')).toHaveTextContent(/core uninitialized/i);

      // Initializing
      act(() => {
        useAppStore.setState({ runtimeStatus: 'initializing' });
      });
      rerender(<EngineStatusBadge />);
      expect(screen.getByRole('status')).toHaveTextContent(/core initializing/i);

      // Ready
      act(() => {
        useAppStore.setState({ runtimeStatus: 'ready' });
      });
      rerender(<EngineStatusBadge />);
      expect(screen.getByRole('status')).toHaveTextContent(/core ready/i);

      // Error
      act(() => {
        useAppStore.setState({ runtimeStatus: 'error', runtimeError: 'Failed to load module' });
      });
      rerender(<EngineStatusBadge />);
      expect(screen.getByRole('status')).toHaveTextContent(/runtime error/i);
    });
  });
});
