import React from 'react';
import { cn } from '@/lib/utils';

export interface RadioGroupProps {
  label?: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export interface RadioItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, label, error, helperText, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {label && (
          <label className="text-sm font-medium text-secondary-700">
            {label}
          </label>
        )}
        <div className="space-y-2">
          {children}
        </div>
        {error && (
          <p className="text-sm text-error-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-secondary-500">{helperText}</p>
        )}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

const RadioItem = React.forwardRef<HTMLInputElement, RadioItemProps>(
  ({ className, label, value, ...props }, ref) => {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          value={value}
          className={cn(
            'h-4 w-4 border-secondary-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            className
          )}
          ref={ref}
          {...props}
        />
        <label className="text-sm text-secondary-700">
          {label}
        </label>
      </div>
    );
  }
);

RadioItem.displayName = 'RadioItem';

export { RadioGroup, RadioItem };


