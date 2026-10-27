import React from 'react';

export interface PanelProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  elevated?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  badge,
  action,
  footer,
  elevated = false,
  className = '',
  children,
}) => {
  const hasHeader = Boolean(title || subtitle || badge || action);

  return (
    <section className={`sl-panel ${elevated ? 'sl-panel-elevated' : ''} ${className}`}>
      {hasHeader && (
        <header className="sl-panel-header">
          <div className="sl-panel-title-area">
            {title && <h2 className="sl-panel-title">{title}</h2>}
            {badge && <div className="sl-panel-badge">{badge}</div>}
            {subtitle && <span className="sl-panel-subtitle">{subtitle}</span>}
          </div>
          {action && <div className="sl-panel-action">{action}</div>}
        </header>
      )}
      <div className="sl-panel-body">{children}</div>
      {footer && <footer className="sl-panel-footer">{footer}</footer>}
    </section>
  );
};
