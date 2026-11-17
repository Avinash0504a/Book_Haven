import React from 'react';

export const Input = React.forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    className = '',
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text mb-1">
          {label}
          {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`w-full rounded-lg border bg-bg text-text px-3 py-2 text-sm placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:bg-surface ${
          error ? 'border-danger focus:ring-danger' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="mt-1 text-xs text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
});
