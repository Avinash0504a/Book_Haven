import React from 'react';

import { Button } from './Button.jsx';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-surface border border-border rounded-xl ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-border/30 flex items-center justify-center text-muted mb-4">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-4">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
      {!action && actionLabel && onAction && (
        <div className="mt-2">
          <Button type="button" variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
