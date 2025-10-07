/**
 * @jest-environment jsdom
 */

import {
  isJavaScriptEnabled,
  shouldEnableAnimations,
  shouldEnableRealtime,
  shouldEnableAdvancedFeatures,
  getProgressiveEnhancementConfig,
  applyProgressiveEnhancement,
  initializeProgressiveEnhancement,
} from '../../src/lib/progressive-enhancement';

// Mock window and document
const mockWindow = (overrides: any = {}) => {
  Object.defineProperty(window, 'window', {
    value: {
      ...window,
      ...overrides,
    },
    writable: true,
    configurable: true,
  });
};

const mockDocument = (overrides: any = {}) => {
  Object.defineProperty(document, 'document', {
    value: {
      ...document,
      ...overrides,
    },
    writable: true,
    configurable: true,
  });
};

const mockNavigator = (overrides: any = {}) => {
  Object.defineProperty(navigator, 'navigator', {
    value: {
      ...navigator,
      ...overrides,
    },
    writable: true,
    configurable: true,
  });
};

describe('Progressive Enhancement', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.className = '';
    document.documentElement.style.cssText = '';
    
    // Reset mocks
    jest.clearAllMocks();
    
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
  });

  describe('isJavaScriptEnabled', () => {
    it('should return true when window and document are available', () => {
      expect(isJavaScriptEnabled()).toBe(true);
    });

    it('should return false when window is not available', () => {
      mockWindow(undefined);
      expect(isJavaScriptEnabled()).toBe(false);
    });

    it('should return false when document is not available', () => {
      mockWindow({ document: undefined });
      expect(isJavaScriptEnabled()).toBe(false);
    });
  });

  describe('shouldEnableAnimations', () => {
    it('should return true by default', () => {
      expect(shouldEnableAnimations()).toBe(true);
    });

    it('should return false when reduced motion is preferred', () => {
      const mockMatchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      mockWindow({ matchMedia: mockMatchMedia });
      expect(shouldEnableAnimations()).toBe(false);
    });

    it('should return false for low-end devices', () => {
      mockNavigator({ hardwareConcurrency: 1 });
      expect(shouldEnableAnimations()).toBe(false);
    });

    it('should return true for high-end devices', () => {
      mockNavigator({ hardwareConcurrency: 8 });
      expect(shouldEnableAnimations()).toBe(true);
    });
  });

  describe('shouldEnableRealtime', () => {
    it('should return false when window is not available', () => {
      mockWindow(undefined);
      expect(shouldEnableRealtime()).toBe(false);
    });

    it('should return true for stable connections', () => {
      mockNavigator({
        connection: {
          effectiveType: '4g',
        },
      });
      expect(shouldEnableRealtime()).toBe(true);
    });

    it('should return false for slow connections', () => {
      mockNavigator({
        connection: {
          effectiveType: '2g',
        },
      });
      expect(shouldEnableRealtime()).toBe(false);
    });

    it('should return true when connection info is not available', () => {
      mockNavigator({});
      expect(shouldEnableRealtime()).toBe(true);
    });
  });

  describe('shouldEnableAdvancedFeatures', () => {
    it('should return false when window is not available', () => {
      mockWindow(undefined);
      expect(shouldEnableAdvancedFeatures()).toBe(false);
    });

    it('should return true when all modern features are available', () => {
      mockWindow({
        IntersectionObserver: () => {},
        ResizeObserver: () => {},
        requestIdleCallback: () => {},
      });

      mockWindow({
        performance: {
          memory: {
            jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
          },
        },
      });

      expect(shouldEnableAdvancedFeatures()).toBe(true);
    });

    it('should return false when modern features are missing', () => {
      mockWindow({
        IntersectionObserver: undefined,
        ResizeObserver: () => {},
        requestIdleCallback: () => {},
      });

      expect(shouldEnableAdvancedFeatures()).toBe(false);
    });

    it('should return false for low memory devices', () => {
      mockWindow({
        IntersectionObserver: () => {},
        ResizeObserver: () => {},
        requestIdleCallback: () => {},
        performance: {
          memory: {
            jsHeapSizeLimit: 50 * 1024 * 1024, // 50MB
          },
        },
      });

      expect(shouldEnableAdvancedFeatures()).toBe(false);
    });
  });

  describe('getProgressiveEnhancementConfig', () => {
    it('should return correct configuration', () => {
      const config = getProgressiveEnhancementConfig();
      
      expect(config).toHaveProperty('enableJavaScript');
      expect(config).toHaveProperty('enableAnimations');
      expect(config).toHaveProperty('enableRealtime');
      expect(config).toHaveProperty('enableAdvancedFeatures');
    });

    it('should reflect current environment state', () => {
      mockNavigator({
        connection: { effectiveType: '4g' },
        hardwareConcurrency: 4,
      });

      mockWindow({
        IntersectionObserver: () => {},
        ResizeObserver: () => {},
        requestIdleCallback: () => {},
        performance: { memory: { jsHeapSizeLimit: 200 * 1024 * 1024 } },
      });

      const config = getProgressiveEnhancementConfig();
      expect(config.enableJavaScript).toBe(true);
      expect(config.enableAnimations).toBe(true);
      expect(config.enableRealtime).toBe(true);
      expect(config.enableAdvancedFeatures).toBe(true);
    });
  });

  describe('applyProgressiveEnhancement', () => {
    it('should apply classes to document element', () => {
      applyProgressiveEnhancement();
      
      const root = document.documentElement;
      expect(root.classList.contains('js-enabled')).toBe(true);
    });

    it('should set CSS custom properties', () => {
      applyProgressiveEnhancement();
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--js-enabled')).toBe('1');
      expect(root.style.getPropertyValue('--animations-enabled')).toBe('1');
      expect(root.style.getPropertyValue('--realtime-enabled')).toBe('1');
      expect(root.style.getPropertyValue('--advanced-features-enabled')).toBe('1');
    });

    it('should apply animation classes based on preferences', () => {
      const mockMatchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      mockWindow({ matchMedia: mockMatchMedia });
      applyProgressiveEnhancement();
      
      const root = document.documentElement;
      expect(root.classList.contains('no-animations')).toBe(true);
      expect(root.classList.contains('animations-enabled')).toBe(false);
    });

    it('should apply realtime classes based on connection', () => {
      mockNavigator({
        connection: { effectiveType: '2g' },
      });
      
      applyProgressiveEnhancement();
      
      const root = document.documentElement;
      expect(root.classList.contains('realtime-enabled')).toBe(false);
    });
  });

  describe('initializeProgressiveEnhancement', () => {
    it('should apply progressive enhancement immediately', () => {
      const spy = jest.spyOn(require('../../src/lib/progressive-enhancement'), 'applyProgressiveEnhancement');
      
      initializeProgressiveEnhancement();
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should set up connection change listener', () => {
      const mockConnection = {
        addEventListener: jest.fn(),
      };
      
      mockNavigator({ connection: mockConnection });
      
      initializeProgressiveEnhancement();
      
      expect(mockConnection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should set up visibility change listener', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      initializeProgressiveEnhancement();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with realistic configuration', () => {
      // Mock realistic browser environment
      mockNavigator({
        connection: { effectiveType: '4g' },
        hardwareConcurrency: 4,
      });

      mockWindow({
        IntersectionObserver: () => {},
        ResizeObserver: () => {},
        requestIdleCallback: () => {},
        performance: { memory: { jsHeapSizeLimit: 200 * 1024 * 1024 } },
      });

      // Initialize progressive enhancement
      initializeProgressiveEnhancement();

      // Check that classes and properties are applied
      const root = document.documentElement;
      expect(root.classList.contains('js-enabled')).toBe(true);
      expect(root.classList.contains('animations-enabled')).toBe(true);
      expect(root.classList.contains('realtime-enabled')).toBe(true);
      expect(root.classList.contains('advanced-features-enabled')).toBe(true);

      expect(root.style.getPropertyValue('--js-enabled')).toBe('1');
      expect(root.style.getPropertyValue('--animations-enabled')).toBe('1');
      expect(root.style.getPropertyValue('--realtime-enabled')).toBe('1');
      expect(root.style.getPropertyValue('--advanced-features-enabled')).toBe('1');
    });

    it('should handle low-end device configuration', () => {
      // Mock low-end device
      mockNavigator({
        connection: { effectiveType: '2g' },
        hardwareConcurrency: 1,
      });

      mockWindow({
        IntersectionObserver: undefined,
        ResizeObserver: undefined,
        requestIdleCallback: undefined,
        performance: { memory: { jsHeapSizeLimit: 50 * 1024 * 1024 } },
      });

      // Initialize progressive enhancement
      initializeProgressiveEnhancement();

      // Check that appropriate classes are applied
      const root = document.documentElement;
      expect(root.classList.contains('js-enabled')).toBe(true);
      expect(root.classList.contains('no-animations')).toBe(true);
      expect(root.classList.contains('realtime-enabled')).toBe(false);
      expect(root.classList.contains('advanced-features-enabled')).toBe(false);
    });
  });
});
