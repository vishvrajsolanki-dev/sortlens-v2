import React, { useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { PrimaryNavigation } from './PrimaryNavigation';
import { AppHeader } from './AppHeader';
import { WorkspaceFrame } from './WorkspaceFrame';
import { LiveAnnouncer } from '../ui/LiveAnnouncer';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal';
import { HistoryModal } from '../history/HistoryModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

import type { CoreClient } from '../../core/adapter/types';

export interface AppShellProps {
  client?: CoreClient | null;
}

export const AppShell: React.FC<AppShellProps> = ({ client = null }) => {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const mobileNavOpen = useAppStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen);

  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  const isAnyModalOpen = shortcutsOpen || historyOpen;

  useKeyboardShortcuts({
    onToggleShortcutsModal: () => setShortcutsOpen((prev) => !prev),
    onToggleHistoryModal: () => setHistoryOpen((prev) => !prev),
    onCloseModals: () => {
      setShortcutsOpen(false);
      setHistoryOpen(false);
    },
    isAnyModalOpen,
  });

  return (
    <div className="sl-app-shell">
      {/* Screen Reader Live Announcements */}
      <LiveAnnouncer />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* Telemetry Run History Dialog */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          className="sl-mobile-nav-overlay"
          aria-hidden="true"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`sl-sidebar ${sidebarCollapsed ? 'sl-sidebar-collapsed' : ''} ${
          mobileNavOpen ? 'sl-sidebar-mobile-open' : ''
        }`}
        aria-label="Application Sidebar"
      >
        <div className="sl-sidebar-brand">
          <a href="#" className="sl-brand-logo" aria-label="SortLens Home">
            <div className="sl-brand-icon">SL</div>
            {!sidebarCollapsed && (
              <span className="sl-brand-text">
                SortLens <span className="sl-brand-ver">v2.0</span>
              </span>
            )}
          </a>
        </div>

        <PrimaryNavigation />

        <div className="sl-sidebar-footer">
          {!sidebarCollapsed && (
            <p className="sl-text-xs sl-text-muted" style={{ padding: '0 8px' }}>
              Academic Data Structures Lab
            </p>
          )}
        </div>
      </aside>

      {/* Viewport: Header + Main */}
      <div className="sl-main-viewport">
        <AppHeader
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
        />
        <WorkspaceFrame client={client} />
      </div>
    </div>
  );
};
