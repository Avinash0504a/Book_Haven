import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-3 pb-2 border-b border-border ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', as: Component = 'h3', ...props }) {
  return (
    <Component className={`text-lg font-semibold text-text ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-4 pt-3 border-t border-border flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}
