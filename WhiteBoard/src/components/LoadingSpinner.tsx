'use client'

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component with different sizes.
 * 
 * @param size - Size of the spinner (sm, md, lg)
 * @param className - Additional CSS classes
 */
export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]} ${className}`}>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
