import React from 'react';
import { cn } from '@/lib/utils';

export interface MainProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  background?: 'default' | 'gradient' | 'pattern';
}

const Main = React.forwardRef<HTMLElement, MainProps>(
  ({ className, children, padding = 'md', background = 'default', ...props }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const backgroundClasses = {
      default: 'bg-neutral-50',
      gradient: 'bg-gradient-to-br from-neutral-50 via-white to-primary-50',
      pattern: 'bg-neutral-50 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.15)_1px,transparent_0)] bg-[length:20px_20px]',
    };

    return (
      <main
        ref={ref}
        className={cn(
          'flex-1 overflow-auto min-h-screen transition-all duration-300',
          paddingClasses[padding],
          backgroundClasses[background],
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    );
  }
);

Main.displayName = 'Main';

export { Main };
