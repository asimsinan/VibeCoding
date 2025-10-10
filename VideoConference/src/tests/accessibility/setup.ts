/**
 * Accessibility Test Setup
 * Global setup for accessibility testing
 */

import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

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

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
    color: '#000000',
    backgroundColor: '#ffffff',
    fontSize: '16px',
    fontWeight: '400',
    outline: 'none',
    boxShadow: 'none',
    borderStyle: 'none',
    visibility: 'visible',
    display: 'block',
  }),
});

// Mock focus and blur methods
HTMLElement.prototype.focus = jest.fn();
HTMLElement.prototype.blur = jest.fn();

// Mock scrollIntoView
HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock getBoundingClientRect
HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
}));

// Setup accessibility testing utilities
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset focus
  document.activeElement?.blur();
});

// Global accessibility test helpers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAccessibleName(): R;
      toHaveAccessibleDescription(): R;
      toBeAccessible(): R;
    }
  }
}

// Custom accessibility matchers
expect.extend({
  toHaveAccessibleName(received: HTMLElement) {
    const name = received.getAttribute('aria-label') || 
                 received.getAttribute('aria-labelledby') ||
                 received.textContent?.trim();
    
    if (name) {
      return {
        message: () => `Expected element to have accessible name`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected element to have accessible name, but it doesn't`,
        pass: false,
      };
    }
  },
  
  toHaveAccessibleDescription(received: HTMLElement) {
    const description = received.getAttribute('aria-describedby') ||
                       received.getAttribute('aria-description') ||
                       received.getAttribute('title');
    
    if (description) {
      return {
        message: () => `Expected element to have accessible description`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected element to have accessible description, but it doesn't`,
        pass: false,
      };
    }
  },
  
  toBeAccessible(received: HTMLElement) {
    const hasRole = received.hasAttribute('role') || 
                   ['button', 'link', 'textbox', 'checkbox', 'radio', 'slider'].includes(received.tagName.toLowerCase());
    const hasName = received.getAttribute('aria-label') || 
                   received.getAttribute('aria-labelledby') ||
                   received.textContent?.trim();
    
    if (hasRole && hasName) {
      return {
        message: () => `Expected element to be accessible`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected element to be accessible, but it's missing role or name`,
        pass: false,
      };
    }
  },
});

// Accessibility testing utilities
export const accessibilityTestUtils = {
  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    const isDisabled = element.hasAttribute('disabled');
    const isHidden = element.hasAttribute('hidden') || 
                    element.style.display === 'none' || 
                    element.style.visibility === 'hidden';
    
    return !isDisabled && !isHidden && (
      tabIndex !== '-1' || 
      ['button', 'link', 'input', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase())
    );
  },
  
  // Get all focusable elements
  getFocusableElements: (container: HTMLElement = document.body): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="textbox"]:not([disabled])',
      '[role="checkbox"]:not([disabled])',
      '[role="radio"]:not([disabled])',
      '[role="slider"]:not([disabled])',
    ];
    
    const elements: HTMLElement[] = [];
    focusableSelectors.forEach(selector => {
      elements.push(...Array.from(container.querySelectorAll(selector)) as HTMLElement[]);
    });
    
    return elements.filter(element => accessibilityTestUtils.isFocusable(element));
  },
  
  // Check color contrast
  checkColorContrast: (foreground: string, background: string): number => {
    // Simplified contrast calculation
    // In real implementation, use a proper color contrast library
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb1 = hexToRgb(foreground);
    const rgb2 = hexToRgb(background);
    
    if (!rgb1 || !rgb2) return 1;
    
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },
  
  // Check if element has proper ARIA attributes
  hasProperARIA: (element: HTMLElement): boolean => {
    const role = element.getAttribute('role');
    const label = element.getAttribute('aria-label');
    const labelledBy = element.getAttribute('aria-labelledby');
    const describedBy = element.getAttribute('aria-describedby');
    
    // Check if element has proper labeling
    const hasLabel = label || labelledBy || element.textContent?.trim();
    
    // Check if interactive elements have proper ARIA
    if (['button', 'link', 'textbox', 'checkbox', 'radio', 'slider'].includes(role || '')) {
      return hasLabel !== null && hasLabel.length > 0;
    }
    
    return true;
  },
};
