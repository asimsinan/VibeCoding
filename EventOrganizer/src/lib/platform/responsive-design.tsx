import { useEffect, useState, useCallback } from 'react'

// Responsive Design Configuration
export interface ResponsiveConfig {
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
    wide: number
  }
  containerMaxWidths: {
    mobile: string
    tablet: string
    desktop: string
    wide: string
  }
  gridColumns: {
    mobile: number
    tablet: number
    desktop: number
    wide: number
  }
}

// Default responsive configuration
export const defaultResponsiveConfig: ResponsiveConfig = {
  breakpoints: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    wide: 1280
  },
  containerMaxWidths: {
    mobile: '100%',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px'
  },
  gridColumns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 4
  }
}

// Device type enumeration
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide'

// Screen size interface
export interface ScreenSize {
  width: number
  height: number
  deviceType: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isWide: boolean
  orientation: 'portrait' | 'landscape'
}

// Responsive Design Hook
export function useResponsive(config: ResponsiveConfig = defaultResponsiveConfig) {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        deviceType: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: false,
        orientation: 'landscape'
      }
    }

    return getScreenSize(window.innerWidth, window.innerHeight, config)
  })

  const updateScreenSize = useCallback(() => {
    if (typeof window === 'undefined') return

    const newScreenSize = getScreenSize(window.innerWidth, window.innerHeight, config)
    setScreenSize(newScreenSize)
  }, [config])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initial size
    updateScreenSize()

    // Add resize listener
    window.addEventListener('resize', updateScreenSize)
    window.addEventListener('orientationchange', updateScreenSize)

    return () => {
      window.removeEventListener('resize', updateScreenSize)
      window.removeEventListener('orientationchange', updateScreenSize)
    }
  }, [updateScreenSize])

  return screenSize
}

// Get screen size information
function getScreenSize(width: number, height: number, config: ResponsiveConfig): ScreenSize {
  const deviceType = getDeviceType(width, config)
  const orientation = height > width ? 'portrait' : 'landscape'

  return {
    width,
    height,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isWide: deviceType === 'wide',
    orientation
  }
}

// Determine device type based on width
function getDeviceType(width: number, config: ResponsiveConfig): DeviceType {
  if (width < config.breakpoints.tablet) {
    return 'mobile'
  } else if (width < config.breakpoints.desktop) {
    return 'tablet'
  } else if (width < config.breakpoints.wide) {
    return 'desktop'
  } else {
    return 'wide'
  }
}

// Responsive Grid Component Props
export interface ResponsiveGridProps {
  children: React.ReactNode
  columns?: Partial<Record<DeviceType, number>>
  gap?: string | number
  className?: string
  config?: ResponsiveConfig
}

