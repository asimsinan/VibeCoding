/**
 * Responsive Design Utilities
 * 
 * Provides utilities for responsive design including:
 * - Breakpoint management
 * - Mobile-first approach
 * - Responsive utilities
 * - Device detection
 * 
 * @fileoverview Responsive Design Utilities for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

'use client'

import React from 'react'

// Breakpoint definitions
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export type Breakpoint = keyof typeof breakpoints

// Device types
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

// Responsive utilities
export class ResponsiveUtils {
  private static instance: ResponsiveUtils
  private currentBreakpoint: Breakpoint = 'md'
  private currentDeviceType: DeviceType = 'desktop'
  private listeners: Set<(breakpoint: Breakpoint, deviceType: DeviceType) => void> = new Set()

  private constructor() {
    if (typeof window !== 'undefined') {
      this.updateBreakpoint()
      window.addEventListener('resize', this.handleResize.bind(this))
    }
  }

  static getInstance(): ResponsiveUtils {
    if (!ResponsiveUtils.instance) {
      ResponsiveUtils.instance = new ResponsiveUtils()
    }
    return ResponsiveUtils.instance
  }

  private handleResize = () => {
    this.updateBreakpoint()
  }

  private updateBreakpoint() {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    let newBreakpoint: Breakpoint = 'xs'
    let newDeviceType: DeviceType = 'mobile'

    if (width >= parseInt(breakpoints['2xl'])) {
      newBreakpoint = '2xl'
      newDeviceType = 'desktop'
    } else if (width >= parseInt(breakpoints.xl)) {
      newBreakpoint = 'xl'
      newDeviceType = 'desktop'
    } else if (width >= parseInt(breakpoints.lg)) {
      newBreakpoint = 'lg'
      newDeviceType = 'desktop'
    } else if (width >= parseInt(breakpoints.md)) {
      newBreakpoint = 'md'
      newDeviceType = 'tablet'
    } else if (width >= parseInt(breakpoints.sm)) {
      newBreakpoint = 'sm'
      newDeviceType = 'mobile'
    } else {
      newBreakpoint = 'xs'
      newDeviceType = 'mobile'
    }

    if (newBreakpoint !== this.currentBreakpoint || newDeviceType !== this.currentDeviceType) {
      this.currentBreakpoint = newBreakpoint
      this.currentDeviceType = newDeviceType
      this.notifyListeners()
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.currentBreakpoint, this.currentDeviceType)
    })
  }

  // Public methods
  getCurrentBreakpoint(): Breakpoint {
    return this.currentBreakpoint
  }

  getCurrentDeviceType(): DeviceType {
    return this.currentDeviceType
  }

  isMobile(): boolean {
    return this.currentDeviceType === 'mobile'
  }

  isTablet(): boolean {
    return this.currentDeviceType === 'tablet'
  }

  isDesktop(): boolean {
    return this.currentDeviceType === 'desktop'
  }

  isBreakpoint(breakpoint: Breakpoint): boolean {
    return this.currentBreakpoint === breakpoint
  }

  isBreakpointOrAbove(breakpoint: Breakpoint): boolean {
    const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpointOrder.indexOf(this.currentBreakpoint)
    const targetIndex = breakpointOrder.indexOf(breakpoint)
    return currentIndex >= targetIndex
  }

  isBreakpointOrBelow(breakpoint: Breakpoint): boolean {
    const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpointOrder.indexOf(this.currentBreakpoint)
    const targetIndex = breakpointOrder.indexOf(breakpoint)
    return currentIndex <= targetIndex
  }

  subscribe(listener: (breakpoint: Breakpoint, deviceType: DeviceType) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Utility methods for responsive classes
  getResponsiveClasses(baseClasses: string, responsiveClasses: Partial<Record<Breakpoint, string>>): string {
    let classes = baseClasses

    Object.entries(responsiveClasses).forEach(([breakpoint, className]) => {
      if (className && this.isBreakpointOrAbove(breakpoint as Breakpoint)) {
        classes += ` ${className}`
      }
    })

    return classes
  }

  // Media query helpers
  getMediaQuery(breakpoint: Breakpoint, direction: 'up' | 'down' = 'up'): string {
    const width = breakpoints[breakpoint]
    if (direction === 'up') {
      return `(min-width: ${width})`
    } else {
      return `(max-width: ${parseInt(width) - 1}px)`
    }
  }

  // Responsive values
  getResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
    const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    
    for (let i = breakpointOrder.indexOf(this.currentBreakpoint); i >= 0; i--) {
      const breakpoint = breakpointOrder[i]
      if (values[breakpoint] !== undefined) {
        return values[breakpoint]!
      }
    }
    
    return defaultValue
  }
}

// Export singleton instance
export const responsiveUtils = ResponsiveUtils.getInstance()

// React hook for responsive design
export function useResponsive() {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(responsiveUtils.getCurrentBreakpoint())
  const [deviceType, setDeviceType] = React.useState<DeviceType>(responsiveUtils.getCurrentDeviceType())

  React.useEffect(() => {
    const unsubscribe = responsiveUtils.subscribe((newBreakpoint, newDeviceType) => {
      setBreakpoint(newBreakpoint)
      setDeviceType(newDeviceType)
    })

    return unsubscribe
  }, [])

  return {
    breakpoint,
    deviceType,
    isMobile: responsiveUtils.isMobile(),
    isTablet: responsiveUtils.isTablet(),
    isDesktop: responsiveUtils.isDesktop(),
    isBreakpoint: responsiveUtils.isBreakpoint.bind(responsiveUtils),
    isBreakpointOrAbove: responsiveUtils.isBreakpointOrAbove.bind(responsiveUtils),
    isBreakpointOrBelow: responsiveUtils.isBreakpointOrBelow.bind(responsiveUtils),
    getResponsiveValue: responsiveUtils.getResponsiveValue.bind(responsiveUtils),
  }
}

// Responsive component wrapper
export interface ResponsiveProps {
  children: React.ReactNode
  breakpoint?: Breakpoint
  deviceType?: DeviceType
  direction?: 'up' | 'down'
  fallback?: React.ReactNode
}

export const Responsive: React.FC<ResponsiveProps> = ({
  children,
  breakpoint,
  deviceType,
  direction = 'up',
  fallback = null
}) => {
  const { isBreakpointOrAbove, isBreakpointOrBelow, deviceType: currentDeviceType } = useResponsive()

  const shouldRender = React.useMemo(() => {
    if (deviceType) {
      return currentDeviceType === deviceType
    }

    if (breakpoint) {
      if (direction === 'up') {
        return isBreakpointOrAbove(breakpoint)
      } else {
        return isBreakpointOrBelow(breakpoint)
      }
    }

    return true
  }, [breakpoint, deviceType, direction, isBreakpointOrAbove, isBreakpointOrBelow, currentDeviceType])

  return shouldRender ? <>{children}</> : <>{fallback}</>
}

// Responsive grid component
export interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: Partial<Record<Breakpoint, number>>
  gap?: Partial<Record<Breakpoint, string>>
  className?: string
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = { xs: '4', sm: '6', md: '8' },
  className = ''
}) => {
  const { getResponsiveValue } = useResponsive()

  const gridCols = getResponsiveValue(cols, 1)
  const gridGap = getResponsiveValue(gap, '4')

  const gridClasses = `grid grid-cols-${gridCols} gap-${gridGap} ${className}`

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

// Responsive text component
export interface ResponsiveTextProps {
  children: React.ReactNode
  size?: Partial<Record<Breakpoint, string>>
  className?: string
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = { xs: 'text-sm', sm: 'text-base', md: 'text-lg' },
  className = ''
}) => {
  const { getResponsiveValue } = useResponsive()

  const textSize = getResponsiveValue(size, 'text-base')

  return (
    <span className={`${textSize} ${className}`}>
      {children}
    </span>
  )
}
