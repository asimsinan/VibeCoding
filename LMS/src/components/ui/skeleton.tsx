import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = true,
  animate = true,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-gray-200',
        rounded && 'rounded',
        animate && 'animate-pulse',
        className
      )}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
      {...props}
    />
  );
};

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  lineHeight?: string | number;
  spacing?: string | number;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = '1rem',
  spacing = '0.5rem',
  className,
  ...props
}) => {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
};

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  showAvatar?: boolean;
  showTitle?: boolean;
  showContent?: boolean;
  showActions?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = true,
  showTitle = true,
  showContent = true,
  showActions = true,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-6 border border-gray-200 rounded-lg', className)} {...props}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <Skeleton width="3rem" height="3rem" rounded />
        )}
        <div className="flex-1 space-y-3">
          {showTitle && (
            <Skeleton height="1.5rem" width="60%" />
          )}
          {showContent && (
            <SkeletonText lines={2} />
          )}
          {showActions && (
            <div className="flex space-x-2">
              <Skeleton width="5rem" height="2rem" />
              <Skeleton width="5rem" height="2rem" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Skeleton;


