import React, { useState } from 'react';

export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = React.useId();

  return (
    <div
      className={`sl-tooltip-container ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {React.cloneElement(children, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      } as React.HTMLAttributes<HTMLElement>)}
      {isVisible && (
        <div id={tooltipId} role="tooltip" className="sl-tooltip-bubble">
          {content}
        </div>
      )}
    </div>
  );
};