// Responsive Grid Component
export function ResponsiveGrid({ 
  children, 
  columns = {}, 
  gap = '1rem', 
  className = '',
  config = defaultResponsiveConfig 
}: ResponsiveGridProps) {
  const screenSize = useResponsive(config)
  
  const gridColumns = {
    mobile: columns.mobile ?? config.gridColumns.mobile,
    tablet: columns.tablet ?? config.gridColumns.tablet,
    desktop: columns.desktop ?? config.gridColumns.desktop,
    wide: columns.wide ?? config.gridColumns.wide
  }

  const currentColumns = gridColumns[screenSize.deviceType]

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${currentColumns}, 1fr)`,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    width: '100%'
  }

  return (
    <div className={className} style={gridStyle}>
      {children}
    </div>
  )
}

// Responsive Container Component Props
export interface ResponsiveContainerProps {
  children: React.ReactNode
  maxWidth?: Partial<Record<DeviceType, string>>
  padding?: string | number
  className?: string
  config?: ResponsiveConfig
}

// Responsive Container Component
export function ResponsiveContainer({ 
  children, 
  maxWidth = {}, 
  padding = '1rem',
  className = '',
  config = defaultResponsiveConfig 
}: ResponsiveContainerProps) {
  const screenSize = useResponsive(config)
  
  const containerMaxWidths = {
    mobile: maxWidth.mobile ?? config.containerMaxWidths.mobile,
    tablet: maxWidth.tablet ?? config.containerMaxWidths.tablet,
    desktop: maxWidth.desktop ?? config.containerMaxWidths.desktop,
    wide: maxWidth.wide ?? config.containerMaxWidths.wide
  }

  const currentMaxWidth = containerMaxWidths[screenSize.deviceType]

  const containerStyle: React.CSSProperties = {
    maxWidth: currentMaxWidth,
    margin: '0 auto',
    padding: typeof padding === 'number' ? `${padding}px` : padding,
    width: '100%'
  }

  return (
    <div className={className} style={containerStyle}>
      {children}
    </div>
  )
}

// Responsive Image Component Props
export interface ResponsiveImageProps {
  src: string
  alt: string
  sizes?: Partial<Record<DeviceType, string>>
  className?: string
  loading?: 'lazy' | 'eager'
  config?: ResponsiveConfig
}

// Responsive Image Component
export function ResponsiveImage({ 
  src, 
  alt, 
  sizes = {},
  className = '',
  loading = 'lazy',
  config = defaultResponsiveConfig 
}: ResponsiveImageProps) {
  const screenSize = useResponsive(config)
  
  const imageSizes = {
    mobile: sizes.mobile ?? '100vw',
    tablet: sizes.tablet ?? '50vw',
    desktop: sizes.desktop ?? '33vw',
    wide: sizes.wide ?? '25vw'
  }

  const currentSize = imageSizes[screenSize.deviceType]

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    maxWidth: currentSize
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={imageStyle}
      loading={loading}
    />
  )
}

// Responsive Text Component Props
export interface ResponsiveTextProps {
  children: React.ReactNode
  sizes?: Partial<Record<DeviceType, string>>
  className?: string
  config?: ResponsiveConfig
}

// Responsive Text Component
export function ResponsiveText({ 
  children, 
  sizes = {},
  className = '',
  config = defaultResponsiveConfig 
}: ResponsiveTextProps) {
  const screenSize = useResponsive(config)
  
  const textSizes = {
    mobile: sizes.mobile ?? '1rem',
    tablet: sizes.tablet ?? '1.125rem',
    desktop: sizes.desktop ?? '1.25rem',
    wide: sizes.wide ?? '1.375rem'
  }

  const currentSize = textSizes[screenSize.deviceType]

  const textStyle: React.CSSProperties = {
    fontSize: currentSize,
    lineHeight: 1.5
  }

  return (
    <div className={className} style={textStyle}>
      {children}
    </div>
  )
}

// Responsive Navigation Component Props
export interface ResponsiveNavigationProps {
  children: React.ReactNode
  mobileMenu?: React.ReactNode
  className?: string
  config?: ResponsiveConfig
}

// Responsive Navigation Component
export function ResponsiveNavigation({ 
  children, 
  mobileMenu,
  className = '',
  config = defaultResponsiveConfig 
}: ResponsiveNavigationProps) {
  const screenSize = useResponsive(config)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (screenSize.isMobile) {
    return (
      <nav className={`mobile-nav ${className}`}>
        <div className="mobile-nav-header">
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
        
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            {mobileMenu || children}
          </div>
        )}
      </nav>
    )
  }

  return (
    <nav className={`desktop-nav ${className}`}>
      {children}
    </nav>
  )
}

// Responsive CSS Generator
export class ResponsiveCSSGenerator {
  private config: ResponsiveConfig

  constructor(config: ResponsiveConfig = defaultResponsiveConfig) {
    this.config = config
  }

  // Generate responsive CSS
  generateResponsiveCSS(): string {
    return `
      /* Responsive Design CSS */
      
      /* Base styles */
      .container {
        width: 100%;
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      .grid {
        display: grid;
        gap: 1rem;
      }
      
      .flex {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      /* Mobile styles */
      @media (max-width: ${this.config.breakpoints.tablet - 1}px) {
        .container {
          max-width: ${this.config.containerMaxWidths.mobile};
          padding: 0 0.75rem;
        }
        
        .grid {
          grid-template-columns: repeat(${this.config.gridColumns.mobile}, 1fr);
        }
        
        .flex {
          flex-direction: column;
        }
        
        .mobile-hidden {
          display: none !important;
        }
        
        .mobile-full {
          width: 100% !important;
        }
        
        .mobile-text-center {
          text-align: center !important;
        }
        
        .mobile-p-0 {
          padding: 0 !important;
        }
        
        .mobile-m-0 {
          margin: 0 !important;
        }
      }
      
      /* Tablet styles */
      @media (min-width: ${this.config.breakpoints.tablet}px) and (max-width: ${this.config.breakpoints.desktop - 1}px) {
        .container {
          max-width: ${this.config.containerMaxWidths.tablet};
          padding: 0 1rem;
        }
        
        .grid {
          grid-template-columns: repeat(${this.config.gridColumns.tablet}, 1fr);
        }
        
        .flex {
          flex-direction: row;
        }
        
        .tablet-hidden {
          display: none !important;
        }
        
        .tablet-half {
          width: 50% !important;
        }
      }
      
      /* Desktop styles */
      @media (min-width: ${this.config.breakpoints.desktop}px) and (max-width: ${this.config.breakpoints.wide - 1}px) {
        .container {
          max-width: ${this.config.containerMaxWidths.desktop};
          padding: 0 1.5rem;
        }
        
        .grid {
          grid-template-columns: repeat(${this.config.gridColumns.desktop}, 1fr);
        }
        
        .desktop-hidden {
          display: none !important;
        }
        
        .desktop-third {
          width: 33.333% !important;
        }
      }
      
      /* Wide screen styles */
      @media (min-width: ${this.config.breakpoints.wide}px) {
        .container {
          max-width: ${this.config.containerMaxWidths.wide};
          padding: 0 2rem;
        }
        
        .grid {
          grid-template-columns: repeat(${this.config.gridColumns.wide}, 1fr);
        }
        
        .wide-hidden {
          display: none !important;
        }
        
        .wide-quarter {
          width: 25% !important;
        }
      }
      
      /* Responsive typography */
      @media (max-width: ${this.config.breakpoints.tablet - 1}px) {
        h1 { font-size: 1.5rem; }
        h2 { font-size: 1.25rem; }
        h3 { font-size: 1.125rem; }
        h4 { font-size: 1rem; }
        h5 { font-size: 0.875rem; }
        h6 { font-size: 0.75rem; }
        p { font-size: 0.875rem; }
      }
      
      @media (min-width: ${this.config.breakpoints.tablet}px) {
        h1 { font-size: 2rem; }
        h2 { font-size: 1.5rem; }
        h3 { font-size: 1.25rem; }
        h4 { font-size: 1.125rem; }
        h5 { font-size: 1rem; }
        h6 { font-size: 0.875rem; }
        p { font-size: 1rem; }
      }
      
      @media (min-width: ${this.config.breakpoints.desktop}px) {
        h1 { font-size: 2.5rem; }
        h2 { font-size: 2rem; }
        h3 { font-size: 1.5rem; }
        h4 { font-size: 1.25rem; }
        h5 { font-size: 1.125rem; }
        h6 { font-size: 1rem; }
        p { font-size: 1.125rem; }
      }
      
      /* Responsive spacing */
      @media (max-width: ${this.config.breakpoints.tablet - 1}px) {
        .space-y-1 > * + * { margin-top: 0.25rem; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-6 > * + * { margin-top: 1.5rem; }
        .space-y-8 > * + * { margin-top: 2rem; }
      }
      
      @media (min-width: ${this.config.breakpoints.tablet}px) {
        .space-y-1 > * + * { margin-top: 0.25rem; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-6 > * + * { margin-top: 1.5rem; }
        .space-y-8 > * + * { margin-top: 2rem; }
        .space-y-12 > * + * { margin-top: 3rem; }
        .space-y-16 > * + * { margin-top: 4rem; }
      }
      
      /* Responsive utilities */
      .responsive-hidden {
        display: none;
      }
      
      @media (min-width: ${this.config.breakpoints.tablet}px) {
        .responsive-hidden.tablet\:block {
          display: block;
        }
      }
      
      @media (min-width: ${this.config.breakpoints.desktop}px) {
        .responsive-hidden.desktop\:block {
          display: block;
        }
      }
      
      @media (min-width: ${this.config.breakpoints.wide}px) {
        .responsive-hidden.wide\:block {
          display: block;
        }
      }
      
      /* Mobile navigation */
      .mobile-nav {
        position: relative;
      }
      
      .mobile-menu-toggle {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
      }
      
      .hamburger {
        display: flex;
        flex-direction: column;
        width: 24px;
        height: 18px;
        justify-content: space-between;
      }
      
      .hamburger span {
        display: block;
        height: 2px;
        background: #000;
        transition: all 0.3s ease;
      }
      
      .mobile-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        padding: 1rem;
      }
      
      /* Touch-friendly sizing */
      @media (max-width: ${this.config.breakpoints.tablet - 1}px) {
        button, .btn {
          min-height: 44px;
          min-width: 44px;
        }
        
        input, textarea, select {
          min-height: 44px;
        }
        
        a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
        }
      }
    `
  }

  // Generate responsive utility classes
  generateUtilityClasses(): string {
    return `
      /* Responsive Utility Classes */
      
      /* Display utilities */
      .hidden { display: none !important; }
      .block { display: block !important; }
      .inline { display: inline !important; }
      .inline-block { display: inline-block !important; }
      .flex { display: flex !important; }
      .inline-flex { display: inline-flex !important; }
      .grid { display: grid !important; }
      
      /* Responsive display utilities */
      @media (max-width: ${this.config.breakpoints.tablet - 1}px) {
        .mobile\:hidden { display: none !important; }
        .mobile\:block { display: block !important; }
        .mobile\:flex { display: flex !important; }
        .mobile\:grid { display: grid !important; }
      }
      
      @media (min-width: ${this.config.breakpoints.tablet}px) {
        .tablet\:hidden { display: none !important; }
        .tablet\:block { display: block !important; }
        .tablet\:flex { display: flex !important; }
        .tablet\:grid { display: grid !important; }
      }
      
      @media (min-width: ${this.config.breakpoints.desktop}px) {
        .desktop\:hidden { display: none !important; }
        .desktop\:block { display: block !important; }
        .desktop\:flex { display: flex !important; }
        .desktop\:grid { display: grid !important; }
      }
      
      /* Width utilities */
      .w-full { width: 100% !important; }
      .w-1\/2 { width: 50% !important; }
      .w-1\/3 { width: 33.333% !important; }
      .w-2\/3 { width: 66.666% !important; }
      .w-1\/4 { width: 25% !important; }
      .w-3\/4 { width: 75% !important; }
      
      /* Responsive width utilities */
      @media (max-width: ${this.config.breakpoints.tablet - 1}px) {
        .mobile\:w-full { width: 100% !important; }
        .mobile\:w-1\/2 { width: 50% !important; }
      }
      
      @media (min-width: ${this.config.breakpoints.tablet}px) {
        .tablet\:w-1\/2 { width: 50% !important; }
        .tablet\:w-1\/3 { width: 33.333% !important; }
      }
      
      @media (min-width: ${this.config.breakpoints.desktop}px) {
        .desktop\:w-1\/3 { width: 33.333% !important; }
        .desktop\:w-1\/4 { width: 25% !important; }
      }
      
      /* Text alignment utilities */
      .text-left { text-align: left !important; }
      .text-center { text-align: center !important; }
      .text-right { text-align: right !important; }
      
      /* Responsive text alignment */
      @media (max-width: ${this.config.breakpoints.tablet - 1}px) {
        .mobile\:text-center { text-align: center !important; }
        .mobile\:text-left { text-align: left !important; }
      }
      
      @media (min-width: ${this.config.breakpoints.tablet}px) {
        .tablet\:text-left { text-align: left !important; }
        .tablet\:text-center { text-align: center !important; }
      }
    `
  }
}

// Export utilities
export function generateResponsiveCSS(config: ResponsiveConfig = defaultResponsiveConfig): string {
  const generator = new ResponsiveCSSGenerator(config)
  return generator.generateResponsiveCSS()
}

export function generateUtilityClasses(config: ResponsiveConfig = defaultResponsiveConfig): string {
  const generator = new ResponsiveCSSGenerator(config)
  return generator.generateUtilityClasses()
}

export default useResponsive
