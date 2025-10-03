#!/usr/bin/env node
/**
 * Professional Responsive Design Tests
 * 
 * Tests cover:
 * - Mobile, tablet, desktop layouts
 * - Breakpoint detection
 * - Responsive image handling
 * - Responsive video handling
 * - Touch interaction support
 * - Orientation changes
 * - Viewport management
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { ResponsiveDesignUtils } from '../../src/lib/platform/responsive-design'

describe('Responsive Design Tests', () => {
  let responsiveUtils: ResponsiveDesignUtils

  beforeEach(() => {
    responsiveUtils = ResponsiveDesignUtils.getInstance()
  })

  afterEach(() => {
    // Clean up after each test
  })

  describe('Breakpoint Detection', () => {
    it('should detect mobile breakpoint', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true
      })

      const breakpoint = responsiveUtils.getCurrentBreakpoint()
      expect(breakpoint).toBe('mobile')
    })

    it('should detect tablet breakpoint', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 768,
        configurable: true
      })

      const breakpoint = responsiveUtils.getCurrentBreakpoint()
      expect(breakpoint).toBe('tablet')
    })

    it('should detect desktop breakpoint', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
        configurable: true
      })

      const breakpoint = responsiveUtils.getCurrentBreakpoint()
      expect(breakpoint).toBe('desktop')
    })

    it('should detect large desktop breakpoint', () => {
      // Mock large desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true
      })

      const breakpoint = responsiveUtils.getCurrentBreakpoint()
      expect(breakpoint).toBe('large')
    })
  })

  describe('Viewport Management', () => {
    it('should get viewport dimensions', () => {
      const dimensions = responsiveUtils.getViewportDimensions()
      
      expect(dimensions).toBeDefined()
      expect(dimensions.width).toBeGreaterThan(0)
      expect(dimensions.height).toBeGreaterThan(0)
    })

    it('should detect orientation', () => {
      const orientation = responsiveUtils.getOrientation()
      
      expect(orientation).toBeDefined()
      expect(['portrait', 'landscape']).toContain(orientation)
    })

    it('should handle orientation changes', () => {
      let orientationChanged = false
      
      responsiveUtils.onOrientationChange(() => {
        orientationChanged = true
      })

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', {
        value: 800,
        configurable: true
      })
      Object.defineProperty(window, 'innerHeight', {
        value: 600,
        configurable: true
      })

      window.dispatchEvent(new Event('resize'))

      expect(orientationChanged).toBe(true)
    })
  })

  describe('Responsive Images', () => {
    it('should generate responsive image sources', () => {
      const imageSrc = '/images/hero.jpg'
      const sources = responsiveUtils.generateResponsiveImageSources(imageSrc)
      
      expect(sources).toBeDefined()
      expect(sources.mobile).toBeDefined()
      expect(sources.tablet).toBeDefined()
      expect(sources.desktop).toBeDefined()
      expect(sources.large).toBeDefined()
    })

    it('should optimize image sizes for different breakpoints', () => {
      const imageSrc = '/images/hero.jpg'
      const optimizedSources = responsiveUtils.optimizeImageSizes(imageSrc)
      
      expect(optimizedSources).toBeDefined()
      expect(optimizedSources.mobile.width).toBeLessThanOrEqual(480)
      expect(optimizedSources.tablet.width).toBeLessThanOrEqual(768)
      expect(optimizedSources.desktop.width).toBeLessThanOrEqual(1200)
      expect(optimizedSources.large.width).toBeLessThanOrEqual(1920)
    })

    it('should generate WebP sources when supported', () => {
      const imageSrc = '/images/hero.jpg'
      const sources = responsiveUtils.generateWebPSources(imageSrc)
      
      expect(sources).toBeDefined()
      expect(sources.webp).toBeDefined()
      expect(sources.fallback).toBeDefined()
    })

    it('should handle lazy loading for images', () => {
      const imageElement = document.createElement('img')
      imageElement.src = '/images/hero.jpg'
      
      const lazyLoaded = responsiveUtils.setupLazyLoading(imageElement)
      
      expect(lazyLoaded).toBe(true)
      expect(imageElement.getAttribute('data-src')).toBe('/images/hero.jpg')
      expect(imageElement.src).toBe('')
    })
  })

  describe('Responsive Videos', () => {
    it('should generate responsive video sources', () => {
      const videoSrc = '/videos/demo.mp4'
      const sources = responsiveUtils.generateResponsiveVideoSources(videoSrc)
      
      expect(sources).toBeDefined()
      expect(sources.mobile).toBeDefined()
      expect(sources.tablet).toBeDefined()
      expect(sources.desktop).toBeDefined()
    })

    it('should optimize video quality for different breakpoints', () => {
      const videoSrc = '/videos/demo.mp4'
      const optimizedSources = responsiveUtils.optimizeVideoQuality(videoSrc)
      
      expect(optimizedSources).toBeDefined()
      expect(optimizedSources.mobile.quality).toBe('low')
      expect(optimizedSources.tablet.quality).toBe('medium')
      expect(optimizedSources.desktop.quality).toBe('high')
    })

    it('should handle video autoplay based on connection', () => {
      const videoElement = document.createElement('video')
      videoElement.src = '/videos/demo.mp4'
      
      const autoplayEnabled = responsiveUtils.shouldAutoplayVideo(videoElement)
      
      expect(typeof autoplayEnabled).toBe('boolean')
    })
  })

  describe('Touch Interaction Support', () => {
    it('should detect touch support', () => {
      const touchSupported = responsiveUtils.isTouchSupported()
      
      expect(typeof touchSupported).toBe('boolean')
    })

    it('should optimize for touch devices', () => {
      const touchOptimized = responsiveUtils.optimizeForTouch()
      
      expect(touchOptimized).toBeDefined()
      expect(touchOptimized.touchTargets).toBeDefined()
      expect(touchOptimized.touchTargets.minSize).toBeGreaterThanOrEqual(44)
    })

    it('should handle touch gestures', () => {
      const gestureSupport = responsiveUtils.getTouchGestureSupport()
      
      expect(gestureSupport).toBeDefined()
      expect(gestureSupport.swipe).toBeDefined()
      expect(gestureSupport.pinch).toBeDefined()
      expect(gestureSupport.rotate).toBeDefined()
    })
  })

  describe('Responsive Typography', () => {
    it('should generate responsive font sizes', () => {
      const baseFontSize = 16
      const responsiveSizes = responsiveUtils.generateResponsiveFontSizes(baseFontSize)
      
      expect(responsiveSizes).toBeDefined()
      expect(responsiveSizes.mobile).toBeLessThanOrEqual(baseFontSize)
      expect(responsiveSizes.tablet).toBeGreaterThanOrEqual(responsiveSizes.mobile)
      expect(responsiveSizes.desktop).toBeGreaterThanOrEqual(responsiveSizes.tablet)
    })

    it('should optimize line height for different screen sizes', () => {
      const baseLineHeight = 1.5
      const responsiveLineHeights = responsiveUtils.optimizeLineHeight(baseLineHeight)
      
      expect(responsiveLineHeights).toBeDefined()
      expect(responsiveLineHeights.mobile).toBeGreaterThanOrEqual(1.4)
      expect(responsiveLineHeights.desktop).toBeLessThanOrEqual(1.6)
    })
  })

  describe('Responsive Layout', () => {
    it('should generate responsive grid layouts', () => {
      const gridConfig = {
        columns: 12,
        gap: 20
      }
      const responsiveGrid = responsiveUtils.generateResponsiveGrid(gridConfig)
      
      expect(responsiveGrid).toBeDefined()
      expect(responsiveGrid.mobile.columns).toBeLessThanOrEqual(gridConfig.columns)
      expect(responsiveGrid.tablet.columns).toBeGreaterThanOrEqual(responsiveGrid.mobile.columns)
      expect(responsiveGrid.desktop.columns).toBeGreaterThanOrEqual(responsiveGrid.tablet.columns)
    })

    it('should optimize spacing for different breakpoints', () => {
      const baseSpacing = 20
      const responsiveSpacing = responsiveUtils.optimizeSpacing(baseSpacing)
      
      expect(responsiveSpacing).toBeDefined()
      expect(responsiveSpacing.mobile).toBeLessThanOrEqual(baseSpacing)
      expect(responsiveSpacing.desktop).toBeGreaterThanOrEqual(responsiveSpacing.mobile)
    })
  })

  describe('Performance Optimization', () => {
    it('should optimize images for different screen densities', () => {
      const imageSrc = '/images/hero.jpg'
      const densityOptimized = responsiveUtils.optimizeForScreenDensity(imageSrc)
      
      expect(densityOptimized).toBeDefined()
      expect(densityOptimized['1x']).toBeDefined()
      expect(densityOptimized['2x']).toBeDefined()
      expect(densityOptimized['3x']).toBeDefined()
    })

    it('should implement progressive enhancement', () => {
      const enhancement = responsiveUtils.implementProgressiveEnhancement()
      
      expect(enhancement).toBeDefined()
      expect(enhancement.basic).toBeDefined()
      expect(enhancement.enhanced).toBeDefined()
    })
  })

  describe('Accessibility in Responsive Design', () => {
    it('should ensure touch targets meet accessibility standards', () => {
      const touchTargets = responsiveUtils.ensureAccessibleTouchTargets()
      
      expect(touchTargets).toBeDefined()
      expect(touchTargets.minSize).toBeGreaterThanOrEqual(44)
      expect(touchTargets.spacing).toBeGreaterThanOrEqual(8)
    })

    it('should optimize text size for readability', () => {
      const textOptimization = responsiveUtils.optimizeTextForReadability()
      
      expect(textOptimization).toBeDefined()
      expect(textOptimization.minSize).toBeGreaterThanOrEqual(16)
      expect(textOptimization.maxWidth).toBeLessThanOrEqual(75)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid breakpoint values gracefully', () => {
      const invalidBreakpoint = responsiveUtils.getBreakpointValue('invalid' as any)
      
      expect(invalidBreakpoint).toBe(0)
    })

    it('should handle missing image sources gracefully', () => {
      const sources = responsiveUtils.generateResponsiveImageSources('')
      
      expect(sources).toBeDefined()
      expect(sources.mobile).toBe('')
    })

    it('should handle viewport dimension errors gracefully', () => {
      // Mock invalid viewport
      Object.defineProperty(window, 'innerWidth', {
        value: -1,
        configurable: true
      })

      const dimensions = responsiveUtils.getViewportDimensions()
      
      expect(dimensions).toBeDefined()
      expect(dimensions.width).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design Validation', () => {
    it('should validate responsive design implementation', () => {
      const validation = responsiveUtils.validateResponsiveDesign()
      
      expect(validation).toBeDefined()
      expect(validation.isValid).toBeDefined()
      expect(validation.issues).toBeDefined()
      expect(Array.isArray(validation.issues)).toBe(true)
    })

    it('should provide responsive design recommendations', () => {
      const recommendations = responsiveUtils.getResponsiveDesignRecommendations()
      
      expect(recommendations).toBeDefined()
      expect(Array.isArray(recommendations)).toBe(true)
    })
  })
})
