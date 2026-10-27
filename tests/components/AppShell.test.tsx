import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '../../src/components/layout/AppShell';
import { useAppStore } from '../../src/state/appStore';

describe('AppShell - Navigation, Layout, and Responsive Structure', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeSection: 'arena',
      sidebarCollapsed: false,
      mobileNavOpen: false,
      runtimeStatus: 'ready',
      arraySize: 30,
      datasetPattern: 'random',
    });
  });

  it('renders application brand, primary navigation, header, and arena workspace', () => {
    render(<AppShell />);

    // Brand
    expect(screen.getByLabelText(/sortlens home/i)).toBeInTheDocument();

    // Navigation items
    expect(screen.getByRole('menuitem', { name: /race arena/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /shape & cost model/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /search lab/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /scaling lab/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /viva demo mode/i })).toBeInTheDocument();

    // Default workspace is Arena
    expect(screen.getByRole('heading', { level: 1, name: /sortlens rebuild — 5-algorithm sorting arena/i })).toBeInTheDocument();
    expect(screen.getByText(/dataset configuration/i)).toBeInTheDocument();
  });

  it('switches between sections when clicking navigation items', () => {
    render(<AppShell />);

    // Switch to Shape & Cost Model
    const analysisNav = screen.getByRole('menuitem', { name: /shape & cost model/i });
    fireEvent.click(analysisNav);
    expect(screen.getByRole('heading', { level: 1, name: /dataset shape & cost model analyzer/i })).toBeInTheDocument();
    expect(screen.getByText(/analytical workbench/i)).toBeInTheDocument();

    // Switch to Search Lab
    const searchNav = screen.getByRole('menuitem', { name: /search lab/i });
    fireEvent.click(searchNav);
    expect(screen.getByRole('heading', { level: 1, name: /search laboratory/i })).toBeInTheDocument();
    expect(screen.getAllByText(/linear search/i).length).toBeGreaterThanOrEqual(1);

    // Switch back to Arena
    const arenaNav = screen.getByRole('menuitem', { name: /race arena/i });
    fireEvent.click(arenaNav);
    expect(screen.getByRole('heading', { level: 1, name: /sortlens rebuild — 5-algorithm sorting arena/i })).toBeInTheDocument();
  });

  it('toggles sidebar collapse state via header button', () => {
    render(<AppShell />);
    const collapseBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    const sidebar = screen.getByLabelText(/application sidebar/i);

    expect(sidebar).not.toHaveClass('sl-sidebar-collapsed');

    fireEvent.click(collapseBtn);
    expect(useAppStore.getState().sidebarCollapsed).toBe(true);
    expect(sidebar).toHaveClass('sl-sidebar-collapsed');
  });

  it('handles mobile navigation open and overlay dismiss', () => {
    render(<AppShell />);
    const mobileBtn = screen.getByRole('button', { name: /open navigation menu/i });

    // Open mobile menu
    fireEvent.click(mobileBtn);
    expect(useAppStore.getState().mobileNavOpen).toBe(true);

    // Click backdrop overlay to close
    const overlay = document.querySelector('.sl-mobile-nav-overlay');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);
    expect(useAppStore.getState().mobileNavOpen).toBe(false);
  });

  it('updates array size from dataset slider', () => {
    render(<AppShell />);
    const slider = screen.getByLabelText(/array size/i) as HTMLInputElement;

    expect(slider.value).toBe('30');
    fireEvent.change(slider, { target: { value: '55' } });
    expect(useAppStore.getState().arraySize).toBe(55);
  });
});
