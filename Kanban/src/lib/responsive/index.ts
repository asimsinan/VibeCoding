/**
 * Responsive design utilities
 * Provides hooks and utilities for responsive behavior
 */

import { useState, useEffect, useCallback } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export const defaultBreakpoints: BreakpointConfig = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Get the current breakpoint based on window width
 */
export function getCurrentBreakpoint(width: number, breakpoints: BreakpointConfig = defaultBreakpoints): Breakpoint {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Check if a breakpoint is active
 */
export function isBreakpointActive(breakpoint: Breakpoint, width: number, breakpoints: BreakpointConfig = defaultBreakpoints): boolean {
  const currentBreakpoint = getCurrentBreakpoint(width, breakpoints);
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  const targetIndex = breakpointOrder.indexOf(breakpoint);
  return currentIndex >= targetIndex;
}

/**
 * Hook to get the current breakpoint
 */
export function useBreakpoint(breakpoints: BreakpointConfig = defaultBreakpoints): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs');

  useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint(getCurrentBreakpoint(window.innerWidth, breakpoints));
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, [breakpoints]);

  return breakpoint;
}

/**
 * Hook to check if a specific breakpoint is active
 */
export function useBreakpointActive(breakpoint: Breakpoint, breakpoints: BreakpointConfig = defaultBreakpoints): boolean {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const updateActive = () => {
      setIsActive(isBreakpointActive(breakpoint, window.innerWidth, breakpoints));
    };

    updateActive();
    window.addEventListener('resize', updateActive);
    return () => window.removeEventListener('resize', updateActive);
  }, [breakpoint, breakpoints]);

  return isActive;
}

/**
 * Hook to get responsive values based on breakpoint
 */
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T,
  breakpoints: BreakpointConfig = defaultBreakpoints
): T {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const updateValue = () => {
      const currentBreakpoint = getCurrentBreakpoint(window.innerWidth, breakpoints);
      const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
      
      // Find the closest defined value for the current or smaller breakpoint
      for (let i = currentIndex; i >= 0; i--) {
        const bp = breakpointOrder[i];
        if (values[bp] !== undefined) {
          setValue(values[bp]!);
          return;
        }
      }
      
      setValue(defaultValue);
    };

    updateValue();
    window.addEventListener('resize', updateValue);
    return () => window.removeEventListener('resize', updateValue);
  }, [values, defaultValue, breakpoints]);

  return value;
}

/**
 * Hook to detect if the device is mobile
 */
export function useIsMobile(): boolean {
  return useBreakpointActive('sm');
}

/**
 * Hook to detect if the device is tablet
 */
export function useIsTablet(): boolean {
  const isMobile = useBreakpointActive('sm');
  const isDesktop = useBreakpointActive('lg');
  return !isMobile && !isDesktop;
}

/**
 * Hook to detect if the device is desktop
 */
export function useIsDesktop(): boolean {
  return useBreakpointActive('lg');
}

/**
 * Hook to get responsive class names
 */
export function useResponsiveClasses(
  classMap: Partial<Record<Breakpoint, string>>,
  baseClasses: string = ''
): string {
  const breakpoint = useBreakpoint();
  const responsiveClasses = classMap[breakpoint] || '';
  return `${baseClasses} ${responsiveClasses}`.trim();
}

/**
 * Utility to create responsive class names
 */
export function createResponsiveClasses(
  classMap: Partial<Record<Breakpoint, string>>,
  baseClasses: string = ''
): string {
  const classes = [baseClasses];
  
  Object.entries(classMap).forEach(([breakpoint, className]) => {
    if (className) {
      classes.push(`${breakpoint}:${className}`);
    }
  });
  
  return classes.join(' ');
}

/**
 * Utility to get responsive values for CSS-in-JS
 */
export function getResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T,
  breakpoint: Breakpoint
): T {
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  // Find the closest defined value for the current or smaller breakpoint
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }
  
  return defaultValue;
}
