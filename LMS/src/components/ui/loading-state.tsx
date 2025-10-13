import React from 'react';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  children,
  fallback,
  size = 'md',
  text = 'Loading...',
  overlay = false,
  className,
  ...props
}) => {
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (overlay) {
      return (
        <div className={cn('relative', className)} {...props}>
          {children}
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <LoadingSpinner size={size} text={text} />
          </div>
        </div>
      );
    }

    return (
      <div className={cn('flex items-center justify-center p-8', className)} {...props}>
        <LoadingSpinner size={size} text={text} />
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingState;


