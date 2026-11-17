import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button.jsx';

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  className = ''
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 text-center bg-danger/5 border border-danger/20 rounded-xl ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
