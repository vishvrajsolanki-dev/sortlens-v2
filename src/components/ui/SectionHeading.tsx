import React from 'react';

export interface SectionHeadingProps {
  title: React.ReactNode;
  badge?: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  badge,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`sl-section-heading ${className}`}>
      <div className="sl-section-title-wrap">
        <div className="sl-section-title-row">
          <h1 className="sl-section-title">{title}</h1>
          {badge}
        </div>
        {description && <p className="sl-section-desc">{description}</p>}
      </div>
      {action && <div className="sl-section-action">{action}</div>}
    </div>
  );
};
