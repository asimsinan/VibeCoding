import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Badge } from './badge';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  description?: string;
  variant?: 'default' | 'gradient' | 'glass' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  variant = 'default',
  size = 'md',
}) => {
  const getChangeColor = () => {
    switch (change?.type) {
      case 'increase':
        return 'text-success-600 bg-success-50';
      case 'decrease':
        return 'text-error-600 bg-error-50';
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  const getChangeIcon = () => {
    switch (change?.type) {
      case 'increase':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        );
      case 'decrease':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-4',
          title: 'text-xs',
          value: 'text-lg',
          icon: 'w-4 h-4',
        };
      case 'lg':
        return {
          container: 'p-8',
          title: 'text-base',
          value: 'text-4xl',
          icon: 'w-8 h-8',
        };
      default:
        return {
          container: 'p-6',
          title: 'text-sm',
          value: 'text-3xl',
          icon: 'w-6 h-6',
        };
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-br from-primary-500 to-primary-700 text-white border-0 shadow-glow';
      case 'glass':
        return 'glass border-white/20 text-white backdrop-blur-md';
      case 'minimal':
        return 'bg-transparent border-neutral-200 shadow-none hover:shadow-card';
      default:
        return 'bg-white border-neutral-200 shadow-card hover:shadow-card-hover';
    }
  };

  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();

  return (
    <Card className={`${variantClasses} ${sizeClasses.container} hover-lift transition-all duration-300 group`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className={`${sizeClasses.title} font-medium ${variant === 'gradient' ? 'text-white group-hover:text-white' : 'text-neutral-600 group-hover:text-neutral-800'} transition-colors`}>
          {title}
        </CardTitle>
        {icon && (
          <div className={`${sizeClasses.icon} ${variant === 'gradient' ? 'text-white group-hover:text-white' : 'text-primary-500 group-hover:text-primary-600'} transition-colors`}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`${sizeClasses.value} font-bold ${variant === 'gradient' ? 'text-white group-hover:text-white' : 'text-neutral-900 group-hover:text-neutral-800'} transition-colors`}>
          {value}
        </div>
        {change && (
          <div className={`flex items-center text-xs px-2 py-1 rounded-full w-fit ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1 font-medium">{change.value}</span>
            <span className="ml-1 opacity-75">from last month</span>
          </div>
        )}
        {description && (
          <p className={`text-xs ${variant === 'gradient' ? 'text-white/80 group-hover:text-white' : 'text-neutral-500 group-hover:text-neutral-600'} transition-colors leading-relaxed`}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};


