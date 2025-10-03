import { NextRequest, NextResponse } from 'next/server'

// Progressive Enhancement Configuration
export interface ProgressiveEnhancementConfig {
  enableJavaScript: boolean
  enableRealTime: boolean
  enableNetworking: boolean
  enableAdvancedFeatures: boolean
  fallbackMode: boolean
}

// Progressive Enhancement Service
export class ProgressiveEnhancementService {
  private config: ProgressiveEnhancementConfig

  constructor(config: ProgressiveEnhancementConfig) {
    this.config = config
  }

  // Detect client capabilities
  detectCapabilities(request: NextRequest): ProgressiveEnhancementConfig {
    const userAgent = request.headers.get('user-agent') || ''
    const acceptHeader = request.headers.get('accept') || ''
    const connectionHeader = request.headers.get('connection') || ''

    // Detect JavaScript support
    const hasJavaScript = request.headers.get('x-javascript-enabled') === 'true'
    
    // Detect WebSocket support
    const hasWebSocket = userAgent.includes('WebSocket') || 
                        connectionHeader.includes('Upgrade')

    // Detect modern browser features
    const hasModernFeatures = this.detectModernFeatures(userAgent)

    // Detect network conditions
    const networkCondition = this.detectNetworkCondition(request)

    return {
      enableJavaScript: hasJavaScript,
      enableRealTime: hasJavaScript && hasWebSocket && networkCondition !== 'slow',
      enableNetworking: hasJavaScript && hasModernFeatures,
      enableAdvancedFeatures: hasJavaScript && hasModernFeatures && networkCondition === 'fast',
      fallbackMode: !hasJavaScript || networkCondition === 'slow'
    }
  }

  private detectModernFeatures(userAgent: string): boolean {
    // Check for modern browser features
    const modernBrowsers = [
      'Chrome/9', 'Firefox/4', 'Safari/5', 'Edge/12'
    ]
    
    return modernBrowsers.some(browser => userAgent.includes(browser))
  }

  private detectNetworkCondition(request: NextRequest): 'fast' | 'slow' | 'unknown' {
    // Check for network hints
    const saveData = request.headers.get('save-data')
    const connectionType = request.headers.get('connection-type')
    
    if (saveData === 'on' || connectionType === 'slow-2g') {
      return 'slow'
    }
    
    if (connectionType === '4g' || connectionType === 'wifi') {
      return 'fast'
    }
    
    return 'unknown'
  }

  // Generate progressive enhancement HTML
  generateProgressiveHTML(baseHTML: string, capabilities: ProgressiveEnhancementConfig): string {
    let enhancedHTML = baseHTML

    // Add JavaScript enhancements
    if (capabilities.enableJavaScript) {
      enhancedHTML = this.addJavaScriptEnhancements(enhancedHTML)
    }

    // Add real-time features
    if (capabilities.enableRealTime) {
      enhancedHTML = this.addRealTimeFeatures(enhancedHTML)
    }

    // Add networking features
    if (capabilities.enableNetworking) {
      enhancedHTML = this.addNetworkingFeatures(enhancedHTML)
    }

    // Add advanced features
    if (capabilities.enableAdvancedFeatures) {
      enhancedHTML = this.addAdvancedFeatures(enhancedHTML)
    }

    // Add fallback content
    if (capabilities.fallbackMode) {
      enhancedHTML = this.addFallbackContent(enhancedHTML)
    }

    return enhancedHTML
  }

  private addJavaScriptEnhancements(html: string): string {
    return html.replace(
      '<!-- JAVASCRIPT_ENHANCEMENTS -->',
      `
      <script>
        // Progressive enhancement: JavaScript detected
        document.documentElement.classList.add('js-enabled');
        
        // Enhanced form interactions
        document.addEventListener('DOMContentLoaded', function() {
          const forms = document.querySelectorAll('form');
          forms.forEach(form => {
            form.classList.add('enhanced');
            // Add client-side validation
            addClientSideValidation(form);
          });
        });
      </script>
      `
    )
  }

