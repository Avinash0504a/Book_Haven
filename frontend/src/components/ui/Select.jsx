import React from 'react';

export const Select = React.forwardRef(function Select(
  {
    label,
    error,
    helperText,
    id,
    options = [],
    className = '',
    required = false,
    children,
    ...props
  },
  ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-text mb-1">
          {label}
          {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
        className={`w-full rounded-lg border bg-bg text-text px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:bg-surface ${
          error ? 'border-danger focus:ring-danger' : 'border-border'
        } ${className}`}
        {...props}
      >
        {options.length > 0
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${selectId}-helper`} className="mt-1 text-xs text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
});
