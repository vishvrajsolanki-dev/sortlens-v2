import React from 'react';
import { useAppStore, type NavigationSection } from '../../state/appStore';
import { IconButton } from '../ui/IconButton';
import { EngineStatusBadge } from '../status/EngineStatusBadge';

const SECTION_TITLES: Record<NavigationSection, string> = {
  arena: 'Race Arena',
  analysis: 'Shape & Cost Model',
  search: 'Search Lab',
  scaling: 'Scaling Lab',
  viva: 'Viva Demo Mode',
};

export interface AppHeaderProps {
  onOpenShortcuts?: () => void;
  onOpenHistory?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenShortcuts, onOpenHistory }) => {
  const activeSection = useAppStore((s) => s.activeSection);
  const mobileNavOpen = useAppStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <header className="sl-app-header">
      <div className="sl-header-left">
        <IconButton
          ariaLabel={mobileNavOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          className="sl-mobile-nav-trigger"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
        >
          {mobileNavOpen ? '✕' : '☰'}
        </IconButton>

        <IconButton
          ariaLabel={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          onClick={toggleSidebar}
          size="sm"
          className="sl-collapse-trigger"
        >
          {sidebarCollapsed ? '▶' : '◀'}
        </IconButton>

        <nav aria-label="Breadcrumb" className="sl-header-breadcrumb">
          <span className="sl-breadcrumb-root">SortLens</span>
          <span className="sl-breadcrumb-sep" aria-hidden="true">/</span>
          <span className="sl-breadcrumb-current">{SECTION_TITLES[activeSection]}</span>
        </nav>
      </div>

      <div className="sl-header-right">
        {onOpenHistory && (
          <button
            type="button"
            className="sl-btn sl-btn-secondary sl-btn-sm"
            onClick={onOpenHistory}
            aria-label="View Telemetry History"
            title="Telemetry History (H)"
          >
            <span>📜</span>
            <span style={{ fontSize: '12px' }}>History</span>
          </button>
        )}

        {onOpenShortcuts && (
          <IconButton
            ariaLabel="Keyboard shortcuts guide"
            onClick={onOpenShortcuts}
            size="sm"
            title="Shortcuts (?)"
          >
            ⌨️
          </IconButton>
        )}

        <EngineStatusBadge />
      </div>
    </header>
  );
};
