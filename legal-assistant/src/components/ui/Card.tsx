'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'gradient';
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  gradient?: boolean;
  constrained?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'default',
    elevation = 'lg',
    padding = 'md',
    gradient = false,
    constrained = false,
    className,
    onClick,
    children,
    ...props 
  }, ref) => {
    const baseStyles = 'rounded-xl border transition-all duration-300 animate-fade-in';
    
    const variants = {
      default: 'bg-white border-gray-100',
      primary: 'bg-white border-turkish-blue border-2',
      gradient: 'bg-gradient-card',
    };

    const elevations = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    };

    const paddings = {
      none: '',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          elevations[elevation],
          paddings[padding],
          gradient && 'bg-gradient-card',
          constrained && 'max-w-4xl mx-auto',
          onClick && 'cursor-pointer hover:shadow-xl',
          !onClick && 'hover:shadow-xl',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(e as any);
          }
        } : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

