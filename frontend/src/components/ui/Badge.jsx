import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '', ...props }) {
  const variants = {
    default: 'bg-surface text-text border border-border',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-success/10 text-success border border-success/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    dangerSolid: 'bg-danger text-primary-fg border border-danger shadow-md font-bold',
    warning: 'bg-warning/10 text-warning border border-warning/20'
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-md font-semibold',
    lg: 'text-sm px-3 py-1.5 rounded-lg font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 ${variants[variant] || variants.default} ${
        sizes[size] || sizes.md
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
