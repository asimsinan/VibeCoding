/**
 * @jest-environment jsdom
 */

import { detectBrowser, detectFeatures, checkBrowserSupport, getCompatibilityWarnings } from '../../src/lib/browser-compatibility';

// Mock navigator for testing
const mockNavigator = (userAgent: string, features: Record<string, any> = {}) => {
  Object.defineProperty(window, 'navigator', {
    value: {
      userAgent,
      ...features,
    },
    writable: true,
    configurable: true,
  });
};

// Mock window features
const mockWindowFeatures = (features: Record<string, any> = {}) => {
  Object.defineProperty(window, 'window', {
    value: {
      ...window,
      ...features,
    },
    writable: true,
    configurable: true,
  });
};

describe('Browser Compatibility', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock CSS.supports
    Object.defineProperty(window, 'CSS', {
      value: {
        supports: jest.fn().mockReturnValue(true),
      },
      writable: true,
      configurable: true,
    });
  });

  describe('detectBrowser', () => {
    it('should detect Chrome browser', () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const browser = detectBrowser();
      expect(browser.name).toBe('chrome');
      expect(browser.version).toBe('91');
    });

    it('should detect Firefox browser', () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0');
      
      const browser = detectBrowser();
      expect(browser.name).toBe('firefox');
      expect(browser.version).toBe('89');
    });

    it('should detect Safari browser', () => {
      mockNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15');
      
      const browser = detectBrowser();
      expect(browser.name).toBe('safari');
      expect(browser.version).toBe('14');
    });

    it('should detect Edge browser', () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59');
      
      const browser = detectBrowser();
      expect(browser.name).toBe('edge');
      expect(browser.version).toBe('91');
    });

    it('should handle unknown browser', () => {
      mockNavigator('Unknown Browser/1.0');
      
      const browser = detectBrowser();
      expect(browser.name).toBe('unknown');
      expect(browser.version).toBe('0');
    });
  });

  describe('detectFeatures', () => {
    it('should detect modern JavaScript features', () => {
      mockWindowFeatures({
        HTMLScriptElement: {
          prototype: { noModule: true }
        },
        Promise: {},
        fetch: () => {},
        Worker: () => {},
        WebSocket: () => {},
      });

      const features = detectFeatures();
      expect(features.es6Modules).toBe(true);
      expect(features.promises).toBe(true);
      expect(features.fetch).toBe(true);
      expect(features.webWorkers).toBe(true);
      expect(features.webSockets).toBe(true);
    });

    it('should detect DOM features', () => {
      mockWindowFeatures({
        customElements: {},
        IntersectionObserver: () => {},
        ResizeObserver: () => {},
        MutationObserver: () => {},
      });

      // Mock Element prototype
      Object.defineProperty(Element.prototype, 'attachShadow', {
        value: () => ({}),
        writable: true,
        configurable: true,
      });

      const features = detectFeatures();
      expect(features.customElements).toBe(true);
      expect(features.shadowDOM).toBe(true);
      expect(features.intersectionObserver).toBe(true);
      expect(features.resizeObserver).toBe(true);
      expect(features.mutationObserver).toBe(true);
    });

    it('should detect CSS features', () => {
      // Mock CSS.supports
      Object.defineProperty(window, 'CSS', {
        value: {
          supports: (property: string, value: string) => {
            if (property === 'display' && value === 'grid') return true;
            if (property === 'display' && value === 'flex') return true;
            if (property === '--custom' && value === 'value') return true;
            if (property === 'backdrop-filter' && value === 'blur(10px)') return true;
            return false;
          }
        },
        writable: true,
        configurable: true,
      });

      const features = detectFeatures();
      expect(features.cssGrid).toBe(true);
      expect(features.cssFlexbox).toBe(true);
      expect(features.cssCustomProperties).toBe(true);
      expect(features.cssBackdropFilter).toBe(true);
    });

    it('should detect storage features', () => {
      mockWindowFeatures({
        localStorage: {},
        sessionStorage: {},
        indexedDB: {},
      });

      const features = detectFeatures();
      expect(features.localStorage).toBe(true);
      expect(features.sessionStorage).toBe(true);
      expect(features.indexedDB).toBe(true);
    });

    it('should detect performance features', () => {
      mockWindowFeatures({
        performance: {},
        requestAnimationFrame: () => {},
        requestIdleCallback: () => {},
      });

      const features = detectFeatures();
      expect(features.performance).toBe(true);
      expect(features.requestAnimationFrame).toBe(true);
      expect(features.requestIdleCallback).toBe(true);
    });
  });

  describe('checkBrowserSupport', () => {
    it('should return true for supported browsers', () => {
      const features = {
        es6Modules: true,
        asyncAwait: true,
        fetch: true,
        promises: true,
        localStorage: true,
        cssFlexbox: true,
        intersectionObserver: true,
      };

      expect(checkBrowserSupport('chrome', '91', features)).toBe(true);
      expect(checkBrowserSupport('firefox', '89', features)).toBe(true);
      expect(checkBrowserSupport('safari', '14', features)).toBe(true);
      expect(checkBrowserSupport('edge', '91', features)).toBe(true);
    });

    it('should return false for unsupported browsers', () => {
      const features = {
        es6Modules: true,
        asyncAwait: true,
        fetch: true,
        promises: true,
        localStorage: true,
        cssFlexbox: true,
        intersectionObserver: true,
      };

      // Old Chrome version
      expect(checkBrowserSupport('chrome', '70', features)).toBe(false);
      
      // Old Firefox version
      expect(checkBrowserSupport('firefox', '60', features)).toBe(false);
      
      // Old Safari version
      expect(checkBrowserSupport('safari', '10', features)).toBe(false);
    });

    it('should return false for missing required features', () => {
      const features = {
        es6Modules: false, // Missing required feature
        asyncAwait: true,
        fetch: true,
        promises: true,
        localStorage: true,
        cssFlexbox: true,
        intersectionObserver: true,
      };

      expect(checkBrowserSupport('chrome', '91', features)).toBe(false);
    });
  });

  describe('getCompatibilityWarnings', () => {
    it('should return warnings for unsupported browsers', () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36');
      
      const warnings = getCompatibilityWarnings();
      expect(warnings).toContain('Browser chrome 70 is not fully supported. Please update to a modern browser.');
    });

    it('should return warnings for missing features', () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Mock missing features
      mockWindowFeatures({
        HTMLScriptElement: { prototype: {} }, // No noModule
        Worker: undefined,
        serviceWorker: undefined,
      });

      // Mock CSS.supports to return false for grid
      Object.defineProperty(window, 'CSS', {
        value: {
          supports: (property: string, value: string) => {
            if (property === 'display' && value === 'grid') return false;
            return true;
          }
        },
        writable: true,
        configurable: true,
      });

      const warnings = getCompatibilityWarnings();
      expect(warnings).toContain('CSS Grid is not supported. Some layouts may not display correctly.');
      expect(warnings).toContain('Web Workers are not supported. Some features may be slower.');
      expect(warnings).toContain('Service Workers are not supported. Offline functionality may be limited.');
    });

    it('should return empty array for fully supported browsers', () => {
      mockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Mock all required features
      mockWindowFeatures({
        HTMLScriptElement: { prototype: { noModule: true } },
        Worker: () => {},
        serviceWorker: {},
        IntersectionObserver: () => {},
        ResizeObserver: () => {},
        requestIdleCallback: () => {},
        fetch: () => {},
        Promise: {},
        localStorage: {},
        sessionStorage: {},
        indexedDB: {},
        performance: {},
        requestAnimationFrame: () => {},
        crypto: { subtle: {} },
      });

      // Mock CSS.supports to return true for all features
      Object.defineProperty(window, 'CSS', {
        value: {
          supports: () => true
        },
        writable: true,
        configurable: true,
      });

      const warnings = getCompatibilityWarnings();
      expect(warnings).toHaveLength(0);
    });
  });
});