  private addRealTimeFeatures(html: string): string {
    return html.replace(
      '<!-- REALTIME_FEATURES -->',
      `
      <script>
        // Real-time features enabled
        document.documentElement.classList.add('realtime-enabled');
        
        // Initialize WebSocket connection
        if (typeof WebSocket !== 'undefined') {
          initializeWebSocket();
        }
      </script>
      `
    )
  }

  private addNetworkingFeatures(html: string): string {
    return html.replace(
      '<!-- NETWORKING_FEATURES -->',
      `
      <script>
        // Networking features enabled
        document.documentElement.classList.add('networking-enabled');
        
        // Initialize networking components
        initializeNetworking();
      </script>
      `
    )
  }

  private addAdvancedFeatures(html: string): string {
    return html.replace(
      '<!-- ADVANCED_FEATURES -->',
      `
      <script>
        // Advanced features enabled
        document.documentElement.classList.add('advanced-enabled');
        
        // Initialize advanced components
        initializeAdvancedFeatures();
      </script>
      `
    )
  }

  private addFallbackContent(html: string): string {
    return html.replace(
      '<!-- FALLBACK_CONTENT -->',
      `
      <noscript>
        <div class="fallback-notice">
          <h2>JavaScript Required</h2>
          <p>Some features require JavaScript. Please enable JavaScript for the best experience.</p>
          <p>Core functionality is available without JavaScript.</p>
        </div>
      </noscript>
      `
    )
  }

  // Generate CSS for progressive enhancement
  generateProgressiveCSS(): string {
    return `
      /* Progressive Enhancement CSS */
      
      /* Base styles - work without JavaScript */
      .event-card {
        display: block;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        background: white;
      }
      
      .event-card h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
      }
      
      .event-card p {
        margin: 0 0 1rem 0;
        color: #6b7280;
      }
      
      .event-card .actions {
        display: flex;
        gap: 0.5rem;
      }
      
      .btn {
        display: inline-block;
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: white;
        color: #374151;
        text-decoration: none;
        cursor: pointer;
      }
      
      .btn:hover {
        background: #f9fafb;
      }
      
      .btn-primary {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      
      .btn-primary:hover {
        background: #2563eb;
      }
      
      /* Enhanced styles - with JavaScript */
      .js-enabled .event-card {
        transition: all 0.2s ease;
        cursor: pointer;
      }
      
      .js-enabled .event-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .js-enabled .btn {
        transition: all 0.2s ease;
      }
      
      /* Real-time features */
      .realtime-enabled .live-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      /* Networking features */
      .networking-enabled .connection-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      /* Advanced features */
      .advanced-enabled .event-card {
        position: relative;
      }
      
      .advanced-enabled .event-card .quick-actions {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        display: none;
      }
      
      .advanced-enabled .event-card:hover .quick-actions {
        display: flex;
      }
      
      /* Fallback styles */
      .fallback-notice {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
      }
      
      .fallback-notice h2 {
        margin: 0 0 0.5rem 0;
        color: #92400e;
      }
      
      .fallback-notice p {
        margin: 0;
        color: #92400e;
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .event-card {
          padding: 0.75rem;
        }
        
        .event-card .actions {
          flex-direction: column;
        }
        
        .btn {
          width: 100%;
          text-align: center;
        }
      }
      
      /* High contrast mode */
      @media (prefers-contrast: high) {
        .event-card {
          border-width: 2px;
        }
        
        .btn {
          border-width: 2px;
        }
      }
      
      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .event-card,
        .btn {
          transition: none;
        }
        
        .realtime-enabled .live-indicator {
          animation: none;
        }
      }
    `
  }

