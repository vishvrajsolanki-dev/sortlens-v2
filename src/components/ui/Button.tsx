import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`sl-btn sl-btn-${variant} sl-btn-${size} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="sl-btn-icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
};
