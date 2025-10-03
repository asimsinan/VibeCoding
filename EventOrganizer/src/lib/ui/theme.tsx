/**
 * Theme Management System
 * 
 * Provides comprehensive theme management including:
 * - Dark mode support
 * - Theme persistence
 * - Theme switching
 * - Custom theme creation
 * - System preference detection
 * 
 * @fileoverview Theme Management System for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import React from 'react'

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeColors {
  // Background colors
  background: string
  backgroundSecondary: string
  backgroundTertiary: string
  
  // Text colors
  text: string
  textSecondary: string
  textTertiary: string
  
  // Border colors
  border: string
  borderSecondary: string
  
  // Accent colors
  primary: string
  primaryHover: string
  primaryActive: string
  
  secondary: string
  secondaryHover: string
  secondaryActive: string
  
  // Status colors
  success: string
  warning: string
  error: string
  info: string
  
  // Interactive colors
  hover: string
  active: string
  focus: string
  
  // Shadow colors
  shadow: string
  shadowHover: string
}

export interface Theme {
  name: string
  colors: ThemeColors
  fonts: {
    primary: string
    secondary: string
    mono: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

// Default themes
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    text: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    border: '#e2e8f0',
    borderSecondary: '#cbd5e1',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',
    secondary: '#64748b',
    secondaryHover: '#475569',
    secondaryActive: '#334155',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    hover: '#f1f5f9',
    active: '#e2e8f0',
    focus: '#3b82f6',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowHover: 'rgba(0, 0, 0, 0.15)',
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
}

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    backgroundTertiary: '#334155',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    border: '#475569',
    borderSecondary: '#64748b',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',
    secondary: '#64748b',
    secondaryHover: '#475569',
    secondaryActive: '#334155',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    hover: '#1e293b',
    active: '#334155',
    focus: '#3b82f6',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowHover: 'rgba(0, 0, 0, 0.4)',
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  },
}

// Theme manager class
export class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: Theme = lightTheme
  private currentMode: ThemeMode = 'system'
  private listeners: Set<(theme: Theme, mode: ThemeMode) => void> = new Set()
  private mediaQuery: MediaQueryList | null = null

  private constructor() {
    this.loadThemeFromStorage()
    this.setupSystemThemeListener()
    this.applyTheme()
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  private loadThemeFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const storedMode = localStorage.getItem('theme-mode') as ThemeMode
      if (storedMode && ['light', 'dark', 'system'].includes(storedMode)) {
        this.currentMode = storedMode
      }
    } catch (error) {
    }
  }

  private saveThemeToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('theme-mode', this.currentMode)
    } catch (error) {
    }
  }

  private setupSystemThemeListener(): void {
    if (typeof window === 'undefined') return

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this))
  }

  private handleSystemThemeChange = (e: MediaQueryListEvent): void => {
    if (this.currentMode === 'system') {
      this.updateCurrentTheme()
      this.applyTheme()
      this.notifyListeners()
    }
  }

  private updateCurrentTheme(): void {
    if (this.currentMode === 'dark') {
      this.currentTheme = darkTheme
    } else if (this.currentMode === 'light') {
      this.currentTheme = lightTheme
    } else {
      // System mode
      const prefersDark = this.mediaQuery?.matches ?? false
      this.currentTheme = prefersDark ? darkTheme : lightTheme
    }
  }

  public applyTheme(): void {
    if (typeof document === 'undefined') return

    this.updateCurrentTheme()
    
    const root = document.documentElement
    const theme = this.currentTheme

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value)
    })

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value)
    })

    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value)
    })

    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value)
    })

    // Apply theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '')
    document.body.classList.add(`theme-${theme.name}`)

    // Apply dark mode class to HTML element for Tailwind CSS
    if (this.currentMode === 'dark') {
      root.classList.add('dark')
    } else if (this.currentMode === 'light') {
      root.classList.remove('dark')
    } else {
      // System mode - check system preference
      const prefersDark = this.mediaQuery?.matches ?? false
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.currentTheme, this.currentMode)
    })
  }

  // Public methods
  getCurrentTheme(): Theme {
    return this.currentTheme
  }

  getCurrentMode(): ThemeMode {
    return this.currentMode
  }

  setThemeMode(mode: ThemeMode): void {
    this.currentMode = mode
    this.saveThemeToStorage()
    this.applyTheme()
    this.notifyListeners()
  }

  toggleTheme(): void {
    if (this.currentMode === 'light') {
      this.setThemeMode('dark')
    } else if (this.currentMode === 'dark') {
      this.setThemeMode('system')
    } else {
      this.setThemeMode('light')
    }
  }

  subscribe(listener: (theme: Theme, mode: ThemeMode) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Theme utilities
  getColor(colorName: keyof ThemeColors): string {
    return this.currentTheme.colors[colorName]
  }

  getSpacing(size: keyof Theme['spacing']): string {
    return this.currentTheme.spacing[size]
  }

  getBorderRadius(size: keyof Theme['borderRadius']): string {
    return this.currentTheme.borderRadius[size]
  }

  getShadow(size: keyof Theme['shadows']): string {
    return this.currentTheme.shadows[size]
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance()

// React hook for theme management
export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(themeManager.getCurrentTheme())
  const [mode, setMode] = React.useState<ThemeMode>(themeManager.getCurrentMode())

  React.useEffect(() => {
    const unsubscribe = themeManager.subscribe((newTheme, newMode) => {
      setTheme(newTheme)
      setMode(newMode)
    })

    return unsubscribe
  }, [])

  return {
    theme,
    mode,
    setThemeMode: themeManager.setThemeMode.bind(themeManager),
    toggleTheme: themeManager.toggleTheme.bind(themeManager),
    getColor: themeManager.getColor.bind(themeManager),
    getSpacing: themeManager.getSpacing.bind(themeManager),
    getBorderRadius: themeManager.getBorderRadius.bind(themeManager),
    getShadow: themeManager.getShadow.bind(themeManager),
  }
}

// Theme provider component
export interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, mode } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Ensure theme is applied on mount
    themeManager.applyTheme()
  }, [theme, mode])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}

// Theme toggle component
export interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { mode, toggleTheme } = useTheme()

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      case 'dark':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )
      case 'system':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
    }
  }

  const getLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System'
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${className}`}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'} theme`}
    >
      {getIcon()}
      {showLabel && <span className="text-sm font-medium">{getLabel()}</span>}
    </button>
  )
}

// Themed component wrapper
export interface ThemedProps {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
}

export const Themed: React.FC<ThemedProps> = ({ 
  children, 
  className = '', 
  variant = 'primary' 
}) => {
  const { getColor } = useTheme()

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `bg-blue-500 text-white hover:bg-blue-600`
      case 'secondary':
        return `bg-gray-500 text-white hover:bg-gray-600`
      case 'success':
        return `bg-green-500 text-white hover:bg-green-600`
      case 'warning':
        return `bg-yellow-500 text-white hover:bg-yellow-600`
      case 'error':
        return `bg-red-500 text-white hover:bg-red-600`
      case 'info':
        return `bg-cyan-500 text-white hover:bg-cyan-600`
      default:
        return `bg-blue-500 text-white hover:bg-blue-600`
    }
  }

  return (
    <div className={`${getVariantStyles()} ${className}`}>
      {children}
    </div>
  )
}
