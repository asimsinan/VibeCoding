#!/usr/bin/env node
/**
 * Professional Accessibility Implementation Module
 * 
 * Implements WCAG 2.1 AA compliance features including:
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Focus management
 * - ARIA attributes
 * - Color contrast validation
 * - Motion preferences
 * - High contrast mode
 * 
 * @fileoverview Accessibility utilities and components for web platform
 */

import { useEffect, useRef, useState, useCallback } from 'react'

// --- Accessibility Types ---
export interface AccessibilityConfig {
  enableKeyboardNavigation: boolean
  enableScreenReader: boolean
  enableHighContrast: boolean
  enableReducedMotion: boolean
  enableFocusManagement: boolean
  enableARIA: boolean
  enableColorContrast: boolean
  announceChanges: boolean
}

export interface FocusTrapOptions {
  initialFocus?: HTMLElement | null
  returnFocus?: HTMLElement | null
  preventScroll?: boolean
  allowOutsideClick?: boolean
}

export interface ARIAConfig {
  label?: string
  description?: string
  expanded?: boolean
  selected?: boolean
  checked?: boolean
  disabled?: boolean
  hidden?: boolean
  live?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: string
}

export interface ColorContrastResult {
  ratio: number
  level: 'AA' | 'AAA' | 'FAIL'
  foreground: string
  background: string
  largeText: boolean
}

// --- Default Configuration ---
export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  enableKeyboardNavigation: true,
  enableScreenReader: true,
  enableHighContrast: true,
  enableReducedMotion: true,
  enableFocusManagement: true,
  enableARIA: true,
  enableColorContrast: true,
  announceChanges: true,
}

// --- Accessibility Utilities ---
export class AccessibilityUtils {
  private static instance: AccessibilityUtils
  private config: AccessibilityConfig
  private focusHistory: HTMLElement[] = []
  private currentFocusTrap: HTMLElement | null = null

  constructor(config: AccessibilityConfig = DEFAULT_ACCESSIBILITY_CONFIG) {
    this.config = { ...DEFAULT_ACCESSIBILITY_CONFIG, ...config }
    this.initializeAccessibility()
  }

  public static getInstance(config?: AccessibilityConfig): AccessibilityUtils {
    if (!AccessibilityUtils.instance) {
      AccessibilityUtils.instance = new AccessibilityUtils(config)
    }
    return AccessibilityUtils.instance
  }

  private initializeAccessibility(): void {
    if (typeof window === 'undefined') return

    // Set up keyboard navigation
    if (this.config.enableKeyboardNavigation) {
      this.setupKeyboardNavigation()
    }

    // Set up focus management
    if (this.config.enableFocusManagement) {
      this.setupFocusManagement()
    }

    // Set up motion preferences
    if (this.config.enableReducedMotion) {
      this.setupMotionPreferences()
    }

    // Set up high contrast mode
    if (this.config.enableHighContrast) {
      this.setupHighContrastMode()
    }

    // Set up screen reader announcements
    if (this.config.announceChanges) {
      this.setupScreenReaderAnnouncements()
    }
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (event) => {
      // Skip if modifier keys are pressed
      if (event.ctrlKey || event.altKey || event.metaKey) return

      switch (event.key) {
        case 'Tab':
          this.handleTabNavigation(event)
          break
        case 'Escape':
          this.handleEscapeKey(event)
          break
        case 'Enter':
        case ' ':
          this.handleActivationKeys(event)
          break
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowKeys(event)
          break
        case 'Home':
        case 'End':
          this.handleHomeEndKeys(event)
          break
      }
    })
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements()
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

    if (event.shiftKey) {
      // Shift + Tab: Move backwards
      if (currentIndex <= 0) {
        event.preventDefault()
        focusableElements[focusableElements.length - 1]?.focus()
      }
    } else {
      // Tab: Move forwards
      if (currentIndex >= focusableElements.length - 1) {
        event.preventDefault()
        focusableElements[0]?.focus()
      }
    }
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement
    
    // Close modals, dropdowns, etc.
    if (target.closest('[role="dialog"]') || target.closest('[role="menu"]')) {
      const closeButton = target.closest('[role="dialog"]')?.querySelector('[aria-label*="close"], [aria-label*="Close"]')
      if (closeButton) {
        (closeButton as HTMLElement).click()
      }
    }

