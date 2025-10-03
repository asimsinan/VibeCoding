#!/usr/bin/env node
/**
 * Professional Cross-Browser Compatibility Tests
 * 
 * Tests cover:
 * - Chrome, Firefox, Safari, Edge compatibility
 * - Feature detection and polyfills
 * - CSS compatibility
 * - JavaScript API compatibility
 * - Performance across browsers
 * - Rendering consistency
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { BrowserCompatibilityUtils } from '../../src/lib/platform/browser-compatibility'

describe('Cross-Browser Compatibility Tests', () => {
  let browserUtils: BrowserCompatibilityUtils

  beforeEach(() => {
    browserUtils = BrowserCompatibilityUtils.getInstance()
  })

  afterEach(() => {
    // Clean up after each test
  })

  describe('Browser Detection', () => {
    it('should detect Chrome browser', () => {
      // Mock Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      })

      const browserInfo = browserUtils.getBrowserInfo()
      expect(browserInfo.name).toBe('Chrome')
      expect(browserInfo.version).toBe('91')
    })

    it('should detect Firefox browser', () => {
      // Mock Firefox user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        configurable: true
      })

      const browserInfo = browserUtils.getBrowserInfo()
      expect(browserInfo.name).toBe('Firefox')
      expect(browserInfo.version).toBe('89')
    })

    it('should detect Safari browser', () => {
      // Mock Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        configurable: true
      })

      const browserInfo = browserUtils.getBrowserInfo()
      expect(browserInfo.name).toBe('Safari')
      expect(browserInfo.version).toBe('14')
    })

    it('should detect Edge browser', () => {
      // Mock Edge user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        configurable: true
      })

      const browserInfo = browserUtils.getBrowserInfo()
      expect(browserInfo.name).toBe('Edge')
      expect(browserInfo.version).toBe('91')
    })
  })

  describe('Feature Detection', () => {
    it('should detect ES6 features', () => {
      const features = browserUtils.getFeatureSupport()
      
      expect(features.es6).toBeDefined()
      expect(features.es6.arrowFunctions).toBe(true)
      expect(features.es6.templateLiterals).toBe(true)
      expect(features.es6.destructuring).toBe(true)
      expect(features.es6.promises).toBe(true)
    })

    it('should detect Web APIs', () => {
      const features = browserUtils.getFeatureSupport()
      
      expect(features.webAPIs).toBeDefined()
      expect(features.webAPIs.fetch).toBe(true)
      expect(features.webAPIs.localStorage).toBe(true)
      expect(features.webAPIs.sessionStorage).toBe(true)
      expect(features.webAPIs.geolocation).toBeDefined()
    })

    it('should detect CSS features', () => {
      const features = browserUtils.getFeatureSupport()
      
      expect(features.css).toBeDefined()
      expect(features.css.flexbox).toBe(true)
      expect(features.css.grid).toBe(true)
      expect(features.css.customProperties).toBe(true)
      expect(features.css.transforms).toBe(true)
    })

    it('should detect HTML5 features', () => {
      const features = browserUtils.getFeatureSupport()
      
      expect(features.html5).toBeDefined()
      expect(features.html5.canvas).toBe(true)
      expect(features.html5.video).toBe(true)
      expect(features.html5.audio).toBe(true)
      expect(features.html5.webWorkers).toBe(true)
    })
  })

  describe('Polyfill Loading', () => {
    it('should load polyfills for unsupported features', async () => {
      // Mock unsupported feature
      const originalFetch = window.fetch
      delete (window as any).fetch

      const polyfills = await browserUtils.loadPolyfills(['fetch'])
      
      expect(polyfills).toBeDefined()
      expect(polyfills.length).toBeGreaterThan(0)
      expect(window.fetch).toBeDefined()

      // Restore original fetch
      window.fetch = originalFetch
    })

    it('should handle polyfill loading errors gracefully', async () => {
      const polyfills = await browserUtils.loadPolyfills(['nonexistent-polyfill'])
      
      expect(polyfills).toBeDefined()
      expect(Array.isArray(polyfills)).toBe(true)
    })
  })

  describe('CSS Compatibility', () => {
    it('should detect CSS feature support', () => {
      const cssSupport = browserUtils.getCSSFeatureSupport()
      
      expect(cssSupport.flexbox).toBe(true)
      expect(cssSupport.grid).toBe(true)
      expect(cssSupport.customProperties).toBe(true)
      expect(cssSupport.transforms).toBe(true)
      expect(cssSupport.transitions).toBe(true)
      expect(cssSupport.animations).toBe(true)
    })

    it('should provide CSS fallbacks', () => {
      const fallbacks = browserUtils.getCSSFallbacks('display: grid')
      
      expect(fallbacks).toBeDefined()
      expect(fallbacks.length).toBeGreaterThan(0)
      expect(fallbacks[0]).toContain('display: flex')
    })
  })

  describe('JavaScript Compatibility', () => {
    it('should detect JavaScript feature support', () => {
      const jsSupport = browserUtils.getJavaScriptFeatureSupport()
      
      expect(jsSupport.es6).toBe(true)
      expect(jsSupport.es2017).toBe(true)
      expect(jsSupport.es2018).toBe(true)
      expect(jsSupport.es2019).toBe(true)
      expect(jsSupport.es2020).toBe(true)
    })

    it('should provide JavaScript polyfills', () => {
      const polyfills = browserUtils.getJavaScriptPolyfills()
      
      expect(polyfills).toBeDefined()
      expect(Array.isArray(polyfills)).toBe(true)
    })
  })

  describe('Performance Compatibility', () => {
    it('should measure performance across browsers', async () => {
      const performance = await browserUtils.measurePerformance()
      
      expect(performance).toBeDefined()
      expect(performance.loadTime).toBeGreaterThan(0)
      expect(performance.renderTime).toBeGreaterThan(0)
      expect(performance.interactiveTime).toBeGreaterThan(0)
    })

    it('should detect performance issues', () => {
      const issues = browserUtils.detectPerformanceIssues()
      
      expect(issues).toBeDefined()
      expect(Array.isArray(issues)).toBe(true)
    })
  })

  describe('Rendering Consistency', () => {
    it('should detect rendering differences', () => {
      const differences = browserUtils.detectRenderingDifferences()
      
      expect(differences).toBeDefined()
      expect(Array.isArray(differences)).toBe(true)
    })

    it('should provide rendering fixes', () => {
      const fixes = browserUtils.getRenderingFixes()
      
      expect(fixes).toBeDefined()
      expect(Array.isArray(fixes)).toBe(true)
    })
  })

  describe('Browser-Specific Issues', () => {
    it('should detect Chrome-specific issues', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      })

      const issues = browserUtils.getBrowserSpecificIssues()
      
      expect(issues).toBeDefined()
      expect(Array.isArray(issues)).toBe(true)
    })

    it('should detect Firefox-specific issues', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        configurable: true
      })

      const issues = browserUtils.getBrowserSpecificIssues()
      
      expect(issues).toBeDefined()
      expect(Array.isArray(issues)).toBe(true)
    })

    it('should detect Safari-specific issues', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        configurable: true
      })

      const issues = browserUtils.getBrowserSpecificIssues()
      
      expect(issues).toBeDefined()
      expect(Array.isArray(issues)).toBe(true)
    })

    it('should detect Edge-specific issues', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        configurable: true
      })

      const issues = browserUtils.getBrowserSpecificIssues()
      
      expect(issues).toBeDefined()
      expect(Array.isArray(issues)).toBe(true)
    })
  })

  describe('Compatibility Matrix', () => {
    it('should provide compatibility matrix', () => {
      const matrix = browserUtils.getCompatibilityMatrix()
      
      expect(matrix).toBeDefined()
      expect(matrix.chrome).toBeDefined()
      expect(matrix.firefox).toBeDefined()
      expect(matrix.safari).toBeDefined()
      expect(matrix.edge).toBeDefined()
    })

    it('should validate compatibility requirements', () => {
      const requirements = {
        chrome: '90+',
        firefox: '88+',
        safari: '14+',
        edge: '90+'
      }

      const isValid = browserUtils.validateCompatibilityRequirements(requirements)
      
      expect(isValid).toBeDefined()
      expect(typeof isValid).toBe('boolean')
    })
  })

  describe('Error Handling', () => {
    it('should handle browser detection errors gracefully', () => {
      // Mock invalid user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Invalid User Agent',
        configurable: true
      })

      const browserInfo = browserUtils.getBrowserInfo()
      
      expect(browserInfo).toBeDefined()
      expect(browserInfo.name).toBe('Unknown')
    })

    it('should handle feature detection errors gracefully', () => {
      // Mock missing feature
      const originalConsole = console.error
      console.error = jest.fn()

      const features = browserUtils.getFeatureSupport()
      
      expect(features).toBeDefined()
      expect(console.error).not.toHaveBeenCalled()

      console.error = originalConsole
    })
  })
})
