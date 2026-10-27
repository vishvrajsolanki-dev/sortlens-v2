import React from 'react';
import { useAppStore, type NavigationSection } from '../../state/appStore';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';

interface NavItem {
  id: NavigationSection;
  label: string;
  badge?: string;
  badgeVariant?: 'neutral' | 'amber' | 'cyan' | 'emerald' | 'rose' | 'indigo' | 'violet';
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'arena',
    label: 'Race Arena',
    badge: 'CORE',
    badgeVariant: 'violet',
    icon: '⚡',
  },
  {
    id: 'analysis',
    label: 'Shape & Cost Model',
    badge: 'PHASE 5',
    badgeVariant: 'neutral',
    icon: '📊',
  },
  {
    id: 'search',
    label: 'Search Lab',
    badge: 'PHASE 6',
    badgeVariant: 'neutral',
    icon: '🔍',
  },
  {
    id: 'scaling',
    label: 'Scaling Lab',
    badge: 'PHASE 6',
    badgeVariant: 'neutral',
    icon: '📈',
  },
  {
    id: 'viva',
    label: 'Viva Demo Mode',
    badge: 'PHASE 6',
    badgeVariant: 'neutral',
    icon: '🎓',
  },
];

export const PrimaryNavigation: React.FC = () => {
  const activeSection = useAppStore((s) => s.activeSection);
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);

  return (
    <nav className="sl-primary-nav" aria-label="Main Navigation">
      <ul className="sl-nav-list" role="menubar">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const button = (
            <button
              role="menuitem"
              aria-current={isActive ? 'page' : undefined}
              className={`sl-nav-item-btn ${isActive ? 'sl-nav-item-active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="sl-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="sl-nav-label">{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant ?? 'neutral'} className="sl-nav-badge">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </button>
          );

          return (
            <li key={item.id} role="none">
              {collapsed ? (
                <Tooltip content={item.label}>
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
