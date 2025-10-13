import React from 'react';
import { cn } from '@/lib/utils';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  sticky?: boolean;
  variant?: 'default' | 'glass' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, children, sticky = false, variant = 'default', size = 'md', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white border-neutral-200 text-neutral-900',
      glass: 'bg-white/90 backdrop-blur-md border-white/20 text-neutral-900',
      gradient: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-500 shadow-lg',
    };

    const sizeClasses = {
      sm: 'py-3',
      md: 'py-4',
      lg: 'py-6',
    };

    return (
      <header
        ref={ref}
        className={cn(
          'border-b transition-all duration-300',
          variantClasses[variant],
          sizeClasses[size],
          sticky && 'sticky top-0 z-40 shadow-lg',
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';

export { Header };


