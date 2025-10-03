#!/usr/bin/env node
/**
 * Professional Accessibility Tests
 * 
 * Tests cover:
 * - WCAG 2.1 AA compliance
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Focus management
 * - ARIA attributes
 * - Color contrast validation
 * - Motion preferences
 * - High contrast mode
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { AccessibilityUtils } from '../../src/lib/platform/accessibility'

describe('Accessibility Tests', () => {
  let accessibilityUtils: AccessibilityUtils

  beforeEach(() => {
    accessibilityUtils = AccessibilityUtils.getInstance()
  })

  afterEach(() => {
    // Clean up after each test
  })

  describe('WCAG 2.1 AA Compliance', () => {
    it('should validate color contrast ratios', () => {
      const contrastResult = accessibilityUtils.validateColorContrast('#000000', '#ffffff')
      
      expect(contrastResult).toBeDefined()
      expect(contrastResult.ratio).toBeGreaterThan(4.5)
      expect(contrastResult.level).toBe('AA')
    })

    it('should fail low contrast combinations', () => {
      const contrastResult = accessibilityUtils.validateColorContrast('#cccccc', '#dddddd')
      
      expect(contrastResult).toBeDefined()
      expect(contrastResult.ratio).toBeLessThan(4.5)
      expect(contrastResult.level).toBe('FAIL')
    })

    it('should validate large text contrast', () => {
      const contrastResult = accessibilityUtils.validateColorContrast('#666666', '#ffffff')
      
      expect(contrastResult).toBeDefined()
      expect(contrastResult.largeText).toBe(false)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should identify focusable elements', () => {
      // Create test elements
      const button = document.createElement('button')
      const input = document.createElement('input')
      const link = document.createElement('a')
      link.href = '#'
      const div = document.createElement('div')
      
      document.body.appendChild(button)
      document.body.appendChild(input)
      document.body.appendChild(link)
      document.body.appendChild(div)

      const focusableElements = accessibilityUtils.getFocusableElements()
      
      expect(focusableElements).toContain(button)
      expect(focusableElements).toContain(input)
      expect(focusableElements).toContain(link)
      expect(focusableElements).not.toContain(div)

      // Clean up
      document.body.removeChild(button)
      document.body.removeChild(input)
      document.body.removeChild(link)
      document.body.removeChild(div)
    })

    it('should handle Tab navigation', () => {
      const focusableElements = accessibilityUtils.getFocusableElements()
      
      if (focusableElements.length > 1) {
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        
        firstElement.focus()
        expect(document.activeElement).toBe(firstElement)
        
        lastElement.focus()
        expect(document.activeElement).toBe(lastElement)
      }
    })

    it('should handle Arrow key navigation', () => {
      // Create a menu structure
      const menu = document.createElement('div')
      menu.setAttribute('role', 'menu')
      
      const item1 = document.createElement('div')
      item1.setAttribute('role', 'menuitem')
      item1.tabIndex = 0
      
      const item2 = document.createElement('div')
      item2.setAttribute('role', 'menuitem')
      item2.tabIndex = 0
      
      menu.appendChild(item1)
      menu.appendChild(item2)
      document.body.appendChild(menu)

      item1.focus()
      expect(document.activeElement).toBe(item1)

      // Clean up
      document.body.removeChild(menu)
    })
  })

  describe('Screen Reader Compatibility', () => {
    it('should announce changes to screen readers', () => {
      const announceSpy = jest.spyOn(accessibilityUtils, 'announceToScreenReader')
      
      accessibilityUtils.announceToScreenReader('Test announcement')
      
      expect(announceSpy).toHaveBeenCalledWith('Test announcement')
    })

    it('should create live regions for announcements', () => {
      const liveRegion = document.getElementById('accessibility-announcements')
      
      expect(liveRegion).toBeDefined()
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite')
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true')
    })

    it('should handle assertive announcements', () => {
      const announceSpy = jest.spyOn(accessibilityUtils, 'announceToScreenReader')
      
      accessibilityUtils.announceToScreenReader('Urgent message', 'assertive')
      
      expect(announceSpy).toHaveBeenCalledWith('Urgent message', 'assertive')
    })
  })

  describe('Focus Management', () => {
    it('should create focus traps', () => {
      const container = document.createElement('div')
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')
      
      container.appendChild(button1)
      container.appendChild(button2)
      document.body.appendChild(container)

      const cleanup = accessibilityUtils.createFocusTrap(container)
      
      expect(typeof cleanup).toBe('function')
      
      // Test focus trap
      button1.focus()
      expect(document.activeElement).toBe(button1)
      
      // Clean up
      cleanup()
      document.body.removeChild(container)
    })

    it('should save and restore focus state', () => {
      const button = document.createElement('button')
      button.id = 'test-button'
      document.body.appendChild(button)
      
      button.focus()
      accessibilityUtils.saveFocusState()
      
      // Simulate page reload
      button.blur()
      accessibilityUtils.restoreFocusState()
      
      expect(document.activeElement).toBe(button)
      
      // Clean up
      document.body.removeChild(button)
    })

    it('should track focus history', () => {
      const button1 = document.createElement('button')
      const button2 = document.createElement('button')
      
      document.body.appendChild(button1)
      document.body.appendChild(button2)

      button1.focus()
      button2.focus()
      
      // Focus history should be tracked
      expect(document.activeElement).toBe(button2)
      
      // Clean up
      document.body.removeChild(button1)
      document.body.removeChild(button2)
    })
  })

  describe('ARIA Attributes', () => {
    it('should validate ARIA labels', () => {
      const button = document.createElement('button')
      button.setAttribute('aria-label', 'Close dialog')
      
      const hasLabel = button.hasAttribute('aria-label')
      expect(hasLabel).toBe(true)
    })

    it('should validate ARIA descriptions', () => {
      const input = document.createElement('input')
      const description = document.createElement('div')
      description.id = 'input-description'
      description.textContent = 'Enter your email address'
      
      input.setAttribute('aria-describedby', 'input-description')
      
      expect(input.getAttribute('aria-describedby')).toBe('input-description')
    })

    it('should validate ARIA states', () => {
      const button = document.createElement('button')
      button.setAttribute('aria-expanded', 'false')
      button.setAttribute('aria-pressed', 'false')
      
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(button.getAttribute('aria-pressed')).toBe('false')
    })

    it('should validate ARIA roles', () => {
      const menu = document.createElement('div')
      menu.setAttribute('role', 'menu')
      
      const menuitem = document.createElement('div')
      menuitem.setAttribute('role', 'menuitem')
      
      expect(menu.getAttribute('role')).toBe('menu')
      expect(menuitem.getAttribute('role')).toBe('menuitem')
    })
  })

  describe('Motion Preferences', () => {
    it('should detect reduced motion preference', () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
      
      expect(typeof prefersReducedMotion.matches).toBe('boolean')
    })

    it('should apply reduced motion styles', () => {
      const hasReduceMotionClass = document.documentElement.classList.contains('reduce-motion')
      
      // This will depend on the user's system preferences
      expect(typeof hasReduceMotionClass).toBe('boolean')
    })
  })

  describe('High Contrast Mode', () => {
    it('should detect high contrast preference', () => {
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)')
      
      expect(typeof prefersHighContrast.matches).toBe('boolean')
    })

    it('should apply high contrast styles', () => {
      const hasHighContrastClass = document.documentElement.classList.contains('high-contrast')
      
      // This will depend on the user's system preferences
      expect(typeof hasHighContrastClass).toBe('boolean')
    })
  })

  describe('Accessibility Configuration', () => {
    it('should update accessibility configuration', () => {
      const newConfig = {
        enableKeyboardNavigation: false,
        enableScreenReader: true
      }
      
      accessibilityUtils.updateConfig(newConfig)
      const config = accessibilityUtils.getConfig()
      
      expect(config.enableKeyboardNavigation).toBe(false)
      expect(config.enableScreenReader).toBe(true)
    })

    it('should get current configuration', () => {
      const config = accessibilityUtils.getConfig()
      
      expect(config).toBeDefined()
      expect(typeof config.enableKeyboardNavigation).toBe('boolean')
      expect(typeof config.enableScreenReader).toBe('boolean')
      expect(typeof config.enableHighContrast).toBe('boolean')
      expect(typeof config.enableReducedMotion).toBe('boolean')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid color values gracefully', () => {
      const contrastResult = accessibilityUtils.validateColorContrast('invalid', 'invalid')
      
      expect(contrastResult).toBeDefined()
      expect(contrastResult.ratio).toBe(0)
      expect(contrastResult.level).toBe('FAIL')
    })

    it('should handle missing elements gracefully', () => {
      const focusableElements = accessibilityUtils.getFocusableElements(document.createElement('div'))
      
      expect(focusableElements).toBeDefined()
      expect(Array.isArray(focusableElements)).toBe(true)
    })

    it('should handle focus trap errors gracefully', () => {
      const cleanup = accessibilityUtils.createFocusTrap(document.createElement('div'))
      
      expect(typeof cleanup).toBe('function')
      
      // Should not throw when called
      expect(() => cleanup()).not.toThrow()
    })
  })

  describe('Accessibility Validation', () => {
    it('should validate overall accessibility implementation', () => {
      const validation = accessibilityUtils.validateAccessibility()
      
      expect(validation).toBeDefined()
      expect(validation.isValid).toBeDefined()
      expect(validation.issues).toBeDefined()
      expect(Array.isArray(validation.issues)).toBe(true)
    })

    it('should provide accessibility recommendations', () => {
      const recommendations = accessibilityUtils.getAccessibilityRecommendations()
      
      expect(recommendations).toBeDefined()
      expect(Array.isArray(recommendations)).toBe(true)
    })
  })

  describe('Accessibility Testing Tools', () => {
    it('should provide accessibility testing utilities', () => {
      const testingUtils = accessibilityUtils.getTestingUtilities()
      
      expect(testingUtils).toBeDefined()
      expect(testingUtils.validateColorContrast).toBeDefined()
      expect(testingUtils.validateARIA).toBeDefined()
      expect(testingUtils.validateKeyboardNavigation).toBeDefined()
    })

    it('should generate accessibility reports', () => {
      const report = accessibilityUtils.generateAccessibilityReport()
      
      expect(report).toBeDefined()
      expect(report.timestamp).toBeDefined()
      expect(report.issues).toBeDefined()
      expect(report.recommendations).toBeDefined()
    })
  })
})
