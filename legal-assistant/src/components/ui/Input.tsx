'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    error = false,
    errorMessage,
    size = 'md',
    fullWidth = true,
    className,
    disabled,
    ...props 
  }, ref) => {
    const sizes = {
      sm: 'py-2 px-3 text-sm',
      md: 'py-3 px-4 text-base',
      lg: 'py-4 px-5 text-lg',
    };

    const inputStyles = cn(
      'w-full rounded-lg border transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'placeholder:text-gray-400',
      sizes[size],
      fullWidth && 'w-full',
      error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
      !error && 'border-gray-300 focus:ring-turkish-blue focus:border-turkish-blue',
      disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
      className
    );

    return (
      <div className={cn('w-full', !fullWidth && 'inline-block')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={inputStyles}
          disabled={disabled}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