  // Generate fallback API responses
  generateFallbackResponse(endpoint: string, data: any): NextResponse {
    const fallbackData = {
      ...data,
      fallback: true,
      message: 'This is a fallback response. Enable JavaScript for enhanced features.',
      capabilities: {
        realTime: false,
        networking: false,
        advancedFeatures: false
      }
    }

    return NextResponse.json(fallbackData, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        'X-Fallback': 'true'
      }
    })
  }

  // Check if request supports progressive enhancement
  supportsProgressiveEnhancement(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || ''
    const acceptHeader = request.headers.get('accept') || ''
    
    // Check for basic HTML support
    const supportsHTML = acceptHeader.includes('text/html')
    
    // Check for CSS support
    const supportsCSS = acceptHeader.includes('text/css')
    
    // Check for basic JavaScript support (modern browsers)
    const supportsJS = userAgent.includes('Mozilla') && 
                      !userAgent.includes('MSIE') && 
                      !userAgent.includes('Trident')
    
    return supportsHTML && supportsCSS && supportsJS
  }
}

// Default configuration
export const defaultProgressiveConfig: ProgressiveEnhancementConfig = {
  enableJavaScript: true,
  enableRealTime: true,
  enableNetworking: true,
  enableAdvancedFeatures: true,
  fallbackMode: false
}

// Utility functions for progressive enhancement
export function addProgressiveEnhancement(html: string, capabilities: ProgressiveEnhancementConfig): string {
  const service = new ProgressiveEnhancementService(capabilities)
  return service.generateProgressiveHTML(html, capabilities)
}

export function generateProgressiveCSS(): string {
  const service = new ProgressiveEnhancementService(defaultProgressiveConfig)
  return service.generateProgressiveCSS()
}

export function createFallbackResponse(data: any): NextResponse {
  const service = new ProgressiveEnhancementService(defaultProgressiveConfig)
  return service.generateFallbackResponse('', data)
}

// Client-side progressive enhancement utilities
export const clientProgressiveEnhancement = {
  // Initialize progressive enhancement on client
  init() {
    // Add JavaScript enabled class
    document.documentElement.classList.add('js-enabled')
    
    // Detect WebSocket support
    if (typeof WebSocket !== 'undefined') {
      document.documentElement.classList.add('realtime-enabled')
    }
    
    // Detect modern features
    if (this.detectModernFeatures()) {
      document.documentElement.classList.add('advanced-enabled')
    }
    
    // Initialize enhanced features
    this.initializeEnhancedFeatures()
  },

  detectModernFeatures(): boolean {
    return !!(
      typeof window.fetch === 'function' &&
      window.Promise &&
      window.Map &&
      window.Set &&
      window.Symbol
    )
  },

  initializeEnhancedFeatures() {
    // Enhanced form interactions
    this.enhanceForms()
    
    // Enhanced navigation
    this.enhanceNavigation()
    
    // Enhanced accessibility
    this.enhanceAccessibility()
  },

  enhanceForms() {
    const forms = document.querySelectorAll('form')
    forms.forEach(form => {
      form.classList.add('enhanced')
      
      // Add client-side validation
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault()
        }
      })
    })
  },

  enhanceNavigation() {
    // Add smooth scrolling
    const links = document.querySelectorAll('a[href^="#"]')
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href')!)
        if (target) {
          e.preventDefault()
          target.scrollIntoView({ behavior: 'smooth' })
        }
      })
    })
  },

  enhanceAccessibility() {
    // Add skip links
    this.addSkipLinks()
    
    // Enhance focus management
    this.enhanceFocusManagement()
  },

  addSkipLinks() {
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = 'Skip to main content'
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
    `
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px'
    })
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })
    
    document.body.insertBefore(skipLink, document.body.firstChild)
  },

  enhanceFocusManagement() {
    // Add focus indicators
    const style = document.createElement('style')
    style.textContent = `
      .focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
    `
    document.head.appendChild(style)
  },

  validateForm(form: HTMLFormElement): boolean {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]')
    let isValid = true
    
    inputs.forEach(input => {
      if (!(input as HTMLInputElement).checkValidity()) {
        isValid = false
        input.classList.add('error')
      } else {
        input.classList.remove('error')
      }
    })
    
    return isValid
  }
}

export default ProgressiveEnhancementService