    // Exit focus trap
    if (this.currentFocusTrap) {
      this.exitFocusTrap()
    }
  }

  private handleActivationKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement
    
    // Handle button activation
    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      if (event.key === ' ') {
        event.preventDefault()
        target.click()
      }
    }

    // Handle link activation
    if (target.tagName === 'A' || target.getAttribute('role') === 'link') {
      if (event.key === 'Enter') {
        target.click()
      }
    }
  }

  private handleArrowKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement
    const container = target.closest('[role="menu"], [role="tablist"], [role="radiogroup"]')
    
    if (!container) return

    const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="tab"], [role="radio"]'))
    const currentIndex = items.indexOf(target)

    let nextIndex = currentIndex
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        break
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        break
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault()
      ;(items[nextIndex] as HTMLElement).focus()
    }
  }

  private handleHomeEndKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement
    const container = target.closest('[role="menu"], [role="tablist"], [role="radiogroup"]')
    
    if (!container) return

    const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="tab"], [role="radio"]'))
    
    if (items.length === 0) return

    event.preventDefault()
    
    if (event.key === 'Home') {
      ;(items[0] as HTMLElement).focus()
    } else if (event.key === 'End') {
      ;(items[items.length - 1] as HTMLElement).focus()
    }
  }

  private setupFocusManagement(): void {
    // Track focus history
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement
      if (target && target !== document.body) {
        this.focusHistory.push(target)
        // Keep only last 10 focus elements
        if (this.focusHistory.length > 10) {
          this.focusHistory.shift()
        }
      }
    })

    // Handle focus restoration
    window.addEventListener('beforeunload', () => {
      this.saveFocusState()
    })

    window.addEventListener('load', () => {
      this.restoreFocusState()
    })
  }

  private setupMotionPreferences(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion')
      } else {
        document.documentElement.classList.remove('reduce-motion')
      }
    }

    prefersReducedMotion.addEventListener('change', handleMotionChange)
    handleMotionChange({ matches: prefersReducedMotion.matches } as MediaQueryListEvent)
  }

  private setupHighContrastMode(): void {
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)')
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('high-contrast')
      } else {
        document.documentElement.classList.remove('high-contrast')
      }
    }

    prefersHighContrast.addEventListener('change', handleContrastChange)
    handleContrastChange({ matches: prefersHighContrast.matches } as MediaQueryListEvent)
  }

  private setupScreenReaderAnnouncements(): void {
    // Create live region for announcements
    if (!document.getElementById('accessibility-announcements')) {
      const liveRegion = document.createElement('div')
      liveRegion.id = 'accessibility-announcements'
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
    }
  }

  public getFocusableElements(container?: HTMLElement): HTMLElement[] {
    const target = container || document
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[role="radio"]',
      '[role="checkbox"]'
    ].join(', ')

    return Array.from(target.querySelectorAll(focusableSelectors)) as HTMLElement[]
  }

  public createFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}): () => void {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0) return () => {}

    this.currentFocusTrap = container
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus initial element
    if (options.initialFocus) {
      options.initialFocus.focus()
    } else {
      firstElement.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!options.allowOutsideClick && !container.contains(event.target as Node)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    if (!options.allowOutsideClick) {
      document.addEventListener('click', handleClickOutside, true)
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside, true)
      this.currentFocusTrap = null
      
      if (options.returnFocus) {
        options.returnFocus.focus()
      }
    }
  }

  public exitFocusTrap(): void {
    if (this.currentFocusTrap) {
      this.currentFocusTrap = null
    }
  }

  public announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.announceChanges) return

    const liveRegion = document.getElementById('accessibility-announcements')
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.textContent = message
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = ''
      }, 1000)
    }
  }

  public saveFocusState(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && activeElement.id) {
        localStorage.setItem('accessibility-last-focus', activeElement.id)
      }
    }
  }

  public restoreFocusState(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const lastFocusId = localStorage.getItem('accessibility-last-focus')
      if (lastFocusId) {
        const element = document.getElementById(lastFocusId)
        if (element) {
          element.focus()
        }
        localStorage.removeItem('accessibility-last-focus')
      }
    }
  }

  public validateColorContrast(foreground: string, background: string): ColorContrastResult {
    const fgRgb = this.hexToRgb(foreground)
    const bgRgb = this.hexToRgb(background)
    
    if (!fgRgb || !bgRgb) {
      return {
        ratio: 0,
        level: 'FAIL',
        foreground,
        background,
        largeText: false
      }
    }

    const ratio = this.calculateContrastRatio(fgRgb, bgRgb)
    
    let level: 'AA' | 'AAA' | 'FAIL'
    if (ratio >= 7) {
      level = 'AAA'
    } else if (ratio >= 4.5) {
      level = 'AA'
    } else {
      level = 'FAIL'
    }

    return {
      ratio,
      level,
      foreground,
      background,
      largeText: false // Would need font size info to determine
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  private calculateContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
    const luminance1 = this.calculateLuminance(color1)
    const luminance2 = this.calculateLuminance(color2)
    
    const lighter = Math.max(luminance1, luminance2)
    const darker = Math.min(luminance1, luminance2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  private calculateLuminance(color: { r: number; g: number; b: number }): number {
    const { r, g, b } = color
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  public updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.initializeAccessibility()
  }

  public getConfig(): AccessibilityConfig {
    return { ...this.config }
  }
}

// --- React Hooks ---
export const useAccessibility = (config?: Partial<AccessibilityConfig>) => {
  const [accessibilityUtils] = useState(() => AccessibilityUtils.getInstance({
    enableKeyboardNavigation: config?.enableKeyboardNavigation ?? true,
    enableScreenReader: config?.enableScreenReader ?? true,
    enableHighContrast: config?.enableHighContrast ?? true,
    enableReducedMotion: config?.enableReducedMotion ?? true,
    enableFocusManagement: config?.enableFocusManagement ?? true,
    enableARIA: config?.enableARIA ?? true,
    enableColorContrast: config?.enableColorContrast ?? true,
    announceChanges: config?.announceChanges ?? true
  }))
  
  useEffect(() => {
    if (config) {
      accessibilityUtils.updateConfig(config)
    }
  }, [config, accessibilityUtils])

  return accessibilityUtils
}

export const useFocusTrap = (containerRef: React.RefObject<HTMLElement>, options?: FocusTrapOptions) => {
  const [isActive, setIsActive] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const activate = useCallback(() => {
    if (containerRef.current && !isActive) {
      const accessibilityUtils = AccessibilityUtils.getInstance()
      cleanupRef.current = accessibilityUtils.createFocusTrap(containerRef.current, options)
      setIsActive(true)
    }
  }, [containerRef, isActive, options])

  const deactivate = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
      setIsActive(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])

  return { activate, deactivate, isActive }
}

export const useARIA = (config: ARIAConfig) => {
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Apply ARIA attributes
    if (config.label) element.setAttribute('aria-label', config.label)
    if (config.description) element.setAttribute('aria-describedby', config.description)
    if (config.expanded !== undefined) element.setAttribute('aria-expanded', String(config.expanded))
    if (config.selected !== undefined) element.setAttribute('aria-selected', String(config.selected))
    if (config.checked !== undefined) element.setAttribute('aria-checked', String(config.checked))
    if (config.disabled !== undefined) element.setAttribute('aria-disabled', String(config.disabled))
    if (config.hidden !== undefined) element.setAttribute('aria-hidden', String(config.hidden))
    if (config.live) element.setAttribute('aria-live', config.live)
    if (config.atomic !== undefined) element.setAttribute('aria-atomic', String(config.atomic))
    if (config.relevant) element.setAttribute('aria-relevant', config.relevant)

    return () => {
      // Cleanup ARIA attributes
      const attributes = ['aria-label', 'aria-describedby', 'aria-expanded', 'aria-selected', 'aria-checked', 'aria-disabled', 'aria-hidden', 'aria-live', 'aria-atomic', 'aria-relevant']
      attributes.forEach(attr => element.removeAttribute(attr))
    }
  }, [config])

  return elementRef
}

