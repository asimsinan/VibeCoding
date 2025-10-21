'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 ease-out
    focus:outline-none focus:ring-4 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-95 hover:scale-105
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
      hover:from-blue-700 hover:to-indigo-700 
      active:from-blue-800 active:to-indigo-800
      focus:ring-blue-500/50 shadow-lg hover:shadow-xl
      border border-blue-500/20
    `,
    secondary: `
      bg-gradient-to-r from-gray-600 to-slate-600 text-white 
      hover:from-gray-700 hover:to-slate-700 
      active:from-gray-800 active:to-slate-800
      focus:ring-gray-500/50 shadow-lg hover:shadow-xl
      border border-gray-500/20
    `,
    outline: `
      border-2 border-gray-300 text-gray-700 bg-white/80 backdrop-blur-sm
      hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg
      active:bg-gray-100 focus:ring-blue-500/50
      transition-all duration-200
    `,
    ghost: `
      text-gray-700 hover:bg-gray-100/80 active:bg-gray-200/80
      focus:ring-gray-500/50 backdrop-blur-sm
      hover:shadow-md transition-all duration-200
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-rose-600 text-white 
      hover:from-red-700 hover:to-rose-700 
      active:from-red-800 active:to-rose-800
      focus:ring-red-500/50 shadow-lg hover:shadow-xl
      border border-red-500/20
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'ghost',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800
      focus:ring-blue-500 shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800
      focus:ring-gray-500 shadow-sm hover:shadow-md
    `,
    outline: `
      border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100
      focus:ring-blue-500 hover:border-gray-400
    `,
    ghost: `
      text-gray-700 hover:bg-gray-100 active:bg-gray-200
      focus:ring-gray-500
    `,
    danger: `
      bg-red-600 text-white hover:bg-red-700 active:bg-red-800
      focus:ring-red-500 shadow-sm hover:shadow-md
    `
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        children
      )}
    </button>
  );
};

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`inline-flex rounded-lg border border-gray-300 overflow-hidden ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: `
              ${child.props.className || ''}
              ${index === 0 ? 'rounded-l-lg rounded-r-none' : ''}
              ${index === React.Children.count(children) - 1 ? 'rounded-r-lg rounded-l-none' : ''}
              ${index > 0 ? 'border-l-0' : ''}
            `
          });
        }
        return child;
      })}
    </div>
  );
};
