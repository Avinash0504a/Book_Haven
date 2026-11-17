import React from 'react';
import { Spinner } from './Spinner.jsx';

export const Button = React.forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    isLoading = false,
    disabled = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary: 'bg-primary text-primary-fg hover:opacity-90 active:opacity-95 shadow-sm',
    secondary: 'bg-surface text-text hover:bg-border/40 border border-border',
    outline: 'border border-border bg-transparent text-text hover:bg-surface active:bg-surface/80',
    danger: 'bg-danger text-primary-fg hover:opacity-90 active:opacity-95',
    ghost: 'bg-transparent text-text hover:bg-surface active:bg-surface/80'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {(loading || isLoading) && <Spinner size="sm" className="shrink-0" />}
      {children}
    </button>
  );
});
