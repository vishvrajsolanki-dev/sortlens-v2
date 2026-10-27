import React, { forwardRef } from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel: string;
  size?: 'sm' | 'md';
  tooltip?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, ariaLabel, size = 'md', tooltip, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`sl-icon-btn sl-icon-btn-${size} ${className}`}
        aria-label={ariaLabel}
        title={tooltip || ariaLabel}
        {...props}
      >
        <span aria-hidden="true" style={{ display: 'inline-flex' }}>
          {children}
        </span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