export const useScreenReaderAnnouncement = () => {
  const accessibilityUtils = AccessibilityUtils.getInstance()

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    accessibilityUtils.announceToScreenReader(message, priority)
  }, [accessibilityUtils])

  return announce
}

// --- Accessibility Components ---
export interface AccessibilityProviderProps {
  children: React.ReactNode
  config?: Partial<AccessibilityConfig>
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children, config }) => {
  useAccessibility(config)
  
  return (
    <div className="accessibility-provider">
      {children}
    </div>
  )
}

export interface FocusTrapProps {
  children: React.ReactNode
  active: boolean
  options?: FocusTrapOptions
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, active, options }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { activate, deactivate } = useFocusTrap(containerRef, options)

  useEffect(() => {
    if (active) {
      activate()
    } else {
      deactivate()
    }
  }, [active, activate, deactivate])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}

export interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      onFocus={(e) => {
        e.currentTarget.classList.remove('sr-only')
      }}
      onBlur={(e) => {
        e.currentTarget.classList.add('sr-only')
      }}
    >
      {children}
    </a>
  )
}

// --- Export Default Instance ---
export const accessibilityUtils = AccessibilityUtils.getInstance()

// --- CLI Interface ---
export class AccessibilityCLI {
  private program: any

  constructor() {
    this.initializeCLI()
  }

  private initializeCLI(): void {
    // CLI implementation would go here
    // This is a placeholder for the CLI interface
    this.program = {
      name: 'accessibility-cli',
      version: '1.0.0',
      description: 'Accessibility utilities CLI'
    }
  }

  public async run(args: string[]): Promise<void> {
    // CLI command handling would go here
  }
}

export default AccessibilityCLI
