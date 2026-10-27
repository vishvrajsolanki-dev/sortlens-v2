import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'amber' | 'cyan' | 'emerald' | 'rose' | 'indigo' | 'violet';
  withDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  withDot = false,
  className = '',
}) => {
  return (
    <span className={`sl-badge sl-badge-${variant} ${className}`}>
      {withDot && <span className="sl-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
};
