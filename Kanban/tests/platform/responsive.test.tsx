/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useBreakpoint, useIsMobile, useIsTablet, useIsDesktop, useResponsiveValue } from '../../src/lib/responsive';

// Mock component for testing hooks
function TestComponent() {
  const breakpoint = useBreakpoint();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const responsiveValue = useResponsiveValue(
    { xs: 'small', sm: 'medium', md: 'large' },
    'default'
  );

  return (
    <div>
      <div data-testid="breakpoint">{breakpoint}</div>
      <div data-testid="is-mobile">{isMobile.toString()}</div>
      <div data-testid="is-tablet">{isTablet.toString()}</div>
      <div data-testid="is-desktop">{isDesktop.toString()}</div>
      <div data-testid="responsive-value">{responsiveValue}</div>
    </div>
  );
}

describe('Responsive Design Hooks', () => {
  beforeEach(() => {
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    // Mock addEventListener and removeEventListener
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  describe('useBreakpoint', () => {
    it('should return correct breakpoint for different screen sizes', () => {
      // Test mobile
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      render(<TestComponent />);
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('xs');

      // Test tablet
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      render(<TestComponent />);
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('md');

      // Test desktop
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      render(<TestComponent />);
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('xl');
    });

    it('should update breakpoint on window resize', () => {
      const { rerender } = render(<TestComponent />);
      
      // Initial size
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      rerender(<TestComponent />);
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('xs');

      // Resize to tablet
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      fireEvent(window, new Event('resize'));
      rerender(<TestComponent />);
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('md');
    });
  });

  describe('useIsMobile', () => {
    it('should return true for mobile screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      render(<TestComponent />);
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
    });

    it('should return false for tablet and desktop screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      render(<TestComponent />);
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
    });
  });

  describe('useIsTablet', () => {
    it('should return true for tablet screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      render(<TestComponent />);
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
    });

    it('should return false for mobile and desktop screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      render(<TestComponent />);
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');

      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      render(<TestComponent />);
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
    });
  });

  describe('useIsDesktop', () => {
    it('should return true for desktop screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      render(<TestComponent />);
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
    });

    it('should return false for mobile and tablet screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      render(<TestComponent />);
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');

      Object.defineProperty(window, 'innerWidth', { value: 800 });
      render(<TestComponent />);
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
    });
  });

  describe('useResponsiveValue', () => {
    it('should return correct value for current breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      render(<TestComponent />);
      expect(screen.getByTestId('responsive-value')).toHaveTextContent('small');

      Object.defineProperty(window, 'innerWidth', { value: 800 });
      render(<TestComponent />);
      expect(screen.getByTestId('responsive-value')).toHaveTextContent('large');
    });

    it('should return default value when no breakpoint matches', () => {
      Object.defineProperty(window, 'innerWidth', { value: 200 });
      render(<TestComponent />);
      expect(screen.getByTestId('responsive-value')).toHaveTextContent('default');
    });
  });
});
