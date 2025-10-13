import React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    const checkboxClasses = cn(
      'h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      error && 'border-error-500 focus:ring-error-500',
      className
    );

    return (
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          className={checkboxClasses}
          ref={ref}
          {...props}
        />
        <div className="flex-1">
          {label && (
            <label className="text-sm font-medium text-secondary-700">
              {label}
            </label>
          )}
          {error && (
            <p className="mt-1 text-sm text-error-600">{error}</p>
          )}
          {helperText && !error && (
            <p className="mt-1 text-sm text-secondary-500">{helperText}</p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };


