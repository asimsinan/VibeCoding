import React from 'react';
import { cn } from '@/lib/utils';

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '8xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = '6xl',
  padding = 'md',
  center = true,
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '8xl': 'max-w-8xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
    xl: 'px-8 sm:px-12 lg:px-16',
  };

  return (
    <div
      className={cn(
        'w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

export interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 'md',
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const getGridCols = () => {
    const classes = [];
    
    if (cols.default) {
      classes.push(`grid-cols-${cols.default}`);
    }
    if (cols.sm) {
      classes.push(`sm:grid-cols-${cols.sm}`);
    }
    if (cols.md) {
      classes.push(`md:grid-cols-${cols.md}`);
    }
    if (cols.lg) {
      classes.push(`lg:grid-cols-${cols.lg}`);
    }
    if (cols.xl) {
      classes.push(`xl:grid-cols-${cols.xl}`);
    }
    
    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        'grid',
        getGridCols(),
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

export interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: {
    default?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  };
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'gray';
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className,
  size = { default: 'base' },
  weight = 'normal',
  color = 'gray',
}) => {
  const getSizeClasses = () => {
    const classes = [];
    
    if (size.default) {
      classes.push(`text-${size.default}`);
    }
    if (size.sm) {
      classes.push(`sm:text-${size.sm}`);
    }
    if (size.md) {
      classes.push(`md:text-${size.md}`);
    }
    if (size.lg) {
      classes.push(`lg:text-${size.lg}`);
    }
    
    return classes.join(' ');
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    success: 'text-success-600',
    error: 'text-error-600',
    warning: 'text-warning-600',
    gray: 'text-gray-600',
  };

  return (
    <span
      className={cn(
        getSizeClasses(),
        weightClasses[weight],
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  );
};


