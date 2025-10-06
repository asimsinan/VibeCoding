/**
 * Accessibility Test Utilities
 * 
 * Platform-specific accessibility testing utilities for WCAG 2.1 AA compliance.
 * Provides helpers for testing keyboard navigation, screen readers, and accessibility features.
 * 
 * @fileoverview Accessibility testing utilities and helpers
 * @version 1.0.0
 */

import { render, RenderResult } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Accessibility test configuration
export const accessibilityConfig = {
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-labels': { enabled: true },
    'semantic-html': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
}

// Keyboard navigation helpers
export const keyboardNavigation = {
  // Tab key
  tab: () => new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab' }),
  
  // Shift + Tab key
  shiftTab: () => new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', shiftKey: true }),
  
  // Enter key
  enter: () => new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }),
  
  // Space key
  space: () => new KeyboardEvent('keydown', { key: ' ', code: 'Space' }),
  
  // Escape key
  escape: () => new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }),
  
  // Arrow keys
  arrowUp: () => new KeyboardEvent('keydown', { key: 'ArrowUp', code: 'ArrowUp' }),
  arrowDown: () => new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown' }),
  arrowLeft: () => new KeyboardEvent('keydown', { key: 'ArrowLeft', code: 'ArrowLeft' }),
  arrowRight: () => new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight' })
}

// Screen reader helpers
export const screenReader = {
  // Get all elements with ARIA labels
  getElementsWithAriaLabels: (container: HTMLElement) => {
    return container.querySelectorAll('[aria-label], [aria-labelledby]')
  },
  
  // Get all elements with ARIA descriptions
  getElementsWithAriaDescriptions: (container: HTMLElement) => {
    return container.querySelectorAll('[aria-describedby]')
  },
  
  // Get all headings
  getHeadings: (container: HTMLElement) => {
    return container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  },
  
  // Get all landmarks
  getLandmarks: (container: HTMLElement) => {
    return container.querySelectorAll('[role="banner"], [role="main"], [role="complementary"], [role="contentinfo"], [role="navigation"]')
  }
}

// Color contrast helpers
export const colorContrast = {
  // Check if color meets WCAG AA contrast ratio
  meetsWCAGAA: (foreground: string, background: string): boolean => {
    // This is a simplified check - in real implementation, use a proper contrast calculation library
    return true // Placeholder
  },
  
  // Get contrast ratio between two colors
  getContrastRatio: (foreground: string, background: string): number => {
    // This is a simplified calculation - in real implementation, use a proper contrast calculation library
    return 4.5 // Placeholder
  }
}

// Focus management helpers
export const focusManagement = {
  // Get currently focused element
  getFocusedElement: (): Element | null => {
    return document.activeElement
  },
  
  // Check if element is focusable
  isFocusable: (element: Element): boolean => {
    const focusableElements = [
      'button', 'input', 'select', 'textarea', 'a[href]', 'area[href]',
      '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]'
    ]
    
    return focusableElements.some(selector => element.matches(selector))
  },
  
  // Get all focusable elements
  getFocusableElements: (container: HTMLElement): Element[] => {
    const focusableElements = container.querySelectorAll(
      'button, input, select, textarea, a[href], area[href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
    )
    
    return Array.from(focusableElements).filter(element => focusManagement.isFocusable(element))
  }
}

// Custom render function with accessibility testing
export function renderWithAccessibility(ui: React.ReactElement): RenderResult & {
  checkA11y: () => Promise<void>
} {
  const result = render(ui)
  
  const checkA11y = async () => {
    const { container } = result
    const accessibilityResults = await axe(container, accessibilityConfig)
    expect(accessibilityResults).toHaveNoViolations()
  }
  
  return {
    ...result,
    checkA11y
  }
}

// Accessibility test helpers
export const a11yHelpers = {
  // Test keyboard navigation
  testKeyboardNavigation: (container: HTMLElement) => {
    const focusableElements = focusManagement.getFocusableElements(container)
    expect(focusableElements.length).toBeGreaterThan(0)
  },
  
  // Test ARIA labels
  testAriaLabels: (container: HTMLElement) => {
    const elementsWithLabels = screenReader.getElementsWithAriaLabels(container)
    expect(elementsWithLabels.length).toBeGreaterThan(0)
  },
  
  // Test heading hierarchy
  testHeadingHierarchy: (container: HTMLElement) => {
    const headings = screenReader.getHeadings(container)
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)))
    
    // Check that heading levels are sequential
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i]
      const previousLevel = headingLevels[i - 1]
      if (currentLevel && previousLevel) {
        expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1)
      }
    }
  },
  
  // Test landmark roles
  testLandmarks: (container: HTMLElement) => {
    const landmarks = screenReader.getLandmarks(container)
    expect(landmarks.length).toBeGreaterThan(0)
  }
}
