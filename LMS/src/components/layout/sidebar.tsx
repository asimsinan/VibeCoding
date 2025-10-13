import React from 'react';
import { cn } from '@/lib/utils';

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  variant?: 'default' | 'glass' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, isOpen = true, onClose, variant = 'default', size = 'md', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white border-neutral-200',
      glass: 'bg-white/95 backdrop-blur-md border-primary-200 text-neutral-900 shadow-lg',
      minimal: 'bg-primary-50 border-primary-200',
    };

    const sizeClasses = {
      sm: 'w-56',
      md: 'w-64',
      lg: 'w-72',
    };

    return (
      <>
        {/* Mobile backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
        
        {/* Sidebar */}
        <aside
          ref={ref}
          className={cn(
            'fixed left-0 top-0 z-50 h-full transform border-r transition-all duration-300 ease-in-out lg:static lg:translate-x-0 shadow-lg lg:shadow-none',
            sizeClasses[size],
            variantClasses[variant],
            isOpen ? 'translate-x-0' : '-translate-x-full',
            className
          )}
          {...props}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-6 px-4">
              {children}
            </div>
          </div>
        </aside>
      </>
    );
  }
);

Sidebar.displayName = 'Sidebar';

export { Sidebar };


